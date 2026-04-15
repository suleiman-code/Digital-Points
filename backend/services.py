from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
import shutil
import os
import uuid
import re
from typing import List, Optional
from models import ServiceCreate, ServiceUpdate, ServiceResponse, ReviewCreate, ReviewResponse
from database import db
from auth import get_admin_user
from config import settings
from bson import ObjectId
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/services", tags=["Services"])
ALLOWED_REVIEW_STATUSES = {"pending", "approved", "rejected"}

ALLOWED_COUNTRIES = {"USA", "Canada"}

USA_STATE_TIMEZONES = {
    "AL": "America/Chicago",
    "AK": "America/Anchorage",
    "AZ": "America/Phoenix",
    "AR": "America/Chicago",
    "CA": "America/Los_Angeles",
    "CO": "America/Denver",
    "CT": "America/New_York",
    "DE": "America/New_York",
    "FL": "America/New_York",
    "GA": "America/New_York",
    "HI": "Pacific/Honolulu",
    "ID": "America/Denver",
    "IL": "America/Chicago",
    "IN": "America/Indiana/Indianapolis",
    "IA": "America/Chicago",
    "KS": "America/Chicago",
    "KY": "America/New_York",
    "LA": "America/Chicago",
    "ME": "America/New_York",
    "MD": "America/New_York",
    "MA": "America/New_York",
    "MI": "America/Detroit",
    "MN": "America/Chicago",
    "MS": "America/Chicago",
    "MO": "America/Chicago",
    "MT": "America/Denver",
    "NE": "America/Chicago",
    "NV": "America/Los_Angeles",
    "NH": "America/New_York",
    "NJ": "America/New_York",
    "NM": "America/Denver",
    "NY": "America/New_York",
    "NC": "America/New_York",
    "ND": "America/Chicago",
    "OH": "America/New_York",
    "OK": "America/Chicago",
    "OR": "America/Los_Angeles",
    "PA": "America/New_York",
    "RI": "America/New_York",
    "SC": "America/New_York",
    "SD": "America/Chicago",
    "TN": "America/Chicago",
    "TX": "America/Chicago",
    "UT": "America/Denver",
    "VT": "America/New_York",
    "VA": "America/New_York",
    "WA": "America/Los_Angeles",
    "WV": "America/New_York",
    "WI": "America/Chicago",
    "WY": "America/Denver",
    "DC": "America/New_York",
}

CANADA_PROVINCE_TIMEZONES = {
    "AB": "America/Edmonton",
    "BC": "America/Vancouver",
    "MB": "America/Winnipeg",
    "NB": "America/Moncton",
    "NL": "America/St_Johns",
    "NS": "America/Halifax",
    "NT": "America/Yellowknife",
    "NU": "America/Iqaluit",
    "ON": "America/Toronto",
    "PE": "America/Halifax",
    "QC": "America/Toronto",
    "SK": "America/Regina",
    "YT": "America/Whitehorse",
}

USA_STATE_NAME_TO_CODE = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
    "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC",
}

CANADA_PROVINCE_NAME_TO_CODE = {
    "alberta": "AB", "british columbia": "BC", "manitoba": "MB", "new brunswick": "NB",
    "newfoundland and labrador": "NL", "newfoundland": "NL", "nova scotia": "NS",
    "northwest territories": "NT", "nunavut": "NU", "ontario": "ON", "prince edward island": "PE",
    "quebec": "QC", "saskatchewan": "SK", "yukon": "YT",
}

def normalize_country(country: str | None) -> str:
    value = (country or "").strip().lower()
    if value in {"usa", "us", "united states", "united states of america", "u.s.", "u.s.a."}:
        return "USA"
    if value in {"canada", "ca"}:
        return "Canada"
    return (country or "").strip() or "USA"

def normalize_region_code(country: str, state: str | None) -> str:
    raw = (state or "").strip().lower().replace(".", "")
    if not raw:
        return ""

    if country == "USA":
        if len(raw) == 2:
            return raw.upper()
        return USA_STATE_NAME_TO_CODE.get(raw, "")

    if country == "Canada":
        if len(raw) == 2:
            return raw.upper()
        return CANADA_PROVINCE_NAME_TO_CODE.get(raw, "")

    return ""

def resolve_listing_timezone(country: str, state: str | None) -> str:
    normalized_country = normalize_country(country)
    region_code = normalize_region_code(normalized_country, state)

    if normalized_country == "Canada":
        return CANADA_PROVINCE_TIMEZONES.get(region_code, "America/Toronto")

    return USA_STATE_TIMEZONES.get(region_code, "America/New_York")

