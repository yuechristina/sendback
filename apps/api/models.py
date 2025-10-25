from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .db import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    merchant = Column(String, index=True)
    order_id_text = Column(String)
    purchase_date = Column(String)  # ISO date string
    deadline_date = Column(String)  # ISO date
    days_remaining = Column(Integer)
    total_amount = Column(Float, default=0.0)
    source = Column(String, default="upload")
    items = relationship("LineItem", back_populates="order", cascade="all, delete-orphan")

class LineItem(Base):
    __tablename__ = "line_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    name = Column(String)
    sku = Column(String)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    order = relationship("Order", back_populates="items")
