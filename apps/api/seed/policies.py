import json, os

DATA = {}
path = os.path.join(os.path.dirname(__file__), "policies.json")
with open(path, "r") as f:
    arr = json.load(f)
    for x in arr:
        DATA[x["merchant"].lower()] = x

def text_for(merchant:str)->str:
    return DATA.get(merchant.lower(), {"text":"30-day returns (demo)."})["text"]

def window_for(merchant:str)->int:
    return DATA.get(merchant.lower(), {"window_days":30}).get("window_days", 30)

def supports_return_bar(merchant:str)->bool:
    return DATA.get(merchant.lower(), {}).get("return_bar_supported", False)

def supports_label_broker(merchant:str)->bool:
    # Simplified demo heuristic: many merchants using USPS labels support Label Broker
    return DATA.get(merchant.lower(), {}).get("mail_allowed", True)
