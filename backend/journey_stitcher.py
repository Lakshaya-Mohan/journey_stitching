"""
journey_stitcher.py
-------------------
Takes a flat list of JourneyEvents for a customer and reconstructs them into
a meaningful business journey — grouping events into named stages, computing
stage-level status, and generating AI insights per stage and per event.
"""

import json
import random
from datetime import datetime
from typing import List, Dict, Tuple, Set, Optional

# ─── Stage classification rules ───────────────────────────────────────────────
# Maps (channel, event_type) → stage name. Order matters for fallback.

STAGE_RULES: List[Tuple[Set[str], Set[str], str]] = [
    # Authentication
    (
        {"Mobile App", "Website", "Call Center"},
        {"Login", "Call Initiated", "IVR Navigated"},
        "Authentication",
    ),
    # Payment Initiation
    (
        {"Mobile App", "Website", "Payment Gateway"},
        {"Transfer Funds", "Bill Payment", "Auth Request", "Apply for Card"},
        "Payment Initiation",
    ),
    # Verification
    (
        {"Payment Gateway", "Website", "Mobile App"},
        {"Auth Approved", "Auth Declined", "Update Profile"},
        "Verification",
    ),
    # Support / Recovery — escalation signals
    (
        {"Call Center"},
        {"Agent Connected", "Issue Resolved", "Call Dropped"},
        "Support",
    ),
    # ATM / Branch operations
    (
        {"ATM", "Branch"},
        {"Card Inserted", "PIN Entered", "Cash Withdrawal", "Balance Enquiry", "Walk-in", "Cash Deposit", "Loan Consultation", "Account Opening"},
        "In-Person Operation",
    ),
    # Session close / logout
    (
        {"Mobile App", "Website"},
        {"Logout", "Statement Download"},
        "Session Close",
    ),
]

FALLBACK_STAGE = "Other Activity"

# Goal inference based on dominant event patterns
GOAL_RULES: List[Tuple[Set[str], str]] = [
    ({"Bill Payment", "Transfer Funds", "Auth Request", "Auth Approved", "Auth Declined"}, "Pay Credit Card Bill"),
    ({"Apply for Card", "Update Profile", "Auth Request"}, "Apply for Credit Card"),
    ({"Cash Withdrawal", "Card Inserted", "PIN Entered"}, "ATM Cash Withdrawal"),
    ({"Call Initiated", "IVR Navigated", "Agent Connected", "Issue Resolved"}, "Resolve Support Issue"),
    ({"Walk-in", "Loan Consultation"}, "Branch Loan Consultation"),
    ({"Statement Download", "View Balance"}, "Review Account Statements"),
]

# ─── AI insight generation ─────────────────────────────────────────────────────

