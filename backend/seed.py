import random
from faker import Faker
import datetime

from database import SessionLocal, engine
import models, crud, schemas

models.Base.metadata.create_all(bind=engine)

fake = Faker()

def seed_db():
    db = SessionLocal()

    # Clear existing data
    db.query(models.Incident).delete()
    db.query(models.JourneyEvent).delete()
    db.query(models.Customer).delete()
    db.commit()

    print("Seeding customers...")
    customers = []
    for _ in range(100): # Seed 100 customers for now
        customer_data = schemas.CustomerCreate(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.email(),
            phone=fake.phone_number(),
            health_score=round(random.uniform(20.0, 100.0), 2),
            churn_risk=round(random.uniform(0.0, 0.9), 2)
        )
        customers.append(crud.create_customer(db, customer_data))

    print("Seeding journey events...")
    channels = ["Mobile App", "Website", "Call Center", "Branch", "ATM", "Payment Gateway"]
    event_types_by_channel = {
        "Mobile App": ["Login", "View Balance", "Transfer Funds", "Error", "Logout"],
        "Website": ["Login", "Apply for Card", "Update Profile", "Error", "Logout"],
        "Call Center": ["Call Initiated", "IVR Navigated", "Agent Connected", "Issue Resolved", "Call Dropped"],
        "Branch": ["Walk-in", "Deposit", "Consultation"],
        "ATM": ["Card Inserted", "PIN Entered", "Cash Withdrawal", "Error"],
        "Payment Gateway": ["Auth Request", "Auth Approved", "Auth Declined"]
    }
    
    for customer in customers:
        num_events = random.randint(5, 20)
        for _ in range(num_events):
            channel = random.choice(channels)
            event_type = random.choice(event_types_by_channel[channel])
            status = "Success" if random.random() > 0.1 else "Failed"
            
            event_data = schemas.JourneyEventCreate(
                customer_id=customer.id,
                device_id=fake.uuid4(),
                channel=channel,
                event_type=event_type,
                status=status,
                timestamp=fake.date_time_between(start_date='-30d', end_date='now'),
                metadata_json="{}"
            )
            crud.create_event(db, event_data)

    print("Seeding incidents...")
    incident_templates = [
        {
            "title": "Mobile App Transfer Failures Spiking",
            "ai_root_cause": "A recent deployment introduced a timeout issue when communicating with the core banking API for inter-account transfers. The issue primarily affects iOS users on version 4.2.",
            "recommended_resolution": "Rollback the mobile gateway service to previous stable version 1.4.2 and notify affected users to try their transfer again."
        },
        {
            "title": "High Abandonment in Card Application Flow",
            "ai_root_cause": "The identity verification third-party API is experiencing high latency (averaging 8 seconds), causing users to drop off before completing the application.",
            "recommended_resolution": "Switch to the fallback identity provider immediately and initiate an auto-email campaign for users who dropped off in the last 2 hours."
        },
        {
            "title": "Call Center IVR Loop Detected",
            "ai_root_cause": "Customers pressing '3' for Fraud Support are being incorrectly routed back to the main menu due to a misconfiguration in the new IVR routing table.",
            "recommended_resolution": "Update IVR routing node 3A to point directly to the Fraud Queue ID 8832. High priority hotfix required."
        },
        {
            "title": "Website Login Service Degradation",
            "ai_root_cause": "The authentication microservice is throttling requests due to an unexpected spike in traffic from a specific IP subnet, possibly a credential stuffing attack.",
            "recommended_resolution": "Temporarily block the anomalous IP subnet at the WAF level and force CAPTCHA for all subsequent login attempts for the next 4 hours."
        },
        {
            "title": "ATM Cash Withdrawal Declines",
            "ai_root_cause": "A batch of ATMs in the Northeast region lost connection to the primary authorization switch, falling back to stand-in processing which declined large withdrawals.",
            "recommended_resolution": "Restart the network switch interface for the affected region and dispatch maintenance to verify physical connectivity at key branch locations."
        }
    ]

    for i in range(15):
        template = random.choice(incident_templates)
        incident_data = schemas.IncidentCreate(
            title=f"{template['title']} (Incident #{i+100})",
            severity=random.choice(["High", "Medium", "Low"]),
            affected_customers_count=random.randint(50, 5000),
            business_impact=round(random.uniform(5000, 250000), 2),
            confidence_score=round(random.uniform(0.75, 0.99), 2),
            ai_root_cause=template['ai_root_cause'],
            recommended_resolution=template['recommended_resolution'],
            status=random.choice(["Open", "Investigating", "Resolved"])
        )
        crud.create_incident(db, incident_data)

    print("Seeding complete.")
    db.close()

if __name__ == "__main__":
    seed_db()
