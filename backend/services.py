from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from models import ServiceCreate, ServiceUpdate, ServiceResponse, ReviewCreate, ReviewResponse
from database import db
from auth import get_admin_user
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/services", tags=["Services"])

# 1. GET ALL SERVICES (Public)
@router.get("/", response_model=List[ServiceResponse])
async def get_all_services(category: Optional[str] = None, city: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
        
    services = await db.db["services"].find(query).to_list(100)
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
    service_dict = service.model_dump()
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
        raise HTTPException(status_code=404, detail="Service not found. Cannot add review.")

    review_dict = review.model_dump()
    review_dict["service_id"] = id # Force the ID from URL
    review_dict["created_at"] = datetime.now(timezone.utc)
    
    new_review = await db.db["reviews"].insert_one(review_dict)
    created_review = await db.db["reviews"].find_one({"_id": new_review.inserted_id})
    return created_review

# 8. GET REVIEWS FOR A SERVICE (Public)
@router.get("/{id}/reviews", response_model=List[ReviewResponse])
async def get_reviews(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Service ID")
        
    reviews = await db.db["reviews"].find({"service_id": id}).sort("created_at", -1).to_list(100)
    return reviews