def apply_timezone_for_response(service_doc: dict) -> dict:
    if not service_doc:
        return service_doc
    country = service_doc.get("country") or "USA"
    state = service_doc.get("state")
    service_doc["timezone"] = resolve_listing_timezone(country, state)
    return service_doc

def _is_local_upload_path(path: str) -> bool:
    value = (path or "").strip().replace("\\", "/")
    return value.startswith("/static/uploads/") or value.startswith("static/uploads/")

def _local_upload_exists(path: str) -> bool:
    value = (path or "").strip().replace("\\", "/")
    if not value:
        return False
    if not _is_local_upload_path(value):
        return True

    relative = value[1:] if value.startswith("/") else value
    abs_path = os.path.join(".", relative)
    return os.path.isfile(abs_path)

def sanitize_media_for_response(service_doc: dict) -> dict:
    if not service_doc:
        return service_doc

    image_url = str(service_doc.get("image_url") or "").strip()
    if image_url and not _local_upload_exists(image_url):
        service_doc["image_url"] = ""

    gallery = service_doc.get("gallery")
    if isinstance(gallery, list):
        service_doc["gallery"] = [img for img in gallery if _local_upload_exists(str(img or ""))]

    return service_doc

def normalize_service_for_response(service_doc: dict) -> dict:
    service_doc = apply_timezone_for_response(service_doc)
    service_doc = sanitize_media_for_response(service_doc)
    return service_doc

def normalize_phone_number(phone: str) -> str:
    phone = (phone or "").strip()
    if phone.startswith("+"):
        return "+" + "".join(ch for ch in phone[1:] if ch.isdigit())
    return "".join(ch for ch in phone if ch.isdigit())

def is_valid_phone_number(phone: str) -> bool:
    if not phone:
        return False
    digits_count = sum(ch.isdigit() for ch in phone)
    return 7 <= digits_count <= 15

def is_valid_phone_number_for_country(phone: str, country: str) -> bool:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    normalized_country = normalize_country(country)

    # USA and Canada use NANP. Accept 10 digits or 11 digits with leading 1.
    if normalized_country in {"USA", "Canada"}:
        return len(digits) == 10 or (len(digits) == 11 and digits.startswith("1"))

    return is_valid_phone_number(phone)

