import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.config import settings
from app.models.order import Order, OrderStatus, PaymentStatus
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()
stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/create-payment-intent")
def create_payment_intent(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.payment_status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Order already paid")

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Payment service not configured")

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(order.total_amount * 100),
            currency="usd",
            metadata={
                "order_id": str(order.id),
                "order_number": order.order_number,
            },
        )
        order.stripe_payment_intent_id = intent.id
        order.status = OrderStatus.PAYMENT_PENDING
        db.commit()

        return {
            "client_secret": intent.client_secret,
            "order_id": order.id,
            "order_number": order.order_number,
            "amount": intent.amount,
            "currency": intent.currency,
            "publishable_key": settings.STRIPE_PUBLISHABLE_KEY,
        }
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    db = next(get_db())
    try:
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            order_id = int(payment_intent["metadata"].get("order_id", 0))
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                order.payment_status = PaymentStatus.PAID
                order.status = OrderStatus.CONFIRMED
                db.commit()

        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            order_id = int(payment_intent["metadata"].get("order_id", 0))
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                order.payment_status = PaymentStatus.FAILED
                db.commit()
    finally:
        db.close()

    return {"received": True}


@router.get("/config")
def get_stripe_config():
    return {"publishable_key": settings.STRIPE_PUBLISHABLE_KEY}
