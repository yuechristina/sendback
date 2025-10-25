from fastapi import APIRouter, Query
from ..services import extract_claude
from ..seed import policies

router = APIRouter()

@router.get("/policy")
def policy(merchant: str, text: str | None = None):
    snippet = text or policies.text_for(merchant)
    data = extract_claude.summarize_policy(snippet)
    return {"merchant": merchant, "policy": data}
