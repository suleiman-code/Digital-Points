
import requests

BASE_URL = "http://localhost:8000/api"

def test_create_service():
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
    
    # We need a token, but let's just see the 422 first (validation happens before auth usually)
    # Actually, auth dependency might run first. Let's see.
    
    response = requests.post(f"{BASE_URL}/services/", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Body: {response.text}")

if __name__ == "__main__":
    test_create_service()
