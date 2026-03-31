
import requests

BASE_URL = "http://localhost:8000/api"

def signup():
    payload = {
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User",
        "password": "admin123"
    }
    response = requests.post(f"{BASE_URL}/auth/signup", json=payload)
    print(f"Signup Status: {response.status_code}")
    print(f"Signup Body: {response.text}")
    return response.status_code

def login():
    payload = {
        "username": "admin@example.com",
        "password": "admin123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", data=payload) # Form data
    print(f"Login Status: {response.status_code}")
    print(f"Login Body: {response.text}")
    return response.json().get("access_token")

def test_create_service(token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Attempt to create a service with empty optional fields
    payload = {
        "title": "Test Service",
        "description": "Test Description",
        "category": "Plumbing",
        "price": 50.0,
        "city": "New York",
        "state": "NY",
        "contact_email": "" # This might fail
    }
    
    response = requests.post(f"{BASE_URL}/services/", json=payload, headers=headers)
    print(f"Create Status: {response.status_code}")
    print(f"Create Body: {response.text}")

if __name__ == "__main__":
    signup() # Ignore errors if already exists
    token = login()
    if token:
        test_create_service(token)
