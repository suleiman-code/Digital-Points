from pydantic import BaseModel, EmailStr, Field, GetCoreSchemaHandler, ConfigDict
from pydantic_core import core_schema
from datetime import datetime, timezone
from typing import Optional, Any
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x),
                when_used='always'
            ),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

# --- User (Admin) Models ---
class UserBase(BaseModel):
    email: EmailStr = Field(..., max_length=254)
    first_name: str = Field(..., min_length=1, max_length=80)
    last_name: str = Field(..., min_length=1, max_length=80)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    is_admin: Optional[bool] = None

class UserResponse(UserBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Service (Listings) Models ---
class ServiceBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    description: str = Field(..., min_length=10, max_length=2000)
    category: str = Field(..., min_length=2, max_length=120)
    price: Optional[float] = Field(default=0.0, ge=0)
    city: str = Field(..., min_length=1, max_length=120)
    state: str = Field(..., min_length=1, max_length=120)
    featured: bool = False
    image_url: Optional[str] = Field(default=None, max_length=2048)
    service_details: Optional[str] = Field(default=None, max_length=5000)
    # --- New Business Directory Fields ---
    address: Optional[str] = Field(default=None, max_length=300)
    contact_phone: Optional[str] = Field(default=None, max_length=30)
    contact_email: Optional[EmailStr] = None
    website_url: Optional[str] = Field(default=None, max_length=2048)
    business_hours: Optional[dict[str, str]] = None # e.g. {"Monday": "9am-6pm", "Tuesday": "Closed"}
    google_maps_url: Optional[str] = Field(default=None, max_length=2048)
    country: str = Field(default="USA", max_length=120) # Added default USA
    timezone: Optional[str] = Field(default=None, max_length=120)
    sub_services: Optional[list[str]] = None # Custom Inner Page links defined by Admin
    reviews: list[dict] = Field(default_factory=list) # User feedback: [{user, rating, comment, date}]
    gallery: Optional[list[str]] = Field(default_factory=list)
    avg_rating: float = 0.0
    reviews_count: int = 0

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, min_length=10, max_length=2000)
    category: Optional[str] = Field(default=None, min_length=2, max_length=120)
    price: Optional[float] = None
    city: Optional[str] = Field(default=None, min_length=1, max_length=120)
    state: Optional[str] = Field(default=None, min_length=1, max_length=120)
    featured: Optional[bool] = None
    image_url: Optional[str] = Field(default=None, max_length=2048)
    service_details: Optional[str] = Field(default=None, max_length=5000)
    address: Optional[str] = Field(default=None, max_length=300)
    contact_phone: Optional[str] = Field(default=None, max_length=30)
    contact_email: Optional[EmailStr] = None
    website_url: Optional[str] = Field(default=None, max_length=2048)
    business_hours: Optional[dict[str, str]] = None
    google_maps_url: Optional[str] = Field(default=None, max_length=2048)
    country: Optional[str] = Field(default=None, max_length=120)
    timezone: Optional[str] = Field(default=None, max_length=120)
    sub_services: Optional[list[str]] = None
    gallery: Optional[list[str]] = None
    avg_rating: Optional[float] = None
    reviews_count: Optional[int] = None

class ServiceResponse(ServiceBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Booking (Inquiries) Models ---
class BookingBase(BaseModel):
    service_id: str = Field(..., min_length=1, max_length=64)
    service_name: str = Field(..., min_length=2, max_length=160)
    user_name: str = Field(..., min_length=2, max_length=120)
    user_email: EmailStr
    user_phone: str = Field(..., min_length=7, max_length=30)
    user_city: str = Field(..., min_length=1, max_length=120)
    message: str = Field(..., min_length=10, max_length=3000)
    booking_date: Optional[datetime] = None

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    status: str = "pending" # pending, contacted, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Review Models ---
class ReviewBase(BaseModel):
    user_name: str = Field(..., min_length=2, max_length=120)
    user_email: Optional[str] = None
    rating: float = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=2, max_length=3000)

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    service_id: Optional[str] = None
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
