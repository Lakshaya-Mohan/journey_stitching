from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True)
    health_score = Column(Float, default=100.0)
    churn_risk = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    events = relationship("JourneyEvent", back_populates="customer")

class JourneyEvent(Base):
    __tablename__ = "journey_events"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    device_id = Column(String, index=True)
    channel = Column(String, index=True) # Mobile, Web, Call Center, Branch, ATM
    event_type = Column(String, index=True) # Login, Transfer, Error, etc.
    status = Column(String, index=True) # Success, Failed, Pending
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    metadata_json = Column(String, default="{}") # Store extra data as JSON string

    customer = relationship("Customer", back_populates="events")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    severity = Column(String, index=True) # High, Medium, Low
    affected_customers_count = Column(Integer, default=0)
    business_impact = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    ai_root_cause = Column(String)
    recommended_resolution = Column(String)
    status = Column(String, default="Open")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
