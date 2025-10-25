from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from ..db import SessionLocal, engine
from ..models import Order, LineItem
from ..seed import policies

router = APIRouter()
from ..db import Base
Base.metadata.create_all(bind=engine)

def order_json(o: Order):
    return {"id": o.id, "merchant": o.merchant, "order_id_text": o.order_id_text,
            "purchase_date": o.purchase_date, "deadline_date": o.deadline_date,
            "days_remaining": o.days_remaining}

@router.get("/orders")
def list_orders():
    db: Session = SessionLocal()
    arr = db.query(Order).order_by(Order.id.desc()).all()
    return {"orders":[order_json(o) for o in arr]}

@router.get("/order/{order_id}")
def get_order(order_id: int):
    db: Session = SessionLocal()
    o = db.get(Order, order_id)
    if not o: raise HTTPException(404, "No such order")
    return order_json(o)

@router.get("/order/{order_id}/options")
def options(order_id: int, lat: float | None = None, lng: float | None = None):
    db: Session = SessionLocal()
    o = db.get(Order, order_id)
    if not o: raise HTTPException(404, "No such order")
    opts = []
    if policies.supports_return_bar(o.merchant):
        opts.append({"id":"return_bar","label":"Drop at a Return Bar (no box/label)","cta":"Find locations"})
    if policies.supports_label_broker(o.merchant):
        opts.append({"id":"label_broker","label":"USPS Label Broker (show QR at counter)","cta":"Get instructions"})
    opts.append({"id":"usps_pickup","label":"USPS Carrier Pickup","cta":"Schedule pickup"})
    opts.append({"id":"merchant_portal","label":"Open store return portal","cta":"Open"})
    return {"order_id": order_id, "options": opts}
