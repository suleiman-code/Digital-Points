from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    try:
        logging.info("Connecting to MongoDB...")
        # Set a 5-second timeout so the server doesn't hang forever
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL, 
            serverSelectionTimeoutMS=5000
        )
        db.db = db.client[settings.DATABASE_NAME]
        # Trigger an actual connection check
        await db.client.admin.command('ping')
        logging.info("Connected to MongoDB!")
    except Exception as e:
        logging.error(f"Could not connect to MongoDB: {e}")
        # We don't raise error here, so the server can still start for Swagger UI
        # But DB calls will fail later with clear error

async def close_mongo_connection():
    if db.client:
        logging.info("Closing MongoDB connection...")
        db.client.close()
        logging.info("Closed MongoDB connection!")
    else:
        # Avoid print for testing to see if logging is the issue
        print("No MongoDB connection to close.")
