import asyncio
import logging
from database import db, connect_to_mongo, close_mongo_connection
from datetime import datetime

# Configure logging to see output
logging.basicConfig(level=logging.INFO)

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
    try:
        await connect_to_mongo()
        collection = db.db["categories"]
        
        count = 0
        for cat_name in categories_to_add:
            exists = await collection.find_one({"name": cat_name})
            if not exists:
                await collection.insert_one({
                    "name": cat_name,
                    "created_at": datetime.utcnow()
                })
                count += 1
                logging.info(f"Added: {cat_name}")
            else:
                logging.info(f"Skipped: {cat_name}")
                
        logging.info(f"Successfully added {count} categories!")
    except Exception as e:
        logging.error(f"Error during seeding: {e}")
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed())
