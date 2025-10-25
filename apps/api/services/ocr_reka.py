import os, base64
try:
    import reka
except Exception:
    reka = None

REKA_API_KEY = os.getenv("REKA_API_KEY")

def ocr_image_to_text(image_bytes: bytes) -> str:
    if not reka or not REKA_API_KEY:
        # Fallback: pretend it's already text
        return ""
    reka.API_KEY = REKA_API_KEY
    b64 = base64.b64encode(image_bytes).decode()
    # Simplified call; adjust according to your account's SDK version
    resp = reka.chat(messages=[{"role":"user","content":[
        {"type":"input_text","text":"Extract line-broken text from this receipt image."},
        {"type":"input_image","image_data": b64}
    ]}], model="reka-flash")
    return resp.get("text", "")
