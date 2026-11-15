from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid

from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.captions import router as captions_router
from app.api.v1.documents import router as documents_router
from app.api.v1.packages import router as packages_router
from app.api.v1.lessons import router as lessons_router

app = FastAPI(
    title="Lumo Accessibility Infrastructure API",
    description="""
    Open REST APIs for media accessibility, automated captioning, document remediation (PDF to HTML),
    offline learning packages, and source-grounded educational Q&A for Digital Bridge Hackathon 2026.
    """,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT"
    }
)

# CORS Middleware for embed SDK & host page cross-origin interactions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request ID & Timing Middleware
@app.middleware("http")
async def add_process_time_and_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", f"req_{uuid.uuid4().hex[:12]}")
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Mount v1 Routers (Support both /v1 and /api/v1 for standard and rewritten paths)
for prefix in ["/v1", "/api/v1"]:
    app.include_router(health_router, prefix=prefix, tags=["Health"])
    app.include_router(captions_router, prefix=prefix, tags=["Captions"])
    app.include_router(documents_router, prefix=prefix, tags=["Documents"])
    app.include_router(packages_router, prefix=prefix, tags=["Offline Packages"])
    app.include_router(lessons_router, prefix=prefix, tags=["AI Educator"])

@app.get("/v1/openapi.json", include_in_schema=False)
async def openapi_v1():
    return app.openapi()


@app.get("/")
async def root():
    return {
        "message": "Welcome to Lumo Accessibility API. Interactive docs available at /docs.",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "openapi_url": "/openapi.json"
    }
