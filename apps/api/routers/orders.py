from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from ..db import SessionLocal, engine
from ..models import Order, LineItem
from ..seed import policies
import datetime

router = APIRouter()
from ..db import Base
Base.metadata.create_all(bind=engine)

def _get_order_or_404(db: Session, oid: int) -> Order:
    o = db.query(Order).filter(Order.id == oid).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return o

# apps/api/routers/orders.py (replace _eligibility_reason + /eligibility)
def _eligibility_reason(order: Order) -> tuple[bool, str]:
    today = datetime.date.today()
    try:
        deadline = datetime.date.fromisoformat(order.deadline_date)
    except Exception:
        deadline = today

    if today > deadline:
        return (False, "Past the return window")

    # Policy-level constraints (defensive)
    try:
        pol = getattr(policies, "policy_for", None)
        pol = pol(order.merchant) if callable(pol) else None
    except Exception:
        pol = None

    if pol is None:
        # If we don't know, allow user to try (the UI still enforces deadline).
        return (True, "")

    if not (bool(pol.get("mail_allowed")) or bool(pol.get("in_store_allowed"))):
        return (False, "Retailer does not allow returns")

    return (True, "")

@router.get("/order/{order_id}/eligibility")
def order_eligibility(order_id: int):
    try:
        db = SessionLocal()
        o = _get_order_or_404(db, order_id)
        ok, reason = _eligibility_reason(o)
        return {"ok": ok, "reason": reason}
    except HTTPException:
        # propagate 404s etc.
        raise
    except Exception as e:
        # never leak a 500 string back to the client
        return {"ok": False, "reason": "Unknown"}


@router.get("/order/{order_id}/items")
def order_items(order_id: int):
    db = SessionLocal()
    o = _get_order_or_404(db, order_id)
    items = (
        db.query(LineItem)
        .filter(LineItem.order_id == o.id)
        .order_by(LineItem.id.asc())
        .all()
    )
    return {"items": [
        {"id": it.id, "name": it.name, "sku": it.sku, "quantity": it.quantity, "unit_price": float(it.unit_price)}
        for it in items
    ]}

@router.get("/order/{order_id}/eligibility")
def order_eligibility(order_id: int):
    db = SessionLocal()
    o = _get_order_or_404(db, order_id)
    ok, reason = _eligibility_reason(o)
    return {"ok": ok, "reason": reason}

@router.get("/order/{order_id}/options")
def order_options(order_id: int):
    db: Session = SessionLocal()
    o = _get_order_or_404(db, order_id)
    pol = getattr(policies, "policy_for", lambda m: {})(o.merchant) or {}

    opts = []
    if pol.get("mail_allowed"):
        opts.append({"id": "mail", "label": "Mail-in return", "cta": "Set up mail return"})
    if pol.get("in_store_allowed"):
        opts.append({"id": "dropoff", "label": "In-person drop-off", "cta": "Find a drop-off"})

    # If nothing available, always offer a portal link
    if not opts:
        # you can store actual URLs in your policies.json,
        # or fall back to a Google search link
        url = pol.get("portal_url") or f"https://www.google.com/search?q={o.merchant}+returns"
        opts.append({
            "id": "merchant_portal",
            "label": f"{o.merchant} return portal",
            "cta": "Open return site",
            "url": url
        })

    return {"options": opts}


@router.post("/order/{order_id}/initiate")
def order_initiate(order_id: int, payload: dict):
    """
    Body: { "item_ids": [int], "method": "mail" | "dropoff" }
    Returns a next_step url or instructions.
    """
    db = SessionLocal()
    o = _get_order_or_404(db, order_id)
    ok, reason = _eligibility_reason(o)
    if not ok:
        raise HTTPException(status_code=400, detail=reason)

    item_ids = payload.get("item_ids") or []
    method = (payload.get("method") or "").lower()
    if method not in ("mail", "dropoff"):
        raise HTTPException(status_code=400, detail="Invalid method")

    # (Optional) validate item ids belong to this order
    valid_ids = {i.id for i in db.query(LineItem).filter(LineItem.order_id == o.id).all()}
    for iid in item_ids:
        if iid not in valid_ids:
            raise HTTPException(status_code=400, detail=f"Invalid item id {iid}")

    # Return where the frontend should send the user next:
    if method == "mail":
        return {"ok": True, "next": f"/order/{order_id}/mail"}
    else:
        return {"ok": True, "next": f"/order/{order_id}/dropoff"}

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

# @router.get("/order/{order_id}/options")
# def options(order_id: int, lat: float | None = None, lng: float | None = None):
#     db: Session = SessionLocal()
#     o = db.get(Order, order_id)
#     if not o: raise HTTPException(404, "No such order")
#     opts = []
#     if policies.supports_return_bar(o.merchant):
#         opts.append({"id":"return_bar","label":"Drop at a Return Bar (no box/label)","cta":"Find locations"})
#     if policies.supports_label_broker(o.merchant):
#         opts.append({"id":"label_broker","label":"USPS Label Broker (show QR at counter)","cta":"Get instructions"})
#     opts.append({"id":"usps_pickup","label":"USPS Carrier Pickup","cta":"Schedule pickup"})
#     opts.append({"id":"merchant_portal","label":"Open store return portal","cta":"Open"})
#     return {"order_id": order_id, "options": opts}
