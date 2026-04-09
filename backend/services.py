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
from datetime import datetime, timezone

router = APIRouter(prefix="/api/services", tags=["Services"])

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
        
    services = await db.db["services"].find(query).sort([("featured", -1), ("created_at", -1), ("_id", -1)]).to_list(100)
    return services

# 2. GET SINGLE SERVICE (Public)
@router.get("/{id}", response_model=ServiceResponse)
async def get_service(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")
        
    service = await db.db["services"].find_one({"_id": ObjectId(id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    return service

# 3. CREATE SERVICE (Admin Only)
@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(service: ServiceCreate, admin: dict = Depends(get_admin_user)):
    if not service.contact_phone or not is_valid_phone_number(service.contact_phone):
        raise HTTPException(status_code=400, detail="Valid business contact number is required")

    service_dict = service.model_dump()
    service_dict["category"] = normalize_category(service_dict.get("category", ""))
    service_dict["contact_phone"] = normalize_phone_number(service.contact_phone)
    service_dict["created_at"] = datetime.now(timezone.utc)
    service_dict["updated_at"] = datetime.now(timezone.utc)
    
    new_service = await db.db["services"].insert_one(service_dict)
    created_service = await db.db["services"].find_one({"_id": new_service.inserted_id})
    return created_service

# 4. UPDATE SERVICE (Admin Only)
@router.put("/{id}", response_model=ServiceResponse)
async def update_service(id: str, service_data: ServiceUpdate, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")
        
    update_data = {k: v for k, v in service_data.model_dump().items() if v is not None}

    if "contact_phone" in update_data:
        if not update_data["contact_phone"] or not is_valid_phone_number(update_data["contact_phone"]):
            raise HTTPException(status_code=400, detail="Valid business contact number is required")
        update_data["contact_phone"] = normalize_phone_number(update_data["contact_phone"])

    if "category" in update_data:
        update_data["category"] = normalize_category(update_data["category"])

    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.db["services"].update_one(
        {"_id": ObjectId(id)}, {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
        
    updated_service = await db.db["services"].find_one({"_id": ObjectId(id)})
    return updated_service

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
    pending_bookings = await db.db["bookings"].count_documents({"status": "pending"})
    
    return {
        "total_services": total_services,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings
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
    review_dict["created_at"] = datetime.now(timezone.utc)
    
    new_review = await db.db["reviews"].insert_one(review_dict)
    
    # Update Service Average Rating
    all_reviews = await db.db["reviews"].find({"service_id": id}).to_list(1000)
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
        
    reviews = await db.db["reviews"].find({"service_id": id}).sort("created_at", -1).to_list(100)
    return reviews

# 9. UPLOAD IMAGE (Admin Only)
@router.post("/upload/", status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    allowed_extensions = {"jpg", "jpeg", "png", "webp", "gif"}
    filename = file.filename or "upload"
    file_extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if file_extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    upload_dir = os.path.join("static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    base_url = settings.BACKEND_PUBLIC_URL.rstrip("/")
    return {"url": f"{base_url}/static/uploads/{unique_filename}"}
