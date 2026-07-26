import random
import json
from faker import Faker
import datetime

from database import SessionLocal, engine
import models, crud, schemas

models.Base.metadata.create_all(bind=engine)

fake = Faker()

# ─── Error metadata templates per channel ─────────────────────────────────────
ERROR_METADATA = {
    "Mobile App": [
        {"error_code": "APP_CRASH_001", "error_message": "Unhandled exception in transfer flow module", "device_os": "iOS 17.2"},
        {"error_code": "AUTH_TIMEOUT", "error_message": "Biometric auth timed out after 3 attempts", "device_os": "Android 14"},
        {"error_code": "SESSION_EXP", "error_message": "Session token expired during operation", "device_os": "iOS 16.5"},
    ],
    "Website": [
        {"error_code": "PAYMENT_DECLINED", "error_message": "Card verification failed — incorrect CVV", "browser": "Chrome 124"},
        {"error_code": "SESSION_TIMEOUT", "error_message": "User session expired during loan application step 3", "browser": "Firefox 125"},
        {"error_code": "FORM_SUBMIT_FAIL", "error_message": "Form submission blocked by WAF rule #4421", "browser": "Safari 17"},
    ],
    "Call Center": [
        {"error_code": "CALL_DROPPED", "error_message": "Connection lost — carrier timeout after 8 min hold", "ivr_node": "3A"},
        {"error_code": "IVR_LOOP", "error_message": "Customer routed back to main menu 4 times", "ivr_node": "2B"},
        {"error_code": "AGENT_UNAVAILABLE", "error_message": "No agents available — queue depth exceeded 50", "ivr_node": "5C"},
    ],
    "Branch": [
        {"error_code": "SYSTEM_OFFLINE", "error_message": "Branch terminal offline — core banking unreachable", "terminal_id": f"BRN-{random.randint(100,999)}"},
        {"error_code": "ID_VERIFY_FAIL", "error_message": "Identity document scan failed — low quality image", "terminal_id": f"BRN-{random.randint(100,999)}"},
    ],
    "ATM": [
        {"error_code": "DISPENSER_FAULT", "error_message": "Cash dispenser fault — mechanism jam detected", "atm_id": f"ATM-{random.randint(100,999)}"},
        {"error_code": "AUTH_SWITCH_TIMEOUT", "error_message": "Timeout communicating with Visa auth network", "atm_id": f"ATM-{random.randint(100,999)}"},
        {"error_code": "CARD_READ_ERR", "error_message": "Card chip read error — EMV fallback to swipe failed", "atm_id": f"ATM-{random.randint(100,999)}"},
    ],
    "Payment Gateway": [
        {"error_code": "GATEWAY_TIMEOUT", "error_message": "Auth request timed out after 30s — no response from issuer", "gateway": "Visa"},
        {"error_code": "FRAUD_BLOCK", "error_message": "Transaction blocked by fraud engine — velocity check failed", "gateway": "Mastercard"},
        {"error_code": "INSUFFICIENT_FUNDS", "error_message": "Authorization declined — insufficient account balance", "gateway": "Amex"},
    ],
}

