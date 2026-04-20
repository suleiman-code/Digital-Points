import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load environment variables from backend/.env if it exists
backend_env = os.path.join("backend", ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "digitalpoint")
MONGODB_DNS_SERVERS = os.getenv("MONGODB_DNS_SERVERS", "8.8.8.8,1.1.1.1")

# DNS fix for Atlas
try:
    import dns.resolver
    if MONGODB_URL and MONGODB_URL.startswith("mongodb+srv://"):
        dns_servers = [s.strip() for s in MONGODB_DNS_SERVERS.split(",") if s.strip()]
        if dns_servers:
            resolver = dns.resolver.Resolver(configure=False)
            resolver.nameservers = dns_servers
            dns.resolver.default_resolver = resolver
            print(f"Using custom DNS servers: {dns_servers}")
except ImportError:
    pass

if not MONGODB_URL:
    print("Error: MONGODB_URL not found in environment.")
    exit(1)

categories_to_add = [
    "Accounting & Tax", "Advertising", "Animal Hospitals", "Apparel & Clothing",
    "Attorneys", "Auto Repair", "Bakeries & Cafes", "Banks", "Barbershops",
    "Bars & Nightlife", "Beauty Salons", "Business Consulting", "Car Dealerships",
    "Car Wash", "Catering", "Childcare", "Chiropractors", "Cleaning Services",
    "Construction", "Daycare Centers", "Dental Clinics", "Digital Marketing",
    "Doctors & Physicians", "Dry Cleaning", "Education & Tutoring", "Electrical Services",
    "Electronics Repair", "Engineering", "Event Planning", "Family Law",
    "Fashion Retail", "Financial Planning", "Fitness Centers", "Flooring",
    "Florists", "Food Trucks", "General Contractors", "Graphic Design",
    "Grocery Stores", "Gyms & Studios", "Hair Salons", "HVAC (Heating & Air)",
    "Home Decor", "Home Health Care", "Hotels & Lodging", "Insurance Agencies",
    "Interior Design", "Investment Services", "IT Support & Managed Services",
    "Janitorial Services", "Jewelry Stores", "Junk Removal", "Kitchen Remodeling",
    "Krav Maga & Martial Arts", "Landscaping", "Laundromats", "Law Firms",
    "Library & Community Centers", "Locksmiths", "Marketing Agencies",
    "Massage Therapy", "Mechanics", "Medical Clinics", "Mental Health",
    "Mortgages", "Nail Salons", "Non-Profit Organizations", "Nursing Homes",
    "Office Supplies", "Optometrists", "Orthodontists", "Painting",
    "Personal Injury Law", "Pest Control", "Pet Stores", "Pharmacies",
    "Photography", "Plumbing", "Quick-Service Restaurants", "Real Estate Agencies",
    "Reconstruction", "Religious Centers", "Restaurants", "Roofing",
    "Schools & Colleges", "Security Systems", "SEO Services", "Shipping & Logistics",
    "Solar Energy", "Spas", "Tattoo & Piercing", "Tax Preparation",
    "Tech Support", "Therapy", "Tire Shops", "Towing", "Travel Agencies",
    "Urgent Care Services", "Upholstery & Furniture Repair", "Veterinary Services",
    "Video Production", "Virtual Assistants", "Web Development", "Wedding Venues",
    "Weight Loss Centers", "Window Cleaning", "X-Ray & Imaging Centers", "Yoga Studios",
    "Youth Organizations", "Zero-Waste Shops", "Zoological Services"
]

async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client["digitalpoint"]
    collection = db["categories"]
    
    print(f"Connecting to MongoDB...")
    
    count = 0
    for cat_name in categories_to_add:
        # Check if already exists
        exists = await collection.find_one({"name": cat_name})
        if not exists:
            await collection.insert_one({
                "name": cat_name,
                "created_at": datetime.utcnow()
            })
            count += 1
            print(f"Added: {cat_name}")
        else:
            print(f"Skipped (already exists): {cat_name}")
            
    print(f"\nSuccessfully added {count} new categories!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
