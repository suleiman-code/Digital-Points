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
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Service (Listings) Models ---
class ServiceBase(BaseModel):
    title: str
    description: str
    category: str
    price: float = Field(..., gt=0)
    city: str
    state: str
    image_url: Optional[str] = None
    service_details: Optional[str] = None

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    city: Optional[str] = None
    state: Optional[str] = None
    image_url: Optional[str] = None
    service_details: Optional[str] = None

class ServiceResponse(ServiceBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# --- Booking (Inquiries) Models ---
class BookingBase(BaseModel):
    service_id: str
    service_name: str
    user_name: str
    user_email: EmailStr
    user_phone: str
    message: str
    booking_date: Optional[datetime] = None

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    status: str = "pending" # pending, contacted, completed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
