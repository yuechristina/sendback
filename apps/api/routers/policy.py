from fastapi import APIRouter, Query
from ..services import extract_claude
from ..seed import policies
import os

router = APIRouter()

@router.get("/policy")
def policy(merchant: str, text: str | None = None):
    if os.getenv("ANTHROPIC_API_KEY"):
        snippet = text or policies.text_for(merchant)
        data = extract_claude.summarize_policy(snippet)
        return {"merchant": merchant, "policy": data}
    else:
        merchant_data = policies.DATA.get(merchant.lower())
    
        if merchant_data:
            # Return the actual data from policies.json
            return {
                "merchant": merchant,
                "policy": {
                    "window_days": merchant_data.get("window_days", 30),
                    "restocking_fee_pct": merchant_data.get("restocking_fee_pct", 0),
                    "in_store_allowed": merchant_data.get("in_store_allowed", True),
                    "mail_allowed": merchant_data.get("mail_allowed", True),
                    "return_bar_supported": merchant_data.get("return_bar_supported", False),
                    "requires_rma": merchant_data.get("requires_rma", False),
                    "notes": merchant_data.get("text", "")
                }
            }
        else:
            # Fallback for unknown merchants
            return {
                "merchant": merchant,
                "policy": {
                    "window_days": 30,
                    "restocking_fee_pct": 0,
                    "in_store_allowed": True,
                    "mail_allowed": True,
                    "return_bar_supported": False,
                    "requires_rma": False,
                    "notes": "30-day returns (demo fallback)"
                }
            }
        