AI_INSIGHTS: Dict[str, Dict] = {
    "Authentication": {
        "success": {
            "summary": "Customer authenticated successfully across all channels.",
            "root_cause": None,
            "business_impact": "Low — session established without friction.",
            "confidence": 0.97,
            "recommendation": "No action required. Auth latency is within SLA.",
        },
        "warning": {
            "summary": "Authentication completed but with elevated retry attempts.",
            "root_cause": "Biometric module on iOS 17.2 has a known intermittent failure under high CPU load.",
            "business_impact": "Medium — increased drop-off risk at login. ~12% of affected users abandon.",
            "confidence": 0.88,
            "recommendation": "Deploy patch KB-1042 to mobile auth service. Add fallback PIN prompt after first biometric failure.",
        },
        "failure": {
            "summary": "Customer failed to authenticate. Session was not established.",
            "root_cause": "Auth microservice throttling requests from this IP subnet — possible credential-stuffing attack or service degradation.",
            "business_impact": "High — customer blocked from all self-service channels. Risk of call center escalation (+$18 avg cost per call).",
            "confidence": 0.93,
            "recommendation": "Unlock account via verified OTP. Block anomalous IP range at WAF. Trigger proactive SMS to customer.",
        },
    },
    "Payment Initiation": {
        "success": {
            "summary": "Payment initiation completed without interruption.",
            "root_cause": None,
            "business_impact": "Low — transaction entered the processing queue successfully.",
            "confidence": 0.96,
            "recommendation": "No action required.",
        },
        "warning": {
            "summary": "Payment was initiated but required multiple attempts or channel switches.",
            "root_cause": "Mobile app transfer flow timed out connecting to core-banking API. Customer retried via website.",
            "business_impact": "Medium — channel switching adds 4–8 min of friction. Associated with 22% higher churn probability.",
            "confidence": 0.85,
            "recommendation": "Investigate core-banking API timeout threshold. Offer in-app retry with real-time status feedback.",
        },
        "failure": {
            "summary": "Payment initiation failed. Transaction did not enter the processing queue.",
            "root_cause": "Core-banking API returned ERR-503 during peak load window (09:00–11:00). Concurrent request limit exceeded.",
            "business_impact": "Critical — estimated $2,400 revenue at risk for this customer segment per hour of outage.",
            "confidence": 0.91,
            "recommendation": "Trigger incident INC-442. Scale core-banking service. Send proactive push notification to customer with retry link.",
        },
    },
    "Verification": {
        "success": {
            "summary": "Transaction verified and authorised by payment network.",
            "root_cause": None,
            "business_impact": "Low — funds cleared within SLA.",
            "confidence": 0.98,
            "recommendation": "No action required.",
        },
        "warning": {
            "summary": "Verification passed after a declined attempt.",
            "root_cause": "First auth attempt declined by fraud engine due to velocity check. Customer retried with different card.",
            "business_impact": "Medium — false positive fraud block. Customer satisfaction impact estimated at −8 NPS points.",
            "confidence": 0.82,
            "recommendation": "Review fraud velocity rule thresholds for this customer segment. Consider whitelisting verified recurring payees.",
        },
        "failure": {
            "summary": "Payment authorisation declined by network. Transaction not completed.",
            "root_cause": "Visa network switch timeout (30s) caused stand-in processing to decline the transaction conservatively.",
            "business_impact": "High — payment not made. Customer likely to call support (+$18) or churn if recurrent.",
            "confidence": 0.89,
            "recommendation": "Fail over to secondary Visa connection. Notify customer with exact decline reason and retry guidance.",
        },
    },
    "Support": {
        "success": {
            "summary": "Customer reached an agent and issue was resolved within the same interaction.",
            "root_cause": None,
            "business_impact": "Medium — support cost incurred ($18 avg). Root issue should be eliminated to prevent repeat calls.",
            "confidence": 0.94,
            "recommendation": "Log resolution pattern. If recurring, escalate to product team for self-service fix.",
        },
        "warning": {
            "summary": "Customer reached support but experienced long wait times or IVR friction.",
            "root_cause": "IVR routing node 3A misconfigured — customers selecting Fraud Support are looped to the main menu.",
            "business_impact": "High — avg wait time >15 min. Every minute over SLA costs ~0.4 NPS points and increases abandonment by 8%.",
            "confidence": 0.87,
            "recommendation": "Fix IVR routing node 3A immediately. Add callback option when queue depth >10.",
        },
        "failure": {
            "summary": "Customer call was dropped before resolution. Issue unresolved.",
            "root_cause": "Carrier-level timeout after 8 min on hold. Agent queue not draining fast enough during peak hours.",
            "business_impact": "Critical — unresolved issue with high churn signal. Customers with dropped calls have 3.2× higher 30-day churn rate.",
            "confidence": 0.91,
            "recommendation": "Trigger immediate callback within 30 minutes. Flag customer account for priority handling. Escalate to team lead.",
        },
    },
    "In-Person Operation": {
        "success": {
            "summary": "In-person transaction completed successfully at ATM or branch.",
            "root_cause": None,
            "business_impact": "Low.",
            "confidence": 0.96,
            "recommendation": "No action required.",
        },
        "warning": {
            "summary": "In-person operation completed after a recoverable error.",
            "root_cause": "ATM cash dispenser reported a partial jam — transaction completed on second attempt.",
            "business_impact": "Low — resolved on-site. File maintenance ticket for ATM-{id}.",
            "confidence": 0.84,
            "recommendation": "Schedule preventive maintenance for flagged ATM unit within 48 hours.",
        },
        "failure": {
            "summary": "In-person operation failed. Customer left without completing their goal.",
            "root_cause": "ATM lost connectivity to primary auth switch. Stand-in processing declined large withdrawal amount.",
            "business_impact": "High — customer unable to access funds. Likely to call support or visit branch (+$35 cost).",
            "confidence": 0.90,
            "recommendation": "Dispatch maintenance to affected ATM. Proactively notify customer of alternative branches or mobile options.",
        },
    },
    "Session Close": {
        "success": {
            "summary": "Session closed cleanly. Customer completed their goal.",
            "root_cause": None,
            "business_impact": "Positive — completed journey. Monitor for repeat visit patterns.",
            "confidence": 0.97,
            "recommendation": "No action required.",
        },
        "warning": {
            "summary": "Session ended but goal completion is uncertain.",
            "root_cause": "Customer downloaded statement without completing a pending payment — possible confusion in UI flow.",
            "business_impact": "Low-Medium — monitor for missed payment in next 24 hours.",
            "confidence": 0.76,
            "recommendation": "Send a gentle payment reminder notification within 2 hours if payment not detected.",
        },
        "failure": {
            "summary": "Session timed out before customer could complete their goal.",
            "root_cause": "Session token expired during loan application step 3 — idle timeout set too aggressively (5 min).",
            "business_impact": "Medium — application data lost. Customer must restart process. Associated with 31% non-return rate.",
            "confidence": 0.88,
            "recommendation": "Save application state server-side. Extend session timeout to 15 min for multi-step flows. Send resumption link via email.",
        },
    },
    "Other Activity": {
        "success": {
            "summary": "Miscellaneous activity completed without issues.",
            "root_cause": None,
            "business_impact": "Informational.",
            "confidence": 0.80,
            "recommendation": "No immediate action required.",
        },
        "warning": {
            "summary": "Miscellaneous activity completed with minor issues.",
            "root_cause": "Event pattern does not match known journey templates — may indicate an edge case.",
            "business_impact": "Low.",
            "confidence": 0.70,
            "recommendation": "Review event taxonomy. Consider adding this pattern to journey classification rules.",
        },
        "failure": {
            "summary": "Unclassified activity failed.",
            "root_cause": "Event pattern does not match known journey templates.",
            "business_impact": "Unknown — manual review recommended.",
            "confidence": 0.65,
            "recommendation": "Manual review required. Check system logs for this time window.",
        },
    },
}

