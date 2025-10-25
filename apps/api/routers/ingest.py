import time, datetime, json
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services import ocr_reka, extract_claude
from ..db import SessionLocal, engine
from ..models import Order, LineItem
from sqlalchemy.orm import Session
from ..seed import policies

router = APIRouter()

# create tables if not exist
from ..db import Base
Base.metadata.create_all(bind=engine)

def compute_deadline(purchase_date_iso:str, merchant:str)->tuple[str,int]:
    today = datetime.date.today()
    try:
        pdate = datetime.date.fromisoformat(purchase_date_iso)
    except Exception:
        pdate = today
    window = policies.window_for(merchant)
    deadline = pdate + datetime.timedelta(days=window)
    return (deadline.isoformat(), (deadline - today).days)

@router.post("/ingest/receipt")
async def ingest_receipt(file: UploadFile = File(...)):
    b = await file.read()
    text = ""
    if file.filename.lower().endswith((".png",".jpg",".jpeg",".pdf")):
        text = ocr_reka.ocr_image_to_text(b)
    else:
        try:
            text = b.decode(errors="ignore")
        except Exception:
            text = ""
    t0 = time.time()
    fields = extract_claude.extract_order_fields(text)
    merchant = fields.get("merchant") or "Unknown"
    purchase_date = fields.get("purchase_date") or datetime.date.today().isoformat()
    deadline_iso, days_remaining = compute_deadline(purchase_date, merchant)
    # persist
    db: Session = SessionLocal()
    order = Order(merchant=merchant, order_id_text=fields.get("order_id") or "N/A",
                  purchase_date=purchase_date, deadline_date=deadline_iso,
                  days_remaining=days_remaining, total_amount=0.0)
    db.add(order); db.commit(); db.refresh(order)
    for it in fields.get("items", []):
        li = LineItem(order_id=order.id, name=it.get("name","Item"),
                      sku=it.get("sku") or "", quantity=it.get("qty") or 1,
                      unit_price=it.get("unit_price") or 0.0)
        db.add(li)
    db.commit()
    return {"ok":True, "order": {"id":order.id,"merchant":order.merchant,"order_id_text":order.order_id_text,
            "purchase_date":order.purchase_date,"deadline_date":order.deadline_date,"days_remaining":order.days_remaining}}
