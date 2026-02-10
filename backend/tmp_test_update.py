"""Test customer update with sample data"""
import sys
sys.path.insert(0, '/app')

import requests
import json

# Login first
login_url = "http://localhost:8000/auth/login"
login_data = {
    "email": "admin@maintms.com",
    "password": "admin123"
}

print("Logging in...")
response = requests.post(login_url, json=login_data)
token = response.json()["access_token"]
print(f"Got token: {token[:20]}...")

# Try to update customer 151 (ACORN EXPRESS LLC based on logs)
customer_id = 151
update_url = f"http://localhost:8000/customers/{customer_id}"

# Sample update data matching what frontend would send
update_data = {
    "company_name": "ACORN EXPRESS LLC",
    "mc_number": "930964",
    "dot_number": "2796702",
    "address": "179 SOUTH LAKE ST",
    "city": "FOREST LAKE",
    "state": "MN",
    "zip_code": None,
    "phone": "(651) 356-6079",
    "email": None,
    "payment_terms": "Net 30",
    "credit_limit": None,
    "default_rate": None,
    "notes": None,
    "customer_type": "broker"
}

print(f"\nSending update to {update_url}")
print(f"Data: {json.dumps(update_data, indent=2)}")

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

response = requests.put(update_url, json=update_data, headers=headers)

print(f"\nResponse Status: {response.status_code}")
print(f"Response Body:")
print(json.dumps(response.json(), indent=2))
