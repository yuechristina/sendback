import os, json, datetime, re, base64, httpx
from typing import Optional

try:
    from anthropic import Anthropic  # optional direct fallback
except Exception:
    Anthropic = None

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
LAVA_FORWARD_TOKEN = os.getenv("LAVA_FORWARD_TOKEN")
ANTHROPIC_MODEL = "claude-3-5-sonnet-latest"

RECEIPT_SCHEMA = {
  "merchant":"string",
  "order_id":"string|null",
  "purchase_date":"YYYY-MM-DD|null",
  "items":[{"name":"string","sku":"string|null","qty":1,"unit_price":0.0}]
}

POLICY_SCHEMA = {
  "window_days": 0,
  "restocking_fee_pct": 0,
  "in_store_allowed": True,
  "mail_allowed": True,
  "return_bar_supported": False,
  "requires_rma": False,
  "notes": "string"
}

def _coerce_json(s: str) -> dict:
    s = (s or "").strip()
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", s, flags=re.S)
    if m:
        s = m.group(1)
    return json.loads(s)

def _fallback_parse(receipt_text:str) -> dict:
    # very conservative fallback
    return {"merchant": "Unknown", "order_id": None, "purchase_date": None, "items": []}

def _lava_forward(payload: dict) -> dict:
    if not LAVA_FORWARD_TOKEN:
        raise RuntimeError("LAVA_FORWARD_TOKEN not set")
    url = "https://api.lavapayments.com/v1/forward"
    params = {"u": "https://api.anthropic.com/v1/messages"}
    headers = {
        "Authorization": f"Bearer {LAVA_FORWARD_TOKEN}",
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
    }
    with httpx.Client(timeout=60.0) as client:
        r = client.post(url, params=params, headers=headers, json=payload)
        r.raise_for_status()
        return r.json()

def _anthropic_text_via_lava(prompt: str, max_tokens:int=800) -> str:
    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": max_tokens,
        "messages": [{"role":"user","content": prompt}]
    }
    resp = _lava_forward(payload)
    content = resp.get("content") or []
    if content and isinstance(content, list):
        first = content[0]
        if isinstance(first, dict) and first.get("type") == "text":
            return first.get("text","")
    return ""

def _anthropic_vision_via_lava(prompt_text: str, image_bytes: bytes, media_type: str, max_tokens:int=800) -> str:
    b64 = base64.b64encode(image_bytes).decode()
    payload = {
        "model": ANTHROPIC_MODEL,
        "max_tokens": max_tokens,
        "messages": [{
            "role":"user",
            "content":[
                {"type":"text","text": prompt_text},
                {"type":"image","source":{"type":"base64","media_type": media_type,"data": b64}}
            ]
        }]
    }
    resp = _lava_forward(payload)
    content = resp.get("content") or []
    if content and isinstance(content, list):
        first = content[0]
        if isinstance(first, dict) and first.get("type") == "text":
            return first.get("text","")
    return ""

def _extract_pdf_text(pdf_bytes: bytes) -> str:
    try:
        import io
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(pdf_bytes))
        out = []
        for page in reader.pages[:10]:
            out.append(page.extract_text() or "")
        return "\n".join(out).strip()
    except Exception:
        return ""

def extract_order_fields(receipt_text: str, image_bytes: Optional[bytes]=None, media_type: Optional[str]=None) -> dict:
    """
    Order of attempts:
      1) If image bytes (image/*) present → send to Claude Vision via Lava.
      2) If PDF bytes present → extract text locally, then send as text.
      3) If text present → send as text.
      4) Fallback.
    """
    sys_prompt = (
        "You are a precise parser. Output MUST be valid JSON with NO extra text or fences.\n"
        f"Return EXACTLY one JSON object with keys {json.dumps(RECEIPT_SCHEMA)}.\n"
        "- Dates MUST be YYYY-MM-DD; use null if unknown.\n"
        "- Items is an array; each item has name, optional sku, qty (int), unit_price (float).\n"
        "- Do not invent fields; prefer null over guessing.\n"
    )

    # 1) Vision (images)
    if image_bytes and media_type and media_type.startswith("image/") and LAVA_FORWARD_TOKEN:
        try:
            print("[extract_order_fields] using LAVA vision path")
            text = _anthropic_vision_via_lava(sys_prompt + "\nExtract fields from this receipt image.", image_bytes, media_type, 800)
            print("[extract_order_fields] vision text:", (text or "")[:200].replace("\n"," "))
            return _coerce_json(text)
        except Exception as e:
            print("[extract_order_fields] vision path failed:", repr(e))

    # 2) PDF → text
    if (not receipt_text) and image_bytes and media_type == "application/pdf":
        extracted = _extract_pdf_text(image_bytes)
        if extracted:
            receipt_text = extracted

    prompt = (
        sys_prompt +
        "\nReceipt text:\n---\n" +
        (receipt_text or "") +
        "\n---"
    )

    # 3) Text via Lava
    if LAVA_FORWARD_TOKEN and (receipt_text or media_type == "application/pdf"):
        try:
            print("[extract_order_fields] using LAVA forward (text)")
            text = _anthropic_text_via_lava(prompt, max_tokens=800)
            print("[extract_order_fields] lava text:", (text or "")[:200].replace("\n"," "))
            return _coerce_json(text)
        except Exception as e:
            print("[extract_order_fields] lava text path failed:", repr(e))

    # 4) Direct Anthropic SDK fallback (text)
    if ANTHROPIC_API_KEY and Anthropic and (receipt_text or media_type == "application/pdf"):
        try:
            print("[extract_order_fields] using direct Anthropic SDK (text)")
            client = Anthropic(api_key=ANTHROPIC_API_KEY)
            msg = client.messages.create(
                model=ANTHROPIC_MODEL, max_tokens=800,
                messages=[{"role":"user","content": prompt}]
            )
            return _coerce_json(msg.content[0].text)
        except Exception as e:
            print("[extract_order_fields] anthropic sdk failed:", repr(e))

    print("[extract_order_fields] falling back parser")
    return _fallback_parse(receipt_text or "")

def summarize_policy(policy_text: str) -> dict:
    prompt = (
        "You are a precise parser. Output MUST be valid JSON with NO extra text or fences.\n"
        f"Return EXACTLY one JSON object with keys {json.dumps(POLICY_SCHEMA)}.\n"
        "Be conservative; if unstated, set false/0 and add a helpful note.\n\n"
        "Policy snippet:\n---\n" + (policy_text or "") + "\n---"
    )

    if LAVA_FORWARD_TOKEN:
        try:
            print("[summarize_policy] using LAVA forward")
            text = _anthropic_text_via_lava(prompt, max_tokens=600)
            return _coerce_json(text)
        except Exception as e:
            print("[summarize_policy] lava policy failed:", repr(e))

    if ANTHROPIC_API_KEY and Anthropic:
        try:
            print("[summarize_policy] using direct Anthropic SDK")
            client = Anthropic(api_key=ANTHROPIC_API_KEY)
            msg = client.messages.create(
                model=ANTHROPIC_MODEL, max_tokens=600,
                messages=[{"role":"user","content": prompt}]
            )
            return _coerce_json(msg.content[0].text)
        except Exception as e:
            print("[summarize_policy] anthropic sdk failed:", repr(e))

    return {**POLICY_SCHEMA, "window_days":30, "notes":"Demo policy (fallback)"}
