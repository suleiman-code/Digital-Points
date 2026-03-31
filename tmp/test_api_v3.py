
import requests

BASE_URL = "http://localhost:8000/api"

def login():
    payload = {
        "username": "admin@example.com",
        "password": "admin123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", data=payload)
    return response.json().get("access_token")

def test_price_zero(token):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "title": "Test Service",
        "description": "Test Description",
        "category": "Plumbing",
        "price": 0.0,
        "city": "New York",
        "state": "NY",
    }
    response = requests.post(f"{BASE_URL}/services/", json=payload, headers=headers)
    print(f"Price Zero Status: {response.status_code}")
    print(f"Price Zero Body: {response.text}")

if __name__ == "__main__":
    token = login()
    if token:
        test_price_zero(token)
