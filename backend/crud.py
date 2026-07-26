from sqlalchemy.orm import Session
import models, schemas

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.JourneyEvent).order_by(models.JourneyEvent.timestamp.desc()).offset(skip).limit(limit).all()

def create_event(db: Session, event: schemas.JourneyEventCreate):
    db_event = models.JourneyEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_incidents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Incident).order_by(models.Incident.created_at.desc()).offset(skip).limit(limit).all()

def create_incident(db: Session, incident: schemas.IncidentCreate):
    db_incident = models.Incident(**incident.dict())
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

def update_incident_status(db: Session, incident_id: int, new_status: str):
    db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if db_incident:
        db_incident.status = new_status
        db.commit()
        db.refresh(db_incident)
    return db_incident
