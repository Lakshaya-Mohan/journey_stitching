from fastapi import FastAPI, Depends, HTTPException, WebSocket
from sqlalchemy.orm import Session
import asyncio
from typing import List
import json
import random
import datetime

import models, schemas, crud
from database import engine, SessionLocal
from journey_stitcher import stitch_journey

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JourneyIQ API", description="AI-Powered Cross-Channel Customer Journey Intelligence Platform")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/customers", response_model=List[schemas.Customer])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    customers = crud.get_customers(db, skip=skip, limit=limit)
    return customers

@app.get("/api/customers/{customer_id}", response_model=schemas.Customer)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    db_customer = crud.get_customer(db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer

@app.get("/api/events", response_model=List[schemas.JourneyEvent])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    events = crud.get_events(db, skip=skip, limit=limit)
    return events

@app.get("/api/incidents", response_model=List[schemas.Incident])
def read_incidents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    incidents = crud.get_incidents(db, skip=skip, limit=limit)
    return incidents

@app.put("/api/incidents/{incident_id}/status", response_model=schemas.Incident)
def update_incident_status(incident_id: int, status_update: schemas.IncidentStatusUpdate, db: Session = Depends(get_db)):
    db_incident = crud.update_incident_status(db, incident_id=incident_id, new_status=status_update.status)
    if db_incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return db_incident


@app.get("/api/journey/{customer_id}/stitched")
def get_stitched_journey(customer_id: int, db: Session = Depends(get_db)):
    customer = crud.get_customer(db, customer_id=customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    events = (
        db.query(models.JourneyEvent)
        .filter(models.JourneyEvent.customer_id == customer_id)
        .order_by(models.JourneyEvent.timestamp.asc())
        .all()
    )
    journey = stitch_journey(events)
    journey["customer"] = {
        "id": customer.id,
        "name": f"{customer.first_name} {customer.last_name}",
        "email": customer.email,
        "health_score": customer.health_score,
        "churn_risk": customer.churn_risk,
    }
    return journey


@app.get("/api/dashboard/kpis")
def get_dashboard_kpis(db: Session = Depends(get_db)):    # Mock KPIs for the dashboard
    return {
        "critical_incidents": 12,
        "broken_journeys": 143,
        "revenue_impact": 45000,
        "cx_health_score": 78,
        "customers_at_risk": 342,
        "active_alerts": 5
    }

# WebSocket for real-time live alerts
@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    event_templates = [
        {"channel": "Mobile App", "event_type": "Login Failed", "severity": "Medium", "message": "Multiple login failures detected for device signature starting with 'A7X'."},
        {"channel": "Mobile App", "event_type": "App Crash", "severity": "High", "message": "Unhandled exception in transfer flow module on iOS 17.2."},
        {"channel": "Website", "event_type": "Payment Declined", "severity": "Low", "message": "Card verification failed due to incorrect CVV entry."},
        {"channel": "Website", "event_type": "Session Timeout", "severity": "Low", "message": "User session expired during loan application step 3."},
        {"channel": "Call Center", "event_type": "Long Wait Time", "severity": "Medium", "message": "Queue depth exceeded threshold. Average wait time > 15 mins."},
        {"channel": "ATM", "event_type": "Hardware Error", "severity": "High", "message": "Cash dispenser fault detected at Branch #442."},
        {"channel": "Payment Gateway", "event_type": "Auth Timeout", "severity": "High", "message": "Timeout communicating with Visa network switch."}
    ]
    
    try:
        while True:
            await asyncio.sleep(random.uniform(2, 5)) # Simulate event every 2-5 seconds
            template = random.choice(event_templates)
            
            # Generate a breakdown payload
            breakdown = {
                "trace_id": f"TRC-{random.randint(100000, 999999)}",
                "customer_segment": random.choice(["Retail", "Wealth", "Small Business"]),
                "device_info": "iOS 17.2, iPhone 14 Pro" if template["channel"] == "Mobile App" else "Web Browser",
                "ip_address": f"{random.randint(10, 255)}.{random.randint(10, 255)}.x.x",
                "raw_error_code": f"ERR-{random.randint(100, 500)}",
                "backend_service": random.choice(["auth-service", "core-banking", "payment-gateway", "card-mgmt"])
            }

            alert = {
                "id": random.randint(1000, 9999),
                "channel": template["channel"],
                "event_type": template["event_type"],
                "severity": template["severity"],
                "message": template["message"],
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "breakdown": breakdown
            }
            await websocket.send_text(json.dumps(alert))
    except Exception as e:
        print(f"WebSocket Error: {e}")
