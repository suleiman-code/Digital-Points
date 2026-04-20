import asyncio
import logging
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb+srv://suleimanahmed1222:B4o0sA3Y0E1X5Hbe@cluster0.p7ghw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

# The CORRECT DB name from config.py
CORRECT_DB = "digital_points"

all_categories = [
    "Accounting & Tax", "Advertising", "Animal Hospitals", "Apparel & Clothing", 
    "Attorneys", "Auto Repair", "Bakeries & Cafes", "Banks", "Barbershops", 
    "Bars & Nightlife", "Beauty Salons", "Business Consulting", "Car Dealerships", 
    "Car Wash", "Catering", "Childcare", "Chiropractors", "Cleaning Services", 
    "Construction", "Daycare Centers", "Dental Clinics", "Digital Marketing", 
    "Doctors & Physicians", "Dry Cleaning", "Education & Tutoring", 
    "Electrical Services", "Electronics Repair", "Engineering", "Event Planning", 
    "Family Law", "Fashion Retail", "Financial Planning", "Fitness Centers", 
    "Flooring", "Florists", "Food Trucks", "General Contractors", "Graphic Design", 
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
    "Solar Energy", "Spas", "Tattoo & Piercing", "Tax Preparation", "Tech Support", 
    "Therapy", "Tire Shops", "Towing", "Travel Agencies", "Urgent Care Services", 
    "Upholstery & Furniture Repair", "Veterinary Services", "Video Production", 
    "Virtual Assistants", "Web Development", "Wedding Venues", "Weight Loss Centers", 
    "Window Cleaning", "X-Ray & Imaging Centers", "Yoga Studios", "Youth Organizations", 
    "Zero-Waste Shops", "Zoological Services"
]

async def fix():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[CORRECT_DB]
    collection = db["categories"]
    
    print(f"Connecting to CORRECT DB: {CORRECT_DB}...")
    
    # Ensure Unique Index
    await collection.create_index("name", unique=True)
    
    count = 0
    for cat_name in all_categories:
        try:
            exists = await collection.find_one({"name": cat_name})
            if not exists:
                await collection.insert_one({
                    "name": cat_name,
                    "created_at": datetime.utcnow()
                })
                count += 1
                print(f"Added: {cat_name}")
        except Exception: pass
            
    print(f"\nFIX DONE! Added {count} categories to CORRECT database.")
    
    # Optional: Delete the wrong database collection if it exists
    try:
        wrong_db = client["digitalpoint"]
        await wrong_db["categories"].drop()
        print("Dropped wrong database collection 'digitalpoint.categories'")
    except Exception: pass

    client.close()

if __name__ == "__main__":
    asyncio.run(fix())
