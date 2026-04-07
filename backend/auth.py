from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field, EmailStr
from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig
from config import settings
from rate_limit import limiter
from database import db
from models import PyObjectId, UserResponse, UserCreate, UserBase

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Password Hashing Settings
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

reset_mail_conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_PORT == 587,
    MAIL_SSL_TLS=settings.MAIL_PORT == 465,
    USE_CREDENTIALS=settings.USE_CREDENTIALS,
    VALIDATE_CERTS=settings.VALIDATE_CERTS,
)


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


def create_password_reset_token(email: str):
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload = {
        "sub": email,
        "type": "password_reset",
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def send_reset_password_email(email: str, token: str):
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        return

    reset_link = f"{settings.FRONTEND_URL.rstrip('/')}/admin/reset-password?token={token}"
    message = MessageSchema(
        subject="Reset your Digital Point admin password",
        recipients=[email],
        body=(
            "<div style='font-family:Arial,sans-serif;line-height:1.6;color:#111827'>"
            "<h2 style='margin:0 0 12px'>Admin Password Reset</h2>"
            "<p>You requested an admin password reset for Digital Point.</p>"
            f"<p><a href='{reset_link}' style='display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px'>Reset Password</a></p>"
            f"<p style='word-break:break-all'>If button does not work, open this link:<br>{reset_link}</p>"
            "<p>This link expires in 30 minutes. If you did not request this, ignore this email.</p>"
            "</div>"
        ),
        subtype=MessageType.html,
    )
    fm = FastMail(reset_mail_conf)
    try:
        await fm.send_message(message)
    except Exception as exc:
        # Keep response generic and do not leak mail transport state to clients.
        print(f"Failed to send password reset email: {exc}")


async def get_admin_account():
    admin_user = await db.db["users"].find_one({"is_admin": True})
    if admin_user:
        return admin_user

    # Backward compatibility for legacy records without role fields.
    oldest_user = await db.db["users"].find_one(sort=[("created_at", 1)])
    return oldest_user

def verify_password(plain_password: str, hashed_password: str):
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str):
    # Hash a password for the first time
    # (bcrypt.hashpw returns bytes; we decode to string for MongoDB storage)
    return bcrypt.hashpw(
        password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_jwt_with_rotation(token: str):
    decode_keys = [settings.SECRET_KEY, *settings.previous_secret_keys()]
    last_error: Optional[Exception] = None
    for key in decode_keys:
        try:
            return jwt.decode(token, key, algorithms=[settings.ALGORITHM])
        except JWTError as exc:
            last_error = exc
    raise last_error or JWTError("Invalid token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_jwt_with_rotation(token)
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await db.db["users"].find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("is_admin") is True:
        return current_user

    # Backward compatibility: for legacy records without is_admin,
    # treat the oldest account as admin until roles are explicitly set.
    if "is_admin" not in current_user:
        oldest_user = await db.db["users"].find_one(sort=[("created_at", 1)])
        if oldest_user and oldest_user.get("_id") == current_user.get("_id"):
            return current_user

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

# 1. SIGNUP (Initial admin creation)
@router.post("/signup", response_model=UserResponse)
@limiter.limit("5/minute")
async def signup(request: Request, user: UserCreate):
    # Check if user already exists
    existing_user = await db.db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user.password)
    user_dict["created_at"] = datetime.now(timezone.utc)

    # First registered user is admin by default.
    if user_dict.get("is_admin") is None:
        users_count = await db.db["users"].count_documents({})
        user_dict["is_admin"] = users_count == 0
    
    new_user = await db.db["users"].insert_one(user_dict)
    created_user = await db.db["users"].find_one({"_id": new_user.inserted_id})
    return created_user

# 2. LOGIN
@router.post("/login")
@limiter.limit(settings.RATE_LIMIT_LOGIN)
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.db["users"].find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password")
@limiter.limit(settings.RATE_LIMIT_FORGOT_PASSWORD)
async def forgot_password(request: Request, payload: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = await db.db["users"].find_one({"email": payload.email})
    if user:
        is_admin = user.get("is_admin") is True
        if not is_admin and "is_admin" not in user:
            oldest_user = await db.db["users"].find_one(sort=[("created_at", 1)])
            is_admin = bool(oldest_user and oldest_user.get("_id") == user.get("_id"))

        if is_admin:
            token = create_password_reset_token(payload.email)
            background_tasks.add_task(send_reset_password_email, payload.email, token)

    # Always return a generic response to avoid account/email enumeration.
    return {"message": "If this admin account exists, a reset link has been sent."}


@router.post("/reset-password")
@limiter.limit(settings.RATE_LIMIT_RESET_PASSWORD)
async def reset_password(request: Request, payload: ResetPasswordRequest):
    normalized_token = payload.token.strip().replace(" ", "")
    try:
        decoded = decode_jwt_with_rotation(normalized_token)
        email = decoded.get("sub")
        token_type = decoded.get("type")
        if not email or token_type != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = await db.db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    is_admin = user.get("is_admin") is True
    if not is_admin and "is_admin" not in user:
        oldest_user = await db.db["users"].find_one(sort=[("created_at", 1)])
        is_admin = bool(oldest_user and oldest_user.get("_id") == user.get("_id"))

    if not is_admin:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    await db.db["users"].update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password": get_password_hash(payload.new_password),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return {"message": "Password updated successfully."}

# 3. GET CURRENT USER
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
