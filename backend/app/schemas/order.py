from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.order import OrderStatus, PaymentStatus


class CartItemInput(BaseModel):
    product_id: int
    quantity: int


class ShippingAddress(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    country: str = "US"


class CheckoutRequest(BaseModel):
    items: List[CartItemInput]
    shipping_address: ShippingAddress
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    product_sku: Optional[str]
    quantity: int
    unit_price: float
    total_price: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    payment_status: PaymentStatus
    subtotal: float
    shipping_cost: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    customer_email: str
    customer_name: str
    shipping_address_line1: str
    shipping_address_line2: Optional[str]
    shipping_city: str
    shipping_state: str
    shipping_zip: str
    shipping_country: str
    tracking_number: Optional[str]
    notes: Optional[str]
    items: List[OrderItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    tracking_number: Optional[str] = None


class PaymentIntentResponse(BaseModel):
    client_secret: str
    order_id: int
    order_number: str
    amount: int
    currency: str = "usd"


class CategoryBase(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: int
    slug: str
    product_count: Optional[int] = 0
    created_at: datetime

    model_config = {"from_attributes": True}
