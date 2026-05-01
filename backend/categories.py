from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import CategoryCreate, CategoryResponse, CategoryStats
from database import db
from auth import get_admin_user
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("/stats", response_model=CategoryStats)
async def get_categories_stats(admin: dict = Depends(get_admin_user)):
    total_categories = await db.db["categories"].count_documents({})
    
    # Active categories are those used in any service
    # We use aggregate to find unique categories used in the services collection
    pipeline = [
        {"$group": {"_id": "$category"}},
        {"$count": "count"}
    ]
    cursor = db.db["services"].aggregate(pipeline)
    result = await cursor.to_list(1)
    active_categories = result[0]["count"] if result else 0
    
    return {
        "total_categories": total_categories,
        "active_categories": active_categories
    }

@router.get("", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.db["categories"].find().sort("name", 1).to_list(1000)
    return categories

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate, admin: dict = Depends(get_admin_user)):
    # Check if category already exists
    existing = await db.db["categories"].find_one({"name": {"$regex": f"^{category.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    category_dict = category.model_dump()
    category_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await db.db["categories"].insert_one(category_dict)
    created = await db.db["categories"].find_one({"_id": result.inserted_id})
    return created

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(id: str, admin: dict = Depends(get_admin_user)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid Category ID")
        
    result = await db.db["categories"].delete_one({"_id": ObjectId(id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
        
    return None
