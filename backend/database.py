from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging
from fastapi import HTTPException, status

try:
    import dns.resolver
except Exception:
    dns = None

class Database:
    client: AsyncIOMotorClient = None
    db = None
    is_connected: bool = False

db = Database()
async def connect_to_mongo():
    try:
        logging.info("Connecting to MongoDB...")
        if settings.MONGODB_URL.startswith("mongodb+srv://") and dns is not None:
            dns_servers = [s.strip() for s in settings.MONGODB_DNS_SERVERS.split(",") if s.strip()]
            if dns_servers:
                resolver = dns.resolver.Resolver(configure=False)
                resolver.nameservers = dns_servers
                dns.resolver.default_resolver = resolver
                logging.info(f"Using custom DNS servers for MongoDB SRV lookup: {dns_servers}")

        # Set a 10-second timeout so the server doesn't hang forever
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL, 
            serverSelectionTimeoutMS=10000
        )
        db.db = db.client[settings.DATABASE_NAME]
        # Trigger an actual connection check
        await db.client.admin.command('ping')
        db.is_connected = True
        logging.info("Connected to MongoDB!")
    except Exception as e:
        db.is_connected = False
        logging.error(f"Could not connect to MongoDB: {e}")
        raise RuntimeError(
            "Could not connect to MongoDB. Check MONGODB_URL, DATABASE_NAME, and network access."
        ) from e

async def close_mongo_connection():
    if db.client:
        logging.info("Closing MongoDB connection...")
        db.client.close()
        db.is_connected = False
        logging.info("Closed MongoDB connection!")
    else:
        # Avoid print for testing to see if logging is the issue
        print("No MongoDB connection to close.")


def ensure_database_connected():
    if db.db is None or not db.is_connected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is temporarily unavailable. Please try again shortly.",
        )
    return db.db
