from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class JourneyEventBase(BaseModel):
    device_id: str
    channel: str
    event_type: str
    status: str
    timestamp: datetime
    metadata_json: str

class JourneyEventCreate(JourneyEventBase):
    customer_id: Optional[int] = None

class JourneyEvent(JourneyEventBase):
    id: int
    customer_id: Optional[int]

    class Config:
        from_attributes = True

class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    health_score: float
    churn_risk: float

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: datetime
    events: List[JourneyEvent] = []

    class Config:
        from_attributes = True

class IncidentBase(BaseModel):
    title: str
    severity: str
    affected_customers_count: int
    business_impact: float
    confidence_score: float
    ai_root_cause: str
    recommended_resolution: str
    status: str

class IncidentCreate(IncidentBase):
    pass

class Incident(IncidentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentStatusUpdate(BaseModel):
    status: str
