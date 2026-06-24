import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.core.database import get_db
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.product import Product
from app.models.user import User
from app.api.deps import get_current_user, get_current_admin
from app.schemas.order import CheckoutRequest, OrderResponse, OrderStatusUpdate

router = APIRouter()


def generate_order_number() -> str:
    return f"SS-{uuid.uuid4().hex[:8].upper()}"


def calculate_shipping(subtotal: float) -> float:
    return 0.0 if subtotal >= 75 else 9.99


def calculate_tax(subtotal: float, shipping: float) -> float:
    return round((subtotal + shipping) * 0.08, 2)


@router.post("/", response_model=dict, status_code=201)
def create_order(
    data: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    order_items_data = []
    subtotal = 0.0

    for item_input in data.items:
        product = db.query(Product).filter(
            Product.id == item_input.product_id, Product.is_active == True
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_input.product_id} not found")
        if product.stock_quantity < item_input.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        line_total = product.price * item_input.quantity
        subtotal += line_total
        order_items_data.append({
            "product": product,
            "quantity": item_input.quantity,
            "unit_price": product.price,
            "total_price": line_total,
        })

    shipping_cost = calculate_shipping(subtotal)
    tax_amount = calculate_tax(subtotal, shipping_cost)
    total = round(subtotal + shipping_cost + tax_amount, 2)

    addr = data.shipping_address
    order = Order(
        order_number=generate_order_number(),
        user_id=current_user.id if current_user else None,
        status=OrderStatus.PENDING,
        payment_status=PaymentStatus.PENDING,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        tax_amount=tax_amount,
        discount_amount=0.0,
        total_amount=total,
        customer_email=addr.email,
        customer_name=addr.full_name,
        customer_phone=addr.phone,
        shipping_address_line1=addr.address_line1,
        shipping_address_line2=addr.address_line2,
        shipping_city=addr.city,
        shipping_state=addr.state,
        shipping_zip=addr.zip_code,
        shipping_country=addr.country,
        notes=data.notes,
    )
    db.add(order)
    db.flush()

    for item_data in order_items_data:
        product = item_data["product"]
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            product_name=product.name,
            product_sku=product.sku,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            total_price=item_data["total_price"],
            product_snapshot={"name": product.name, "price": product.price, "sku": product.sku},
        )
        db.add(order_item)
        product.stock_quantity -= item_data["quantity"]

    db.commit()
    db.refresh(order)
    return {"order_id": order.id, "order_number": order.order_number, "total_amount": order.total_amount}


@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/{order_number}", response_model=OrderResponse)
def get_order(
    order_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.order_number == order_number)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    from app.models.user import UserRole
    if current_user.role != UserRole.ADMIN and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return OrderResponse.model_validate(order)


@router.get("/", response_model=List[OrderResponse])
def list_all_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[OrderStatus] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    query = db.query(Order).options(joinedload(Order.items))
    if status:
        query = query.filter(Order.status == status)
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return [OrderResponse.model_validate(o) for o in orders]


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = data.status
    if data.tracking_number:
        order.tracking_number = data.tracking_number

    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)
