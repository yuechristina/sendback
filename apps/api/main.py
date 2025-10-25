import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import ingest, policy, orders

app = FastAPI(title="sendback API")

# allow local web app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(policy.router)
app.include_router(orders.router)

@app.get("/health")
def health():
    return {"ok": True}
