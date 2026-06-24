import os
import uuid
import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from app.core.database import get_db
from app.core.config import settings
from app.models.product import Product, ProductImage, ProductReview
from app.models.user import User
from app.api.deps import get_current_admin, get_current_user, get_optional_user
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductDetailResponse,
    ProductListResponse, ReviewCreate, ProductReviewResponse,
)

router = APIRouter()


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)


def build_product_response(product: Product) -> dict:
    return ProductResponse.model_validate(product)


@router.get("/", response_model=ProductListResponse)
def list_products(
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    category_slug: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_featured: Optional[bool] = None,
    is_bestseller: Optional[bool] = None,
    is_new_arrival: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
):
    query = (
        db.query(Product)
        .options(joinedload(Product.images), joinedload(Product.category), joinedload(Product.reviews))
        .filter(Product.is_active == True)
    )

    if category_slug:
        from app.models.category import Category
        cat = db.query(Category).filter(Category.slug == category_slug).first()
        if cat:
            query = query.filter(Product.category_id == cat.id)

    if search:
        query = query.filter(
            or_(Product.name.ilike(f"%{search}%"), Product.description.ilike(f"%{search}%"))
        )

    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)
    if is_bestseller is not None:
        query = query.filter(Product.is_bestseller == is_bestseller)
    if is_new_arrival is not None:
        query = query.filter(Product.is_new_arrival == is_new_arrival)

    sort_col = getattr(Product, sort_by, Product.created_at)
    query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

    total = query.count()
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in products],
        total=total,
        page=page,
        per_page=per_page,
        pages=-(-total // per_page),
    )


@router.get("/featured", response_model=List[ProductResponse])
def get_featured_products(limit: int = 8, db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        .options(joinedload(Product.images), joinedload(Product.category), joinedload(Product.reviews))
        .filter(Product.is_active == True, Product.is_featured == True)
        .limit(limit)
        .all()
    )
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/{slug}", response_model=ProductDetailResponse)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.category),
            joinedload(Product.reviews).joinedload(ProductReview.user),
        )
        .filter(Product.slug == slug, Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductDetailResponse.model_validate(product)


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    slug = slugify(data.name)
    base_slug = slug
    counter = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    product = Product(**data.model_dump(), slug=slug)
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()


@router.post("/{product_id}/images", response_model=dict)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, "products", filename)
    os.makedirs(os.path.dirname(upload_path), exist_ok=True)

    with open(upload_path, "wb") as f:
        f.write(content)

    if is_primary:
        db.query(ProductImage).filter(ProductImage.product_id == product_id).update({"is_primary": False})

    sort_order = db.query(ProductImage).filter(ProductImage.product_id == product_id).count()
    image = ProductImage(
        product_id=product_id,
        url=f"/uploads/products/{filename}",
        is_primary=is_primary or sort_order == 0,
        sort_order=sort_order,
    )
    db.add(image)
    db.commit()
    db.refresh(image)

    return {"id": image.id, "url": image.url, "is_primary": image.is_primary}


@router.post("/{product_id}/reviews", response_model=ProductReviewResponse, status_code=201)
def add_review(
    product_id: int,
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(ProductReview).filter(
        ProductReview.product_id == product_id,
        ProductReview.user_id == current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this product")

    review = ProductReview(
        product_id=product_id,
        user_id=current_user.id,
        rating=data.rating,
        title=data.title,
        body=data.body,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ProductReviewResponse.model_validate(review)