def seed_db():
    db = SessionLocal()

    # Clear existing data
    db.query(models.Incident).delete()
    db.query(models.JourneyEvent).delete()
    db.query(models.Customer).delete()
    db.commit()

    print("Seeding customers...")
    customers = []
    for _ in range(100):
        customer_data = schemas.CustomerCreate(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.unique.email(),
            phone=fake.unique.phone_number(),
            health_score=round(random.uniform(20.0, 100.0), 2),
            churn_risk=round(random.uniform(0.0, 0.9), 2),
        )
        customers.append(crud.create_customer(db, customer_data))

    print("Seeding journey events...")
    channels = list(ERROR_METADATA.keys())
    event_types_by_channel = {
        "Mobile App":       ["Login", "View Balance", "Transfer Funds", "Bill Payment", "Logout"],
        "Website":          ["Login", "Apply for Card", "Update Profile", "Statement Download", "Logout"],
        "Call Center":      ["Call Initiated", "IVR Navigated", "Agent Connected", "Issue Resolved", "Call Dropped"],
        "Branch":           ["Walk-in", "Cash Deposit", "Loan Consultation", "Account Opening"],
        "ATM":              ["Card Inserted", "PIN Entered", "Cash Withdrawal", "Balance Enquiry"],
        "Payment Gateway":  ["Auth Request", "Auth Approved", "Auth Declined"],
    }

    for customer in customers:
        num_events = random.randint(5, 20)
        for _ in range(num_events):
            channel = random.choice(channels)
            event_type = random.choice(event_types_by_channel[channel])
            is_failed = random.random() < 0.15  # 15% failure rate
            status = "Failed" if is_failed else "Success"

            # Attach rich error metadata for failures
            metadata: dict = {}
            if is_failed and channel in ERROR_METADATA:
                metadata = random.choice(ERROR_METADATA[channel]).copy()
                metadata["failed_at"] = fake.date_time_between(
                    start_date="-30d", end_date="now"
                ).isoformat()
                metadata["retry_count"] = random.randint(1, 3)

            event_data = schemas.JourneyEventCreate(
                customer_id=customer.id,
                device_id=fake.uuid4(),
                channel=channel,
                event_type=event_type,
                status=status,
                timestamp=fake.date_time_between(start_date="-30d", end_date="now"),
                metadata_json=json.dumps(metadata),
            )
            crud.create_event(db, event_data)

    print("Seeding incidents...")
    incident_templates = [
        {
            "title": "Mobile App Transfer Failures Spiking",
            "ai_root_cause": "A recent deployment introduced a timeout in the core banking API for inter-account transfers. Primarily affects iOS 17.2 users on app version 4.2.",
            "recommended_resolution": "Roll back mobile gateway service to v1.4.2 and notify affected users to retry their transfer.",
        },
        {
            "title": "High Abandonment in Card Application Flow",
            "ai_root_cause": "Third-party identity verification API experiencing high latency (avg 8s), causing drop-off before application completion.",
            "recommended_resolution": "Switch to fallback identity provider and trigger auto-email campaign for drop-offs in the last 2 hours.",
        },
        {
            "title": "Call Center IVR Loop Detected",
            "ai_root_cause": "Customers selecting Fraud Support (option 3) are re-routed to the main menu due to a misconfiguration in the new IVR routing table.",
            "recommended_resolution": "Update IVR routing node 3A to point directly to Fraud Queue ID 8832. Hotfix required.",
        },
        {
            "title": "Website Login Service Degradation",
            "ai_root_cause": "Authentication microservice throttling requests from a specific IP subnet — likely a credential-stuffing attack.",
            "recommended_resolution": "Block anomalous subnet at WAF level and force CAPTCHA on all login attempts for 4 hours.",
        },
        {
            "title": "ATM Cash Withdrawal Declines",
            "ai_root_cause": "Northeast region ATMs lost connection to the primary auth switch and fell back to stand-in processing, which declined large withdrawals.",
            "recommended_resolution": "Restart network switch interface for the affected region and dispatch maintenance to verify physical connectivity.",
        },
        {
            "title": "Payment Gateway Auth Timeouts",
            "ai_root_cause": "Visa network switch experiencing intermittent packet loss, causing 30s auth timeouts on contactless payments during peak hours.",
            "recommended_resolution": "Fail over to secondary Visa connection and alert product team to monitor decline rates.",
        },
    ]

    for i in range(15):
        template = random.choice(incident_templates)
        incident_data = schemas.IncidentCreate(
            title=f"{template['title']} (Incident #{i + 100})",
            severity=random.choice(["High", "Medium", "Low"]),
            affected_customers_count=random.randint(50, 5000),
            business_impact=round(random.uniform(5000, 250000), 2),
            confidence_score=round(random.uniform(0.75, 0.99), 2),
            ai_root_cause=template["ai_root_cause"],
            recommended_resolution=template["recommended_resolution"],
            status=random.choice(["Open", "Investigating", "Resolved"]),
        )
        crud.create_incident(db, incident_data)

    print("Seeding complete.")
    db.close()


if __name__ == "__main__":
    seed_db()
