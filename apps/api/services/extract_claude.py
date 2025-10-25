import os, json, datetime
try:
    from anthropic import Anthropic
except Exception:
    Anthropic = None

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

RECEIPT_SCHEMA = {
  "merchant":"string",
  "order_id":"string|null",
  "purchase_date":"YYYY-MM-DD|null",
  "items":[{"name":"string","sku":"string|null","qty":1,"unit_price":0.0}]
}

def _fallback_parse(receipt_text:str) -> dict:
    # extremely simple demo parser
    today = datetime.date.today()
    return {
        "merchant": "Amazon",
        "order_id": "ORDER-" + today.strftime("%y%m%d"),
        "purchase_date": (today - datetime.timedelta(days=7)).isoformat(),
        "items": [{"name":"Sample Item","sku":None,"qty":1,"unit_price":29.99}]
    }

def extract_order_fields(receipt_text: str) -> dict:
    if not ANTHROPIC_API_KEY or not Anthropic:
        return _fallback_parse(receipt_text or "")
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    prompt = f"""Extract fields from the receipt below. ONLY return strict JSON with keys: {json.dumps(RECEIPT_SCHEMA)}.
Rules:
- Normalize dates to YYYY-MM-DD.
- Use null if unknown.
Receipt:
---
{receipt_text}
---"""
    msg = client.messages.create(
        model="claude-3-5-sonnet-latest",
        max_tokens=800,
        messages=[{"role":"user","content":prompt}]
    )
    try:
        return json.loads(msg.content[0].text)
    except Exception:
        return _fallback_parse(receipt_text)

POLICY_SCHEMA = {
  "window_days": 0,
  "restocking_fee_pct": 0,
  "in_store_allowed": True,
  "mail_allowed": True,
  "return_bar_supported": False,
  "requires_rma": False,
  "notes": "string"
}

def summarize_policy(policy_text: str) -> dict:
    if not ANTHROPIC_API_KEY or not Anthropic:
        return {**POLICY_SCHEMA, "window_days":30, "notes":"Demo policy (fallback)"}
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    prompt = f"""Given this retailer return policy text, return JSON with keys {json.dumps(POLICY_SCHEMA)}.
Be conservative; if unstated, set false/0 and add a note.
---
{policy_text}
---"""
    msg = client.messages.create(
        model="claude-3-5-sonnet-latest",
        max_tokens=600,
        messages=[{"role":"user","content":prompt}]
    )
    try:
        return json.loads(msg.content[0].text)
    except Exception:
        return {**POLICY_SCHEMA, "window_days":30, "notes":"Demo policy (fallback)"}
