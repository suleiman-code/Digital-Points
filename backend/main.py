from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from config import settings
from rate_limit import limiter
from database import connect_to_mongo, close_mongo_connection
from services import router as service_router
from bookings import router as booking_router
from auth import router as auth_router
from contact import router as contact_router
from contextlib import asynccontextmanager
import logging
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Backend starting...")
    if not settings.MONGODB_URL:
        raise RuntimeError("MONGODB_URL is required. Configure it in backend/.env")
    if not settings.SECRET_KEY:
        raise RuntimeError("SECRET_KEY is required. Configure it in backend/.env")
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title=settings.PROJECT_NAME, 
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Ensure static directory exists
if not os.path.exists("./static/uploads"):
    os.makedirs("./static/uploads")

# Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Register Routers
app.include_router(auth_router)
app.include_router(service_router)
app.include_router(booking_router)
app.include_router(contact_router)

# CORS Settings
origins = settings.cors_origins()
allow_credentials = "*" not in origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*", "localhost", "127.0.0.1"],
)

app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

@app.get("/", response_class=HTMLResponse)
def read_root():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Digital Point API</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;800&display=swap" rel="stylesheet">
        <style>
            :root { --primary: #3b82f6; --bg: #0f172a; }
            body { 
                margin: 0; font-family: 'Outfit', sans-serif; 
                background: var(--bg); color: white;
                height: 100vh; display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent), var(--bg);
            }
            .card { 
                background: rgba(255, 255, 255, 0.03); padding: 50px 80px; border-radius: 32px;
                text-align: center; border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px); box-shadow: 0 40px 100px rgba(0,0,0,0.5);
            }
            h1 { font-size: 38px; margin: 0; font-weight: 800; letter-spacing: -1px; }
            p { color: #94a3b8; margin: 15px 0 40px; font-size: 18px; }
            .btn { 
                display: inline-block; background: var(--primary); color: white;
                padding: 16px 40px; border-radius: 12px; text-decoration: none;
                font-weight: 700; font-size: 16px; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
            }
            .btn:hover { transform: translateY(-3px) scale(1.02); background: #2563eb; box-shadow: 0 15px 30px rgba(59, 130, 246, 0.4); }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Welcome to Digital Point Fastapi</h1>
            <p>Your business directory API engine is live and ready.</p>
            <a href="/docs" class="btn">Explore Swagger UI</a>
        </div>
    </body>
    </html>
    """

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
