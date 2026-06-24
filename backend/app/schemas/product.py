from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
from datetime import datetime


class ProductImageResponse(BaseModel):
    id: int
    url: str
    alt_text: Optional[str] = None
    is_primary: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ReviewUserInfo(BaseModel):
    id: int
    full_name: str

    model_config = {"from_attributes": True}


class ProductReviewResponse(BaseModel):
    id: int
    user: ReviewUserInfo
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None
    is_verified_purchase: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class CategoryInfo(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: float
    compare_at_price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    stock_quantity: int = 0
    low_stock_threshold: int = 5
    category_id: Optional[int] = None
    is_active: bool = True
    is_featured: bool = False
    is_bestseller: bool = False
    is_new_arrival: bool = False
    ingredients: Optional[str] = None
    how_to_use: Optional[str] = None
    skin_type: Optional[List[str]] = None
    weight_grams: Optional[float] = None
    tags: Optional[List[str]] = None
    sort_order: int = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[float] = None
    compare_at_price: Optional[float] = None
    cost_price: Optional[float] = None
    sku: Optional[str] = None
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_bestseller: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    ingredients: Optional[str] = None
    how_to_use: Optional[str] = None
    skin_type: Optional[List[str]] = None
    weight_grams: Optional[float] = None
    tags: Optional[List[str]] = None
    sort_order: Optional[int] = None


class ProductResponse(ProductBase):
    id: int
    slug: str
    average_rating: float
    review_count: int
    discount_percentage: int
    images: List[ProductImageResponse] = []
    category: Optional[CategoryInfo] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProductDetailResponse(ProductResponse):
    reviews: List[ProductReviewResponse] = []


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    per_page: int
    pages: int