EVENT_INSIGHTS: Dict[str, Dict] = {
    "Login": {
        "Failed": "Auth service returned 401 — biometric match score below threshold (0.42 < 0.70 required). Device: iOS 17.2.",
        "Success": "Biometric authentication passed in 1.2s. Session token issued.",
    },
    "Transfer Funds": {
        "Failed": "POST /api/transfers returned 503 — core-banking service at capacity. Retry queue exhausted after 3 attempts.",
        "Success": "Transfer of funds submitted. Transaction ID issued by core-banking.",
    },
    "Bill Payment": {
        "Failed": "Payment gateway timed out at authorization step. No response from issuer within 30s.",
        "Success": "Bill payment authorized and queued for settlement.",
    },
    "Auth Request": {
        "Failed": "Fraud engine blocked transaction — velocity check failed (>3 auths in 5 min on this card).",
        "Success": "Authorization request sent to Visa network.",
    },
    "Auth Approved": {
        "Failed": "Authorization reversal — issuer declined post-approval due to risk flag.",
        "Success": "Visa network approved authorization. Funds reserved.",
    },
    "Auth Declined": {
        "Failed": "Hard decline from issuer — card flagged for suspicious activity.",
        "Success": "Soft decline returned — customer retried successfully.",
    },
    "Call Initiated": {
        "Failed": "Call failed to connect — IVR service unresponsive for 45s.",
        "Success": "Customer connected to IVR system.",
    },
    "IVR Navigated": {
        "Failed": "IVR routing loop detected — customer cycled through main menu 4 times without reaching target queue.",
        "Success": "Customer navigated IVR to Fraud Support queue.",
    },
    "Agent Connected": {
        "Failed": "Agent connection dropped after 2 min — carrier timeout.",
        "Success": "Customer connected to agent. Average handle time: 6.3 min.",
    },
    "Issue Resolved": {
        "Failed": "Agent closed ticket without resolution — customer confirmed issue persists.",
        "Success": "Issue resolved. Customer confirmed satisfaction (CSAT: 4/5).",
    },
    "Cash Withdrawal": {
        "Failed": "Dispenser fault — cash jam detected mid-dispense. Transaction reversed.",
        "Success": "Cash dispensed successfully.",
    },
}


def classify_stage(channel: str, event_type: str) -> str:
    for channels, events, stage in STAGE_RULES:
        if channel in channels and event_type in events:
            return stage
    return FALLBACK_STAGE


