from pydantic import BaseModel
import webbrowser

class USPSPickupArgs(BaseModel):
    address:str
    date:str
    package_count:int=1
    weight_lbs:float=1.0

def open_usps_pickup(_: USPSPickupArgs):
    webbrowser.open("https://tools.usps.com/schedule-pickup-steps.htm")
    return {"status":"opened"}

class ReturnBarArgs(BaseModel):
    merchant:str
    lat:float|None=None
    lng:float|None=None

def open_return_bar_map(_: ReturnBarArgs):
    webbrowser.open("https://locations.happyreturns.com/")
    return {"status":"opened"}

class MerchantPortalArgs(BaseModel):
    merchant:str
    order_id:str

def open_merchant_portal(args: MerchantPortalArgs):
    webbrowser.open(f"https://www.google.com/search?q={args.merchant}+return+portal")
    return {"status":"opened"}
