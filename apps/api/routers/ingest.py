import time, datetime, json, mimetypes
from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services import ocr_reka, extract_claude
from ..db import SessionLocal, engine
from ..models import Order, LineItem
from sqlalchemy.orm import Session
from ..seed import policies

router = APIRouter()
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
    fn = (file.filename or "").lower()
    # Guess media type
    mime = file.content_type or mimetypes.guess_type(fn)[0] or ""

    # Get text if we can (txt or pdf via local extractor), but also pass bytes for Vision
    text = ""
    if fn.endswith(".txt"):
        try:
            text = b.decode(errors="ignore")
        except Exception:
            text = ""
    elif fn.endswith(".pdf"):
        # Let extractor handle PDF text internally
        pass
    elif fn.endswith((".png", ".jpg", ".jpeg")):
        # If you have REKA key, use OCR; otherwise we'll rely on Vision
        try:
            text = ocr_reka.ocr_image_to_text(b) or ""
        except Exception:
            text = ""

    # Call the extractor with both text and (optional) bytes
    fields = extract_claude.extract_order_fields(text, image_bytes=b, media_type=mime)

    merchant = fields.get("merchant") or "Unknown"
    purchase_date = fields.get("purchase_date") or datetime.date.today().isoformat()
    deadline_iso, days_remaining = compute_deadline(purchase_date, merchant)

    db: Session = SessionLocal()
    order = Order(
        merchant=merchant,
        order_id_text=fields.get("order_id") or "N/A",
        purchase_date=purchase_date,
        deadline_date=deadline_iso,
        days_remaining=days_remaining,
        total_amount=0.0
    )
    db.add(order); db.commit(); db.refresh(order)

    for it in fields.get("items", []) or []:
        li = LineItem(
            order_id=order.id,
            name=it.get("name","Item"),
            sku=it.get("sku") or "",
            quantity=int(it.get("qty") or 1),
            unit_price=float(it.get("unit_price") or 0.0)
        )
        db.add(li)
    db.commit()

    return {"ok": True, "order": {
        "id": order.id,
        "merchant": order.merchant,
        "order_id_text": order.order_id_text,
        "purchase_date": order.purchase_date,
        "deadline_date": order.deadline_date,
        "days_remaining": order.days_remaining
    }}