def infer_goal(event_types: List[str]) -> str:
    event_set = set(event_types)
    best_match = ("Manage Account", 0)
    for goal_events, goal in GOAL_RULES:
        overlap = len(goal_events & event_set)
        if overlap > best_match[1]:
            best_match = (goal, overlap)
    return best_match[0]


def compute_stage_status(events: List[dict]) -> str:
    statuses = [e["status"] for e in events]
    if all(s == "Success" for s in statuses):
        return "success"
    if all(s == "Failed" for s in statuses):
        return "failure"
    return "warning"


def get_stage_insight(stage: str, status: str) -> dict:
    stage_data = AI_INSIGHTS.get(stage, AI_INSIGHTS["Other Activity"])
    return stage_data.get(status, stage_data["success"])


def get_event_insight(event_type: str, status: str) -> str:
    if event_type in EVENT_INSIGHTS:
        return EVENT_INSIGHTS[event_type].get(status, f"{event_type} completed with status: {status}.")
    return f"{event_type} recorded on channel. Status: {status}."


def stitch_journey(events: list) -> dict:
    """
    Takes a list of SQLAlchemy JourneyEvent objects and returns a structured
    business journey dict.
    """
    if not events:
        return {
            "goal": "No activity recorded",
            "overall_status": "unknown",
            "duration_minutes": 0,
            "stages": [],
            "summary": "No events found for this customer.",
        }

    # Sort chronologically
    sorted_events = sorted(events, key=lambda e: e.timestamp)

    # Infer the goal
    event_types = [e.event_type for e in sorted_events]
    goal = infer_goal(event_types)

    # Group events into stages
    stage_map: Dict[str, List[dict]] = {}
    stage_order: List[str] = []

    for event in sorted_events:
        stage = classify_stage(event.channel, event.event_type)
        if stage not in stage_map:
            stage_map[stage] = []
            stage_order.append(stage)

        try:
            metadata = json.loads(event.metadata_json or "{}")
        except (json.JSONDecodeError, TypeError):
            metadata = {}

        event_dict = {
            "id": event.id,
            "channel": event.channel,
            "event_type": event.event_type,
            "status": event.status,
            "timestamp": event.timestamp.isoformat(),
            "device_id": event.device_id,
            "metadata": metadata,
            "insight": get_event_insight(event.event_type, event.status),
        }
        stage_map[stage].append(event_dict)

    # Build stage objects
    stages = []
    for stage_name in stage_order:
        stage_events = stage_map[stage_name]
        status = compute_stage_status(stage_events)
        insight = get_stage_insight(stage_name, status)

        # Use jitter on confidence for realism
        confidence = round(
            min(0.99, max(0.60, insight["confidence"] + random.uniform(-0.04, 0.04))),
            2,
        )

        stages.append({
            "name": stage_name,
            "status": status,
            "event_count": len(stage_events),
            "start_time": stage_events[0]["timestamp"],
            "end_time": stage_events[-1]["timestamp"],
            "channels": list({e["channel"] for e in stage_events}),
            "events": stage_events,
            "insight": {
                "summary": insight["summary"],
                "root_cause": insight["root_cause"],
                "business_impact": insight["business_impact"],
                "confidence_score": confidence,
                "recommendation": insight["recommendation"],
            },
        })

    # Overall journey status
    stage_statuses = [s["status"] for s in stages]
    if any(s == "failure" for s in stage_statuses):
        overall = "failure"
    elif any(s == "warning" for s in stage_statuses):
        overall = "warning"
    else:
        overall = "success"

    # Duration
    t_start = sorted_events[0].timestamp
    t_end = sorted_events[-1].timestamp
    duration = round((t_end - t_start).total_seconds() / 60, 1)

    # Narrative summary
    failed_stages = [s["name"] for s in stages if s["status"] == "failure"]
    warning_stages = [s["name"] for s in stages if s["status"] == "warning"]

    if overall == "success":
        narrative = f"Customer successfully completed their goal: {goal}. All {len(stages)} stages resolved without issues."
    elif overall == "failure":
        narrative = (
            f"Journey failed during {', '.join(failed_stages)}. "
            f"Customer was unable to complete: {goal}. Immediate action recommended."
        )
    else:
        narrative = (
            f"Journey completed with friction in {', '.join(warning_stages)}. "
            f"Goal '{goal}' may not have been fully achieved. Review highlighted stages."
        )

    return {
        "goal": goal,
        "overall_status": overall,
        "duration_minutes": duration,
        "total_events": len(sorted_events),
        "stages": stages,
        "summary": narrative,
    }
