"""
NexusCRM subscription plans mapped to Stripe Price IDs.
Update PRICE_IDS with your actual Stripe price IDs.
"""
from enum import Enum

class Plan(str, Enum):
    STARTER   = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

# Replace with real Stripe price IDs from your dashboard
PRICE_IDS: dict[Plan, str] = {
    Plan.STARTER:      "price_starter_monthly",
    Plan.PROFESSIONAL: "price_professional_monthly",
    Plan.ENTERPRISE:   "price_enterprise_monthly",
}

PLAN_LIMITS = {
    Plan.STARTER:      {"max_users": 5,   "max_contacts": 1_000,  "price_usd": 29},
    Plan.PROFESSIONAL: {"max_users": 25,  "max_contacts": 25_000, "price_usd": 99},
    Plan.ENTERPRISE:   {"max_users": 999, "max_contacts": 999_999,"price_usd": 299},
}