def format_phone_for_country(phone: str, country: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    normalized_country = normalize_country(country)

    if normalized_country in {"USA", "Canada"}:
        if len(digits) == 10:
            return f"+1{digits}"
        if len(digits) == 11 and digits.startswith("1"):
            return f"+{digits}"

    return normalize_phone_number(phone)

CATEGORY_ALIASES = {
    "electrical": "Electrical Services",
    "electrical service": "Electrical Services",
    "electrical services": "Electrical Services",
    "electrician": "Electrical Services",
    "cleaning": "Cleaning Services",
    "cleaning service": "Cleaning Services",
    "cleaning services": "Cleaning Services",
    "hvac": "HVAC (Heating & Air)",
    "hvac services": "HVAC (Heating & Air)",
    "tech": "Tech Support",
    "tech services": "Tech Support",
}

def normalize_category(category: str) -> str:
    value = (category or "").strip()
    if not value:
        return value
    return CATEGORY_ALIASES.get(value.lower(), value)

def category_variants_for_query(category: str) -> list[str]:
    normalized = normalize_category(category)
    variants = [normalized]
    for alias, canonical in CATEGORY_ALIASES.items():
        if canonical.lower() == normalized.lower() and alias.lower() != normalized.lower():
            variants.append(alias)
    # keep order, remove duplicates
    seen = set()
    unique = []
    for item in variants:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique

# 1. GET ALL SERVICES (Public)
@router.get("/", response_model=List[ServiceResponse])
async def get_all_services(
    category: Optional[str] = None, 
    city: Optional[str] = None,
    state: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None
):
    query = {}
    if category:
        variants = category_variants_for_query(category)
        query["$or"] = [
            {"category": {"$regex": f"^{re.escape(v.strip())}$", "$options": "i"}}
            for v in variants
        ]
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if state:
        query["state"] = {"$regex": state, "$options": "i"}
    
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price

    if min_rating is not None:
        query["avg_rating"] = {"$gte": min_rating}
        
    services = await db.db["services"].find(query).sort([("featured", -1), ("created_at", -1), ("_id", -1)]).to_list(1000)
    services = [normalize_service_for_response(item) for item in services]
    return services

# 2. GET SINGLE SERVICE (Public)
@router.get("/{id}", response_model=ServiceResponse)
async def get_service(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")
        
    service = await db.db["services"].find_one({"_id": ObjectId(id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    return normalize_service_for_response(service)

# 3. CREATE SERVICE (Admin Only)
@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(service: ServiceCreate, admin: dict = Depends(get_admin_user)):
    normalized_country = normalize_country(service.country)
    if normalized_country not in ALLOWED_COUNTRIES:
        raise HTTPException(status_code=400, detail="Country must be either USA or Canada")

    if not service.contact_phone or not is_valid_phone_number_for_country(service.contact_phone, normalized_country):
        raise HTTPException(status_code=400, detail=f"Valid {normalized_country} contact number is required")

    service_dict = service.model_dump()
    service_dict["category"] = normalize_category(service_dict.get("category", ""))
    service_dict["country"] = normalized_country
    service_dict["contact_phone"] = format_phone_for_country(service.contact_phone, normalized_country)
    service_dict["timezone"] = resolve_listing_timezone(normalized_country, service.state)
    service_dict["created_at"] = datetime.now(timezone.utc)
    service_dict["updated_at"] = datetime.now(timezone.utc)
    
    new_service = await db.db["services"].insert_one(service_dict)
    created_service = await db.db["services"].find_one({"_id": new_service.inserted_id})
    return normalize_service_for_response(created_service)

# 4. UPDATE SERVICE (Admin Only)
@router.put("/{id}", response_model=ServiceResponse)
async def update_service(id: str, service_data: ServiceUpdate, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")

    existing_service = await db.db["services"].find_one({"_id": ObjectId(id)})
    if not existing_service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    update_data = {k: v for k, v in service_data.model_dump().items() if v is not None}

    if "country" in update_data:
        update_data["country"] = normalize_country(update_data["country"])
        if update_data["country"] not in ALLOWED_COUNTRIES:
            raise HTTPException(status_code=400, detail="Country must be either USA or Canada")

    validation_country = normalize_country(update_data.get("country") or existing_service.get("country") or "USA")

    if "contact_phone" in update_data:
        if not update_data["contact_phone"] or not is_valid_phone_number_for_country(update_data["contact_phone"], validation_country):
            raise HTTPException(status_code=400, detail=f"Valid {validation_country} contact number is required")
        update_data["contact_phone"] = format_phone_for_country(update_data["contact_phone"], validation_country)

    if "category" in update_data:
        update_data["category"] = normalize_category(update_data["category"])

    effective_country = normalize_country(update_data.get("country") or existing_service.get("country") or "USA")
    effective_state = update_data.get("state") if "state" in update_data else existing_service.get("state")
    update_data["timezone"] = resolve_listing_timezone(effective_country, effective_state)

    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.db["services"].update_one(
        {"_id": ObjectId(id)}, {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
        
    updated_service = await db.db["services"].find_one({"_id": ObjectId(id)})
    return normalize_service_for_response(updated_service)

# 5. DELETE SERVICE (Admin Only)
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(id: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")
        
    result = await db.db["services"].delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
        
    return None

# 6. GET DASHBOARD STATS (Admin Only)
@router.get("/dashboard/stats")
async def get_dashboard_stats(admin: dict = Depends(get_admin_user)):
    total_services = await db.db["services"].count_documents({})
    total_bookings = await db.db["bookings"].count_documents({})
    
    # Notifications/Badges counts (only count items that are NOT viewed)
    # We now count 'contact_messages' instead of 'bookings' for the Admin Inquiry badge
    pending_bookings = await db.db["contact_messages"].count_documents({"viewed": {"$ne": True}})
    pending_reviews = await db.db["reviews"].count_documents({"status": "pending", "viewed": {"$ne": True}})
    
    return {
        "total_services": total_services,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "pending_reviews": pending_reviews
    }

# 7. ADD REVIEW TO SERVICE (Public)
@router.post("/{id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(id: str, review: ReviewCreate):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")
        
    # Check if service exists
    service = await db.db["services"].find_one({"_id": ObjectId(id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    review_dict = review.model_dump()
    review_dict["service_id"] = id
    review_dict["service_name"] = service.get("title", "Unknown Service")
    review_dict["status"] = "pending"
    review_dict["created_at"] = datetime.now(timezone.utc)
    
    new_review = await db.db["reviews"].insert_one(review_dict)
    
    # Update Service Average Rating
    all_reviews = await db.db["reviews"].find({"service_id": id, "status": "approved"}).to_list(1000)
    count = len(all_reviews)
    avg = sum([r["rating"] for r in all_reviews]) / count if count > 0 else 0
    
    await db.db["services"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"avg_rating": round(avg, 1), "reviews_count": count}}
    )

    created_review = await db.db["reviews"].find_one({"_id": new_review.inserted_id})
    return created_review

# 8. GET REVIEWS FOR A SERVICE (Public)
@router.get("/{id}/reviews", response_model=List[ReviewResponse])
async def get_reviews(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")
        
    reviews = await db.db["reviews"].find({
        "service_id": id,
        "$or": [
            {"status": "approved"},
            {"status": {"$exists": False}},
        ],
    }).sort("created_at", -1).to_list(100)
    return reviews


# 9. LIST ALL REVIEWS FOR MODERATION (Admin Only)
@router.get("/reviews/moderation/all", response_model=List[ReviewResponse])
async def get_reviews_for_moderation(
    status: Optional[str] = None,
    days: Optional[int] = None,
    admin: dict = Depends(get_admin_user)
):
    query = {}
    if status and status.lower() in ALLOWED_REVIEW_STATUSES:
        query["status"] = status.lower()
    
    if days and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query["created_at"] = {"$gte": cutoff}

    reviews = await db.db["reviews"].find(query).sort("created_at", -1).to_list(500)
    for review in reviews:
        if review.get("status") not in ALLOWED_REVIEW_STATUSES:
            review["status"] = "approved"
    return reviews


# 10. UPDATE REVIEW STATUS (Admin Only)
@router.put("/reviews/moderation/{review_id}/status", response_model=ReviewResponse)
async def update_review_status(review_id: str, new_status: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(review_id):
        raise HTTPException(status_code=400, detail="Invalid Review ID")

    normalized_status = (new_status or "").strip().lower()
    if normalized_status not in ALLOWED_REVIEW_STATUSES:
        raise HTTPException(status_code=400, detail="Status must be pending, approved, or rejected")

    existing_review = await db.db["reviews"].find_one({"_id": ObjectId(review_id)})
    if not existing_review:
        raise HTTPException(status_code=404, detail="Review not found")

    await db.db["reviews"].update_one(
        {"_id": ObjectId(review_id)},
        {"$set": {"status": normalized_status}},
    )

    service_id = existing_review.get("service_id")
    if service_id and ObjectId.is_valid(service_id):
        approved_reviews = await db.db["reviews"].find({"service_id": service_id, "status": "approved"}).to_list(1000)
        count = len(approved_reviews)
        avg = sum([r["rating"] for r in approved_reviews]) / count if count > 0 else 0
        await db.db["services"].update_one(
            {"_id": ObjectId(service_id)},
            {"$set": {"avg_rating": round(avg, 1), "reviews_count": count}}
        )

    updated_review = await db.db["reviews"].find_one({"_id": ObjectId(review_id)})
    if updated_review and updated_review.get("status") not in ALLOWED_REVIEW_STATUSES:
        updated_review["status"] = "approved"
    return updated_review


# 11. DELETE REJECTED REVIEW PERMANENTLY (Admin Only)
@router.delete("/reviews/moderation/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review_permanently(review_id: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(review_id):
        raise HTTPException(status_code=400, detail="Invalid Review ID")

    existing_review = await db.db["reviews"].find_one({"_id": ObjectId(review_id)})
    if not existing_review:
        raise HTTPException(status_code=404, detail="Review not found")

    if str(existing_review.get("status", "pending")).lower() != "rejected":
        raise HTTPException(status_code=400, detail="Only rejected reviews can be permanently deleted")

    result = await db.db["reviews"].delete_one({"_id": ObjectId(review_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")

    return None

# 12. MARK REVIEW AS VIEWED (Admin Only)
@router.put("/reviews/moderation/{review_id}/view", status_code=status.HTTP_200_OK)
async def mark_review_viewed(review_id: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(review_id):
        raise HTTPException(status_code=400, detail="Invalid Review ID")
    
    await db.db["reviews"].update_one(
        {"_id": ObjectId(review_id)},
        {"$set": {"viewed": True}}
    )
    return {"message": "Review marked as viewed"}

# 12. UPLOAD MEDIA (Admin Only — Images & Videos)
@router.post("/upload/", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    allowed_image_ext = {"jpg", "jpeg", "png", "webp", "gif"}
    allowed_video_ext = {"mp4", "webm", "mov", "ogg"}
    allowed_extensions = allowed_image_ext | allowed_video_ext

    filename = file.filename or "upload"
    file_extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type '.{file_extension}' not allowed. Allowed: {', '.join(sorted(allowed_extensions))}")

    if file.content_type:
        is_image = file.content_type.startswith("image/")
        is_video = file.content_type.startswith("video/")
        if not is_image and not is_video:
            raise HTTPException(status_code=400, detail="Only image or video files are allowed")

    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    upload_dir = os.path.join("static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    base_url = settings.BACKEND_PUBLIC_URL.rstrip("/")
    return {"url": f"{base_url}/static/uploads/{unique_filename}"}
