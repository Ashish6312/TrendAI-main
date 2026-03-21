print("--- TrendAI Backend Booting (v2.0) ---")
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timedelta
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
import os
import logging
import traceback
import json
from typing import Dict, List, Any, Optional

# Initialize FastAPI app EARLY for health checks
app = FastAPI(title="TrendAI Business Intelligence API", version="2.0")

@app.get("/")
async def root():
    return {"status": "online", "message": "TrendAI API Shell Active", "version": "2.0"}

@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": str(datetime.now())}

# Handle favicon.ico
@app.get("/favicon.ico", include_in_schema=False)
async def favicon_simple():
    from fastapi.responses import Response
    return Response(status_code=204)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for optional imports
db_available = False
models_available = False
recommendations_available = False
integrated_intelligence = None

# Try to import database components
try:
    from database import get_db, init_database, check_db_connection
    db_available = True
    logger.info("✅ Database imports successful")
except Exception as e:
    logger.error(f"⚠️ Database import failed: {e}")
    db_available = False
    # Create dummy functions
    def get_db():
        raise HTTPException(status_code=503, detail="Database not available")
    def init_database():
        pass
    def check_db_connection():
        return False

# Initialize database if available
if db_available:
    try:
        init_database()
        db_status = check_db_connection()
        if not db_status:
            logger.warning("Database connection test failed")
        else:
            logger.info("✅ Database connection successful")
    except Exception as e:
        logger.error(f"⚠️ Database initialization failed: {e}")
        db_available = False

# Try to import models
try:
    import models
    models_available = True
    logger.info("✅ Models imported successfully")
except Exception as e:
    logger.error(f"⚠️ Models import failed: {e}")
    models_available = False

# Try to import recommendation engines
try:
    from simple_recommendations import generate_ai_business_plan, generate_ai_roadmap
    recommendations_available = True
    logger.info("✅ Simple recommendations imported successfully")
except Exception as e:
    logger.error(f"⚠️ Simple recommendations import failed: {e}")
    recommendations_available = False
    # Create dummy functions to prevent crashes
    def generate_ai_business_plan(*args, **kwargs):
        return None
    def generate_ai_roadmap(*args, **kwargs):
        return None

# Import integrated intelligence lazily
_cached_intelligence = None
def get_intelligence():
    global _cached_intelligence
    if _cached_intelligence is None:
        try:
            from integrated_business_intelligence import IntegratedBusinessIntelligence
            _cached_intelligence = IntegratedBusinessIntelligence()
            logger.info("✅ Integrated business intelligence initialized lazily")
        except Exception as e:
            logger.error(f"⚠️ Lazy intelligence initialization failed: {e}")
            logger.error(f"Full error: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    return _cached_intelligence

# Remove module-level import that was previously here
# integrated_intelligence = ... (now accessed via get_intelligence())

# Standard FastAPI app initialization
import models

# Initialize FastAPI app without lifespan for Vercel compatibility
app = FastAPI(title="TrendAI Business Intelligence API", version="2.0")

# No additional database initialization here since it's done above

# CORS configuration - FIXED
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://trend-ai-main.vercel.app")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# Add production domains
production_domains = [
    "https://trend-ai-main.vercel.app",
    "https://*.vercel.app",
    "*"  # Allow all origins temporarily to fix CORS
]
allowed_origins.extend(production_domains)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "https://trend-ai-main.vercel.app",
        "https://*.vercel.app",
        "*"  # Allow all origins to fix CORS issues
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# Database dependency with error handling
def get_db_session():
    """Get database session with error handling"""
    if not db_available:
        raise HTTPException(status_code=503, detail="Database not available")
    try:
        from database import SessionLocal
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database session error: {e}")
        raise HTTPException(status_code=503, detail="Database connection failed")

# Use the original get_db but with fallback
def get_db_with_fallback():
    """Original get_db function with fallback handling"""
    if db_available:
        try:
            return get_db()
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise HTTPException(status_code=503, detail="Database not available")
    else:
        raise HTTPException(status_code=503, detail="Database not available")
class UserSignUp(BaseModel):
    email: str
    password: str
    name: str

class UserSignIn(BaseModel):
    email: str
    password: str

class UserSync(BaseModel):
    email: str
    name: Optional[str] = None
    image_url: Optional[str] = None

class LoginSession(BaseModel):
    user_email: str
    session_token: str
    provider: str = "google"
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Optional[Dict] = None
    location_info: Optional[Dict] = None
    login_method: str = "oauth"

class RecommendationRequest(BaseModel):
    area: str
    user_email: str = "anonymous"
    language: str = "English"
    phase: str = "discovery"  # Business development phase

class BusinessPlanRequest(BaseModel):
    business_title: str
    area: str
    user_email: str = "anonymous"
    language: str = "English"

class RoadmapStepUpdate(BaseModel):
    user_email: str
    title: str
    area: str
    current_step: int

class RoadmapGuideRequest(BaseModel):
    step_title: str
    step_description: str
    business_type: str
    location: str


class SubscriptionCreate(BaseModel):
    user_email: str
    plan_name: str
    plan_display_name: str
    billing_cycle: str
    price: float
    currency: str = "USD"
    max_analyses: int = 5
    features: dict
    razorpay_subscription_id: Optional[str] = None
    razorpay_customer_id: Optional[str] = None

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    subscription_end: Optional[str] = None
    max_analyses: Optional[int] = None
    features: Optional[dict] = None

class LocationResponse(BaseModel):
    country: str
    city: str
    currency: str
    country_code: str
    ip: Optional[str] = None

class PaymentCreate(BaseModel):
    user_email: str
    subscription_id: Optional[int] = None
    amount: float
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: Optional[str] = None
    status: str = "success"
    payment_method: Optional[str] = None
    plan_name: str
    billing_cycle: str



@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    """Handle CORS preflight requests"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    """Add CORS headers to all responses"""
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# Root endpoint for health checks and deployment verification
@app.get("/")
async def root():
    return {"status": "online", "message": "TrendAI Business Intelligence API is active", "version": "2.0"}

# Handle favicon.ico to avoid 500 errors
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    from fastapi.responses import Response
    return Response(status_code=204)

# Simple global cache for location data (IP -> data)
LOCATION_CACHE = {}

@app.get("/api/system/location")
async def get_system_location(request: Request):
    """Proxy for location data to avoid CORS and rate limits with caching"""
    import httpx
    
    # Try to get client IP from headers (behind proxy like Render/Cloudflare)
    client_ip = "127.0.0.1"
    if hasattr(request, 'headers'):
        client_ip = request.headers.get("x-forwarded-for") or request.headers.get("x-real-ip") or (request.client.host if request.client else "127.0.0.1")
        # If multiple IPs in x-forwarded-for, take the first one
        if "," in client_ip:
            client_ip = client_ip.split(",")[0].strip()

    # Check cache first (cache for 1 hour roughly by clearing it occasionally, or just keep it simple)
    if client_ip in LOCATION_CACHE:
        # print(f"DEBUG: Returning cached location for IP: {client_ip}")
        return LOCATION_CACHE[client_ip]

    apis = [
        f"https://ipapi.co/{client_ip}/json/" if client_ip != "127.0.0.1" else "https://ipapi.co/json/",
        "https://ip-api.com/json/",
        "https://api.bigdatacloud.net/data/reverse-geocode-client"
    ]
    
    for api in apis:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(api, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    location_data = {
                        "country": data.get("country_name") or data.get("country") or "Unknown",
                        "city": data.get("city") or "Unknown",
                        "currency": data.get("currency") or "USD",
                        "country_code": data.get("country_code") or data.get("countryCode") or "US",
                        "ip": data.get("ip") or data.get("query") or client_ip
                    }
                    # Save to cache
                    if client_ip != "127.0.0.1":
                        LOCATION_CACHE[client_ip] = location_data
                    return location_data
        except Exception as e:
            print(f"Location API {api} failed: {e}")
            continue
            
    fallback_data = {
        "country": "India",
        "city": "Bhopal",
        "currency": "INR",
        "country_code": "IN",
        "ip": client_ip
    }
    return fallback_data

@app.get("/")
def read_root():
    try:
        return {
            "message": "TrendAI Business Intelligence API", 
            "status": "healthy", 
            "version": "2.0",
            "timestamp": datetime.now().isoformat(),
            "system_status": {
                "database": "connected" if db_available else "disconnected",
                "models": "available" if models_available else "unavailable", 
                "recommendations": "available" if recommendations_available else "unavailable",
                "integrated_intelligence": "available" if get_intelligence() else "unavailable"
            },
            "environment_check": {
                "database_url": bool(os.getenv("DATABASE_URL")),
                "pollination_key": bool(os.getenv("POLLINATION_API_KEY")),
                "serpapi_key": bool(os.getenv("SERPAPI_API_KEY")),
                "gemini_key": bool(os.getenv("GEMINI_API_KEY"))
            }
        }
    except Exception as e:
        logger.error(f"Root endpoint error: {e}")
        return {
            "message": "API running with limited functionality",
            "status": "partial",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/health")
def health_check():
    """Health check endpoint for Vercel"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "database": "ok" if db_available else "error",
                "models": "ok" if models_available else "error",
                "recommendations": "ok" if recommendations_available else "error",
                "integrated_intelligence": "ok" if get_intelligence() else "error"
            }
        }
        
        if db_available:
            try:
                db_check = check_db_connection()
                health_status["database_test"] = "passed" if db_check else "failed"
            except Exception as e:
                health_status["database_test"] = f"error: {str(e)}"
        
        return health_status
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }



@app.post("/api/auth/signup")
def sign_up(user_data: UserSignUp, db: Session = Depends(get_db)):
    """Sign up with email and password"""
    print(f"Sign up attempt for: {user_data.email}")
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Validate password strength
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
    
    # Hash password
    password_hash = pwd_context.hash(user_data.password)
    
    # Create new user
    db_user = models.User(
        email=user_data.email,
        name=user_data.name,
        password_hash=password_hash,
        auth_provider="email",
        login_count=1,
        last_login=func.now()
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    print(f"User created successfully: {user_data.email}")
    return {
        "id": db_user.id,
        "email": db_user.email,
        "name": db_user.name,
        "image_url": db_user.image_url
    }

@app.post("/api/auth/signin")
def sign_in(user_data: UserSignIn, db: Session = Depends(get_db)):
    """Sign in with email and password"""
    print(f"Sign in attempt for: {user_data.email}")
    
    # Find user
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user has a password (might be OAuth only)
    if not db_user.password_hash:
        raise HTTPException(status_code=401, detail="This account uses social login. Please sign in with Google.")
    
    # Verify password
    if not pwd_context.verify(user_data.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Update login info
    db_user.login_count = (db_user.login_count or 0) + 1
    db_user.last_login = func.now()
    db.commit()
    
    print(f"User signed in successfully: {user_data.email}")
    return {
        "id": db_user.id,
        "email": db_user.email,
        "name": db_user.name,
        "image_url": db_user.image_url
    }

@app.post("/api/users/sync")
def sync_user(user_data: UserSync, db: Session = Depends(get_db)):
    """Sync user from NextAuth, creating if not exists"""
    from sqlalchemy import func
    email_normalized = user_data.email.lower().strip()
    print(f"DEBUG: Syncing user {email_normalized}")
    
    db_user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    
    if db_user:
        # Update existing user
        db_user.name = user_data.name or db_user.name
        db_user.image_url = user_data.image_url or db_user.image_url
        db_user.login_count = (db_user.login_count or 0) + 1
        db_user.last_login = func.now()
    else:
        # Create new user
        db_user = models.User(
            email=email_normalized,
            name=user_data.name,
            image_url=user_data.image_url,
            login_count=1,
            last_login=func.now(),
            auth_provider="google"
        )
        db.add(db_user)
    
    db.commit()
    db.refresh(db_user)
    return {"status": "ok", "user_id": db_user.id}

@app.post("/api/users/login-session")
def create_login_session(session: LoginSession, db: Session = Depends(get_db)):
    """Create a new login session record"""
    print(f"Creating login session for user: {session.user_email}")
    
    try:
        # End any existing active sessions for this user
        existing_sessions = db.query(models.UserSession).filter(
            models.UserSession.user_email == session.user_email,
            models.UserSession.is_active == True
        ).all()
        
        for existing_session in existing_sessions:
            existing_session.is_active = False
            existing_session.session_end = func.now()
        
        # Create new session
        db_session = models.UserSession(
            user_email=session.user_email,
            session_token=session.session_token,
            provider=session.provider,
            ip_address=session.ip_address,
            user_agent=session.user_agent,
            device_info=session.device_info,
            location_info=session.location_info,
            login_method=session.login_method
        )
        
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        
        print(f"Created login session: {db_session.id}")
        return {"status": "ok", "session_id": db_session.id}
    except Exception as e:
        print(f"Failed to create login session (ignoring missing table): {e}")
        db.rollback()
        return {"status": "ok", "session_id": -1}

@app.post("/api/recommendations")
def get_recommendations(request: RecommendationRequest, db: Session = Depends(get_db)):
    print(f"--- API CALLED - Starting recommendations for: {request.area}")
    print(f"--- User email: {request.user_email}")
    
    try:
        # Get user's saved location from profile as default
        user_location = None
        if request.user_email:
            from sqlalchemy import func
            user = db.query(models.User).filter(func.lower(models.User.email) == request.user_email.lower()).first()
            if user and user.location:
                user_location = user.location
                print(f"--- User's profile location: {user_location}")
        
        # Use request area if provided, otherwise use profile location
        analysis_area = request.area if request.area else user_location
        
        if not analysis_area:
            return {
                "error": "No location provided. Please enter a location or set one in your profile.",
                "area": "",
                "analysis": {"error": "Location required"},
                "recommendations": [],
                "profile_location_available": bool(user_location),
                "profile_location": user_location
            }
        
        print(f"--- Final analysis area: {analysis_area}")
        
        # Cache Check: Look for recent searches for the same area by same user
        existing_record = db.query(models.SearchHistory).filter(
            models.SearchHistory.user_email == request.user_email,
            models.SearchHistory.area == analysis_area
        ).order_by(models.SearchHistory.created_at.desc()).first()
        
        # Helper to safely parse JSON from DB
        def safe_json_load(data):
            if not data: return {}
            if not isinstance(data, str): return data
            try:
                return json.loads(data)
            except:
                return data # Return as raw string if not JSON

        if existing_record:
            cached_recs = safe_json_load(existing_record.recommendations)
            # 🎯 CACHE QUALITY GUARD: If cached data is a lean fallback (e.g. only 1-5 items), 
            # we force a refresh to provide full 15 items now that the system is upgraded.
            if isinstance(cached_recs, list) and len(cached_recs) >= 10:
                print(f"♻️  Returning high-quality cached intelligence from database (ID: {existing_record.id}, {len(cached_recs)} items)")
                return {
                    "id": existing_record.id,
                    "area": existing_record.area,
                    "analysis": safe_json_load(existing_record.analysis),
                    "recommendations": cached_recs,
                    "logs": {"reddit": [], "web": []},
                    "cached": True,
                    "using_profile_location": bool(user_location and not request.area),
                    "profile_location": user_location
                }
            else:
                print(f"⚠️  Cached result for {analysis_area} is stale or low-quality (len={len(cached_recs) if isinstance(cached_recs, list) else 0}). Purging and refreshing...")
                db.delete(existing_record)
                db.commit()

        print("[SUCCESS] No cache found. Calling fresh REAL-TIME intelligence engine...")
        # Generate dynamic recommendations DIRECTLY from intelligence module (Zero Hardcoding)
        intelligence = get_intelligence()
        if intelligence:
            try:
                result = intelligence.generate_data_driven_recommendations(analysis_area, request.user_email, request.language, request.phase)
                print(f"[SUCCESS] Generated {len(result['recommendations'])} real-time recommendations")
            except Exception as e:
                logger.error(f"Integrated intelligence failed: {e}")
                result = None
        else:
            result = None
            
        if not result and recommendations_available:
            try:
                print("⚠️ Integrated intelligence not available, using fallback")
                # Import fallback function with error handling
                try:
                    from simple_recommendations import generate_dynamic_recommendations
                    result = generate_dynamic_recommendations(analysis_area, request.user_email, request.language)
                    print(f"[FALLBACK] Generated {len(result.get('recommendations', []))} fallback recommendations")
                except ImportError as ie:
                    logger.error(f"Failed to import fallback function: {ie}")
                    result = None
            except Exception as e:
                logger.error(f"Simple recommendations failed: {e}")
                result = None
        
        # Ultimate fallback if all engines fail
        if not result:
            logger.warning("All recommendation engines failed, using ultimate fallback")
            result = {
                "analysis": {
                    "executive_summary": f"Business analysis for {analysis_area} shows potential opportunities in the local market.",
                    "market_overview": f"The {analysis_area} region presents various business opportunities for entrepreneurs.",
                    "confidence_score": "75%",
                    "key_facts": [
                        f"Growing market in {analysis_area}",
                        "Diverse business opportunities available", 
                        "Local demand for innovative services"
                    ]
                },
                "recommendations": [
                    {
                        "title": "Local Service Business",
                        "description": f"Start a service-based business targeting the {analysis_area} market with focus on local needs.",
                        "profitability_score": 75,
                        "funding_required": "₹10L",
                        "estimated_revenue": "₹3L/month",
                        "roi_percentage": 120,
                        "competition_level": "Medium",
                        "market_size": "Growing",
                        "key_success_factors": ["Local market knowledge", "Quality service delivery"]
                    }
                ],
                "location_data": {
                    "city": analysis_area.split(',')[0].strip(),
                    "currency_symbol": "₹"
                },
                "timestamp": datetime.now().isoformat(),
                "system_status": "Fallback mode - limited functionality"
            }
        
        # Save to database
        import json
        db_record = models.SearchHistory(
            user_email=request.user_email,
            area=analysis_area,
            analysis=json.dumps(result["analysis"]) if isinstance(result["analysis"], (dict, list)) else str(result["analysis"]),
            recommendations=json.dumps(result["recommendations"]) if isinstance(result["recommendations"], (dict, list)) else str(result["recommendations"])
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        print(f"💾 Saved to database with ID: {db_record.id}")
        
        return {
            "id": db_record.id,
            "area": db_record.area,
            "analysis": json.loads(db_record.analysis) if isinstance(db_record.analysis, str) else db_record.analysis,
            "recommendations": json.loads(db_record.recommendations) if isinstance(db_record.recommendations, str) else db_record.recommendations,
            "logs": {"reddit": [], "web": []},
            "cached": False,
            "system_status": result.get("system_status", "Live Data Processing Active (2026)"),
            "timestamp": result.get("timestamp"),
            "location_data": result.get("location_data", {}),
            "using_profile_location": bool(user_location and not request.area),
            "profile_location": user_location
        }
        
    except Exception as e:
        print(f"[ERROR] Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        
        # Return a simple fallback
        fallback_rec = {
            "title": f"Service Business in {request.area}",
            "description": f"Local service business opportunity in {request.area}",
            "profitability_score": 80,
            "funding_required": "₹5L-₹15L",
            "estimated_revenue": "₹25L/year",
            "estimated_profit": "₹15L/year",
            "roi_percentage": 120,
            "payback_period": "12 months",
            "market_size": "Medium",
            "competition_level": "Medium",
            "startup_difficulty": "Medium",
            "key_success_factors": ["Local knowledge", "Quality service"],
            "target_customers": "Local residents and businesses",
            "seasonal_impact": "Low",
            "scalability": "Medium",
            "business_model": "Service fees",
            "initial_team_size": "2-3 people",
            "six_month_plan": ["Setup", "Launch", "Grow"],
            "investment_breakdown": {"startup_costs": "Initial setup", "monthly_expenses": "Operations"}
        }
        
        print("🔄 Returning fallback recommendation")
        
        # Return 15 fallback recommendations for UI consistency
        fallback_recs = [fallback_rec.copy() for _ in range(15)]
        for i, fr in enumerate(fallback_recs):
            fr["title"] = f"{fr['title']} Type {i+1}"
            
        print(f"🔄 Returning {len(fallback_recs)} fallback recommendations")
        
        return {
            "id": 0,
            "area": request.area,
            "analysis": {
                "executive_summary": f"Standard market intelligence report for {request.area}.",
                "market_overview": "AI analysis in progress or system fallback mode.",
                "confidence_score": "70%",
                "market_gap_intensity": "Medium",
                "data_sources": ["System Fallback", "Regional Profiles"]
            },
            "recommendations": fallback_recs,
            "logs": {"reddit": [], "web": []}
        }

@app.get("/api/history/{email}")
def get_history(email: str, db: Session = Depends(get_db)):
    history = db.query(models.SearchHistory).filter(models.SearchHistory.user_email == email).order_by(models.SearchHistory.created_at.desc()).all()
    return history

@app.post("/api/business-plan")
def get_business_plan(request: BusinessPlanRequest, db: Session = Depends(get_db)):
    """Generate a detailed 6-month business plan for a specific business idea"""
    
    # Determine if this is an Indian location for currency formatting
    area_lower = request.area.lower()
    is_indian_city = 'india' in area_lower or any(city in area_lower for city in ['mumbai', 'delhi', 'bangalore', 'chennai', 'bhopal', 'berasia', 'pune', 'kolkata'])
    currency = "₹" if is_indian_city else "$"
    
    print(f"--- Generating business plan for: {request.title if hasattr(request, 'title') else request.business_title} in {request.area}")
    
    # Generate a comprehensive business plan using AI & Real-time data
    try:
        # Try to generate with AI first
        ai_plan = generate_ai_business_plan(request.business_title, request.area, request.language)
        
        if ai_plan:
            business_plan = ai_plan
        else:
            # Fallback to a better structured template if AI fails
            business_plan = {
                "business_overview": f"Strategic business plan for {request.business_title} in {request.area}.",
                "market_analysis": f"The {request.area} market shows specific gaps for {request.business_title}.",
                "success_score": 82,
                "risk_level": "Medium",
                "market_gap": "Medium",
                "financial_projections": {
                    "month_1": {"revenue": f"{currency}0", "expenses": f"{currency}50K", "profit": f"-{currency}50K"},
                    "month_2": {"revenue": f"{currency}25K", "expenses": f"{currency}40K", "profit": f"-{currency}15K"},
                    "month_3": {"revenue": f"{currency}80K", "expenses": f"{currency}40K", "profit": f"{currency}40K"},
                    "month_4": {"revenue": f"{currency}1.2L", "expenses": f"{currency}50K", "profit": f"{currency}70K"},
                    "month_5": {"revenue": f"{currency}1.5L", "expenses": f"{currency}55K", "profit": f"{currency}95K"},
                    "month_6": {"revenue": f"{currency}2.0L", "expenses": f"{currency}60K", "profit": f"{currency}1.4L"}
                },
                "marketing_strategy": "Local SEO and community outreach.",
                "operational_plan": "Lean startup model.",
                "risk_analysis": "Market competition and local regulations.",
                "monthly_milestones": ["Setup", "Launch", "Growth", "Scale", "Optimization", "Profitability"],
                "success_metrics": ["Customer Satisfaction", "ROI", "Growth Rate"],
                "resource_requirements": "Basic office/space and 2-3 staff.",
                "exit_strategy": "Franchising or strategic sale."
            }
        
        # Save to database
        db_plan = models.BusinessPlan(
            user_email=request.user_email.lower().strip(),
            business_title=request.business_title,
            area=request.area,
            plan_data=business_plan
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        
        print(f"[SUCCESS] Generated and saved business plan for {request.business_title}")
        return business_plan
        
    except Exception as e:
        print(f"[ERROR] Error generating business plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate business plan")

class RoadmapRequest(BaseModel):
    area: str
    title: str
    description: str
    user_email: str = "anonymous"
    language: str = "English"

@app.post("/api/roadmap")
def get_roadmap(request: RoadmapRequest, db: Session = Depends(get_db)):
    """Generate a strategic 6-month roadmap for a business opportunity"""
    
    # Determine if this is an Indian location for currency formatting
    area_lower = request.area.lower()
    is_indian_city = 'india' in area_lower or any(city in area_lower for city in ['mumbai', 'delhi', 'bangalore', 'chennai', 'bhopal', 'berasia', 'pune', 'kolkata'])
    currency = "₹" if is_indian_city else "$"
    
    print(f"--- Generating roadmap for: {request.title} in {request.area}")
    
    # Check if a roadmap already exists for this user/business to preserve state
    email = request.user_email.lower().strip()
    existing_roadmap = db.query(models.Roadmap).filter(
        func.lower(models.Roadmap.user_email) == email,
        models.Roadmap.title == request.title,
        models.Roadmap.area == request.area
    ).order_by(models.Roadmap.created_at.desc()).first()

    if existing_roadmap:
        print(f"--- Loading existing Roadmap state for {request.title}")
        return {**existing_roadmap.roadmap_data, "current_step": existing_roadmap.current_step}

    # Generate strategic roadmap using AI
    try:
        ai_roadmap_obj = generate_ai_roadmap(request.title, request.area, request.language)
        
        if ai_roadmap_obj and "steps" in ai_roadmap_obj:
            roadmap_steps = ai_roadmap_obj["steps"]
            timeline = ai_roadmap_obj.get("timeline", "6 Months Plan")
            team_needed = ai_roadmap_obj.get("team_needed", "Required Tools")
            execution_tips = ai_roadmap_obj.get("execution_tips", ["Automate core tasks", "Build local presence", "Launch quickly"])
        else:
            # Deeply dynamic fallback roadmap if AI intelligence layer timeouts
            roadmap_steps = [
                {
                    "step_number": 1,
                    "step_title": f"Validate {request.title} Demand",
                    "step_description": f"Conduct localized hyper-surveys and foot-traffic analysis across strategic zones in {request.area} to validate core assumptions."
                },
                {
                    "step_number": 2,
                    "step_title": f"Local Entity Registration",
                    "step_description": f"Navigate the specific regulatory environment of {request.area} to register the operational entity for {request.title}."
                },
                {
                    "step_number": 3,
                    "step_title": "Core Infrastructure Setup",
                    "step_description": f"Procure specialized equipment and establish the foundational supply-chain loops required to deploy {request.title}."
                },
                {
                    "step_number": 4,
                    "step_title": f"Hyper-Local Launch in {request.area}",
                    "step_description": f"Execute go-to-market strategy capturing the initial target demographic through offline guerrilla tactics and localized digital channels."
                },
                {
                    "step_number": 5,
                    "step_title": "Unit Economics Optimization",
                    "step_description": f"Refine the operational margins for {request.title} based on initial deployment telemetry and customer acquisition costs."
                }
            ]
            timeline = "6 Months Plan"
            team_needed = "Required Tools"
            execution_tips = ["Automate core tasks", "Build local presence", "Launch quickly"]
        
        roadmap_data = {
            "steps": roadmap_steps,
            "timeline": timeline,
            "area": request.area,
            "title": request.title,
            "description": request.description,
            "success_factors": execution_tips, # Backwards compatibility logic
            "team_needed": team_needed,
            "execution_tips": execution_tips
        }

        # Save to database
        db_roadmap = models.Roadmap(
            user_email=request.user_email.lower().strip(),
            title=request.title,
            area=request.area,
            roadmap_data=roadmap_data,
            current_step=0 # Initial step
        )
        db.add(db_roadmap)
        db.commit()
        db.refresh(db_roadmap)
        
        print(f"✅ Generated and saved roadmap for {request.title}")
        return {**roadmap_data, "current_step": 0}
        
    except Exception as e:
        import traceback
        with open("error.txt", "w") as f:
            f.write(traceback.format_exc())
        print(f"❌ Error generating roadmap: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/roadmap/step")
def update_roadmap_step(request: RoadmapStepUpdate, db: Session = Depends(get_db)):
    """Update the current active step for a user's roadmap"""
    email = request.user_email.lower().strip()
    db_roadmap = db.query(models.Roadmap).filter(
        func.lower(models.Roadmap.user_email) == email,
        models.Roadmap.title == request.title,
        models.Roadmap.area == request.area
    ).order_by(models.Roadmap.created_at.desc()).first()
    
    if not db_roadmap:
        raise HTTPException(status_code=404, detail="Tactical roadmap not found in persistent storage")
        
    db_roadmap.current_step = request.current_step
    db.commit()
    db.refresh(db_roadmap)
    
    print(f"✅ Synchronized progress for {request.title}: Step {request.current_step}")
    return {"current_step": db_roadmap.current_step, "status": "synchronized"}

@app.post("/api/roadmap/guide")
def get_roadmap_guide(request: RoadmapGuideRequest):
    """Generate comprehensive phase-aware implementation guide for a specific roadmap step"""
    
    print(f"--- Generating phase-aware strategic guide for: {request.step_title}")
    
    # Determine phase from step title or use discovery as default
    phase = "discovery"  # Default phase
    
    # Phase detection based on step title keywords
    step_lower = request.step_title.lower()
    if any(keyword in step_lower for keyword in ['research', 'analysis', 'identify', 'discover', 'explore']):
        phase = "discovery"
    elif any(keyword in step_lower for keyword in ['validate', 'test', 'feedback', 'interview', 'mvp']):
        phase = "validation"
    elif any(keyword in step_lower for keyword in ['plan', 'strategy', 'business model', 'financial', 'funding']):
        phase = "planning"
    elif any(keyword in step_lower for keyword in ['setup', 'infrastructure', 'team', 'hire', 'establish']):
        phase = "setup"
    elif any(keyword in step_lower for keyword in ['launch', 'marketing', 'customer', 'sales', 'go-to-market']):
        phase = "launch"
    elif any(keyword in step_lower for keyword in ['scale', 'grow', 'expand', 'optimize', 'improve']):
        phase = "growth"
    
    # Get phase from request if provided
    if hasattr(request, 'phase') and request.phase:
        phase = request.phase
    
    print(f"--- Detected phase: {phase} for step: {request.step_title}")
    
    try:
        # Use enhanced phase-aware implementation guide
        intelligence = get_intelligence()
        if intelligence:
            guide = intelligence.generate_implementation_guide(
                request.step_title, 
                request.step_description, 
                request.business_type, 
                request.location,
                phase
            )
        else:
            print("⚠️ Integrated intelligence not available, using fallback")
            # Import fallback function
            from simple_recommendations import generate_detailed_roadmap_step_guide
            guide = generate_detailed_roadmap_step_guide(
                request.step_title, 
                request.step_description, 
                request.business_type, 
                request.location
            )
        
        # Add metadata
        guide["generated_at"] = datetime.now().isoformat()
        guide["step_title"] = request.step_title
        guide["business_type"] = request.business_type
        guide["location"] = request.location
        guide["detected_phase"] = phase
        
        print(f"✅ Generated comprehensive {phase} phase guide with {len(guide.get('detailed_steps', []))} detailed steps")
        
        return guide
        
    except Exception as e:
        print(f"❌ Error generating implementation guide: {e}")
        import traceback
        traceback.print_exc()
        
        # Enhanced fallback
        return {
            "phase_info": {
                "current_phase": phase.title(),
                "phase_progress": "Unknown",
                "next_milestone": "Continue with next steps"
            },
            "objective": f"Execute {request.step_title} for {request.business_type} in {request.location}",
            "phase_specific_context": f"This step is important for {phase} phase success",
            "key_activities": [
                f"Plan and prepare for {request.step_title}",
                f"Execute core activities for {request.business_type}",
                f"Monitor progress and adjust strategy"
            ],
            "implementation_timeline": {
                "duration": "2-4 weeks",
                "milestones": ["Planning", "Execution", "Review"]
            },
            "detailed_steps": [
                {
                    "step_number": 1,
                    "title": "Planning and Preparation",
                    "description": f"Plan and prepare all necessary resources for {request.step_title}",
                    "duration": "1 week",
                    "resources_needed": ["Planning tools", "Team coordination", "Resource allocation"],
                    "success_criteria": "All preparations completed and team aligned"
                },
                {
                    "step_number": 2,
                    "title": "Execution and Implementation",
                    "description": f"Execute the main activities for {request.step_title}",
                    "duration": "1-2 weeks",
                    "resources_needed": ["Implementation tools", "Team effort", "Quality control"],
                    "success_criteria": "Core objectives achieved with quality standards"
                }
            ],
            "phase_metrics": ["Completion rate", "Quality score", "Timeline adherence"],
            "risk_mitigation": {
                "common_risks": ["Resource constraints", "Timeline delays", "Quality issues"],
                "mitigation_strategies": ["Proper planning", "Regular monitoring", "Quality checkpoints"]
            },
            "location_advantages": f"{request.location} provides local market knowledge and community support",
            "next_phase_preparation": "Prepare for next phase by documenting learnings and planning next steps",
            "pro_tips": f"Focus on {phase} phase objectives while maintaining quality and timeline adherence",
            "ai_generated": False,
            "fallback_quality": "Basic Fallback System",
            "error": str(e)
        }

@app.post("/api/subscriptions")
def create_subscription(subscription: SubscriptionCreate, db: Session = Depends(get_db)):
    """Create or update user subscription with enhanced error handling"""
    from sqlalchemy import func
    
    email_normalized = subscription.user_email.lower().strip()
    print(f"DEBUG: Creating subscription for {email_normalized} - Plan: {subscription.plan_name}")
    
    try:
        # Check if user already has an active subscription
        existing = db.query(models.UserSubscription).filter(
            func.lower(models.UserSubscription.user_email) == email_normalized,
            models.UserSubscription.status == "active"
        ).first()
        
        # Get User ID with better error handling
        user_rec = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        if not user_rec:
            print(f"DEBUG: User {email_normalized} not found, creating user record")
            # Create user if doesn't exist
            user_rec = models.User(
                email=email_normalized,
                name=email_normalized.split('@')[0],
                auth_provider="razorpay"
            )
            db.add(user_rec)
            db.commit()
            db.refresh(user_rec)
        
        u_id = user_rec.id

        if existing:
            # Update existing subscription instead of creating new
            existing.user_id = u_id
            existing.plan_name = subscription.plan_name
            existing.plan_display_name = subscription.plan_display_name
            existing.billing_cycle = subscription.billing_cycle
            existing.price = subscription.price
            existing.currency = subscription.currency
            existing.max_analyses = subscription.max_analyses
            existing.features = subscription.features
            existing.razorpay_subscription_id = subscription.razorpay_subscription_id
            existing.razorpay_customer_id = subscription.razorpay_customer_id
            
            # Extend/Refresh subscription end date
            existing.subscription_end = datetime.now() + (timedelta(days=365) if subscription.billing_cycle == "yearly" else timedelta(days=30))
            
            db.commit()
            db.refresh(existing)
            print(f"SUCCESS: Updated existing subscription ID: {existing.id}")
            return existing
        
        # Calculate subscription end date
        sub_end = datetime.now() + (timedelta(days=365) if subscription.billing_cycle == "yearly" else timedelta(days=30))

        # Create new subscription
        db_subscription = models.UserSubscription(
            user_id=u_id,
            user_email=email_normalized,
            plan_name=subscription.plan_name,
            plan_display_name=subscription.plan_display_name,
            billing_cycle=subscription.billing_cycle,
            price=subscription.price,
            currency=subscription.currency,
            max_analyses=subscription.max_analyses,
            features=subscription.features,
            subscription_end=sub_end,
            razorpay_subscription_id=subscription.razorpay_subscription_id,
            razorpay_customer_id=subscription.razorpay_customer_id
        )
        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)
        
        print(f"SUCCESS: Created subscription: {db_subscription.id} for {email_normalized}")
        
        return {
            "id": db_subscription.id,
            "user_id": db_subscription.user_id,
            "user_email": db_subscription.user_email,
            "plan_name": db_subscription.plan_name,
            "plan_display_name": db_subscription.plan_display_name,
            "status": db_subscription.status
        }
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to create/update subscription: {e}")
        import traceback
        traceback.print_exc()
        
        # Return more detailed error information
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Failed to create subscription",
                "message": str(e),
                "user_email": email_normalized,
                "plan_name": subscription.plan_name
            }
        )

@app.get("/api/system/location")
def get_system_location(request: Request):
    """Detect location from IP address"""
    try:
        # For development, we'll use a public API to get the IP's location
        # In production, this can use CloudFront-Viewer-City or GEOLITE
        import requests
        res = requests.get("https://ipapi.co/json/", timeout=5)
        if res.status_code == 200:
            data = res.json()
            return {
                "country": data.get("country_name", "Unknown"),
                "city": data.get("city", "Unknown"),
                "country_code": data.get("country_code", "XX"),
                "currency": data.get("currency", "$"),
                "ip": data.get("ip", "0.0.0.0")
            }
    except Exception as e:
        print(f"Location detection failed: {e}")
    
    # Fallback
    return {
        "country": "India",
        "city": "Unknown",
        "country_code": "IN",
        "currency": "INR",
        "ip": "0.0.0.0"
    }

@app.get("/api/subscriptions/{user_email}")
@app.get("/api/subscription/{user_email}") # Support both singular and plural
def get_user_subscription(user_email: str, db: Session = Depends(get_db)):
    """Get user's active subscription"""
    from sqlalchemy import func
    
    email_normalized = user_email.lower().strip()
    subscription = db.query(models.UserSubscription).filter(
        func.lower(models.UserSubscription.user_email) == email_normalized,
        models.UserSubscription.status == "active"
    ).first()
    
    if not subscription:
        # Check if user exists at all
        user_exists = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        if not user_exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return a "free" subscription structure as default instead of 404
        return {
            "id": 0,
            "user_email": email_normalized,
            "plan_name": "free",
            "plan_display_name": "Venture Strategist",
            "status": "active",
            "max_analyses": 5,
            "features": {}
        }
    
    # Return as dict to ensure serialization
    return {
        "id": subscription.id,
        "user_id": subscription.user_id,
        "user_email": subscription.user_email,
        "plan_name": subscription.plan_name,
        "plan_display_name": subscription.plan_display_name,
        "billing_cycle": subscription.billing_cycle,
        "price": float(subscription.price) if subscription.price else 0.0,
        "currency": subscription.currency,
        "status": subscription.status,
        "max_analyses": subscription.max_analyses,
        "features": subscription.features,
        "subscription_end": subscription.subscription_end.isoformat() if subscription.subscription_end else None
    }

@app.post("/api/payments")
def create_payment_record(payment: PaymentCreate, db: Session = Depends(get_db)):
    """Create payment record with enhanced error handling"""
    from sqlalchemy import func
    import traceback
    
    try:
        email_normalized = payment.user_email.lower().strip()
        print(f"DEBUG: Creating payment record for {email_normalized} - Amount: {payment.amount}")
        
        # Get User ID with better error handling
        try:
            user_rec = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
            if not user_rec:
                print(f"DEBUG: User {email_normalized} not found, creating user record")
                # Create user if doesn't exist
                user_rec = models.User(
                    email=email_normalized,
                    name=email_normalized.split('@')[0],
                    auth_provider="razorpay"
                )
                db.add(user_rec)
                db.commit()
                db.refresh(user_rec)
            
            u_id = user_rec.id
        except Exception as e:
            print(f"ERROR: Failed to get/create user: {e}")
            print(f"ERROR: Traceback: {traceback.format_exc()}")
            u_id = None

        try:
            # Check if payment already exists
            existing_payment = db.query(models.PaymentHistory).filter(
                models.PaymentHistory.razorpay_payment_id == payment.razorpay_payment_id
            ).first()
            
            if existing_payment:
                print(f"INFO: Payment {payment.razorpay_payment_id} already exists, returning existing")
                return existing_payment
            
            # Create new payment record
            db_payment = models.PaymentHistory(
                user_id=u_id,
                user_email=email_normalized,
                subscription_id=payment.subscription_id,
                amount=payment.amount,
                currency=payment.currency or "INR",
                razorpay_payment_id=payment.razorpay_payment_id,
                razorpay_order_id=payment.razorpay_order_id,
                status=payment.status,
                payment_method=payment.payment_method or "razorpay",
                plan_name=payment.plan_name,
                billing_cycle=payment.billing_cycle
            )
            db.add(db_payment)
            db.commit()
            db.refresh(db_payment)
            
            print(f"SUCCESS: Payment record created with ID: {db_payment.id}")
            return db_payment
            
        except Exception as e:
            db.rollback()
            error_msg = str(e).lower()
            print(f"ERROR: Failed to create payment record: {e}")
            print(f"ERROR: Traceback: {traceback.format_exc()}")
            
            # Check for duplicate key errors
            if any(term in error_msg for term in ["duplicate key", "unique constraint", "already exists"]):
                existing = db.query(models.PaymentHistory).filter(
                    models.PaymentHistory.razorpay_payment_id == payment.razorpay_payment_id
                ).first()
                if existing:
                    print(f"INFO: Returning existing payment record for {payment.razorpay_payment_id}")
                    return existing
            
            # Return a more detailed error
            raise HTTPException(
                status_code=500, 
                detail={
                    "error": "Failed to create payment record",
                    "message": str(e),
                    "payment_id": payment.razorpay_payment_id,
                    "user_email": email_normalized,
                    "traceback": traceback.format_exc()
                }
            )
    except Exception as e:
        print(f"CRITICAL ERROR in create_payment_record: {e}")
        print(f"CRITICAL ERROR Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Critical error in payment processing",
                "message": str(e),
                "traceback": traceback.format_exc()
            }
        )


@app.get("/api/payments/{user_email}")
def get_payment_history(user_email: str, limit: int = 50, db: Session = Depends(get_db)):
    """Get user's payment history"""
    from sqlalchemy import func
    
    email_normalized = user_email.lower().strip()
    payments = db.query(models.PaymentHistory).filter(
        func.lower(models.PaymentHistory.user_email) == email_normalized
    ).order_by(models.PaymentHistory.created_at.desc()).limit(limit).all()
    
    return payments


# Missing user profile and session endpoints
@app.get("/api/users/{email}")
def get_user_info(email: str, db: Session = Depends(get_db)):
    """Get user basic information"""
    from sqlalchemy import func

    email_normalized = email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "bio": user.bio,
        "phone": user.phone,
        "image_url": user.image_url,
        "company": user.company,
        "location": user.location,
        "website": user.website,
        "industry": user.industry,
        "auth_provider": user.auth_provider,
        "login_count": user.login_count,
        "last_login": user.last_login,
        "created_at": user.created_at
    }

@app.get("/payments/download-all-receipts")
def download_all_receipts(email: str, db: Session = Depends(get_db)):
    """Download all receipts for a user"""
    try:
        from sqlalchemy import func
        
        email_normalized = email.lower().strip()
        payments = db.query(models.PaymentHistory).filter(
            func.lower(models.PaymentHistory.user_email) == email_normalized,
            models.PaymentHistory.status == "success"
        ).order_by(models.PaymentHistory.created_at.desc()).all()
        
        if not payments:
            raise HTTPException(status_code=404, detail="No receipts found")
        
        # For now, return a simple response - in production you'd generate a ZIP file
        return {
            "message": f"Found {len(payments)} receipts",
            "receipts": [
                {
                    "id": p.razorpay_payment_id,
                    "amount": p.amount,
                    "date": p.created_at.isoformat(),
                    "plan": p.plan_name
                }
                for p in payments
            ]
        }
    except Exception as e:
        logger.error(f"Download receipts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/fix-payment-email/{current_email}")
def fix_payment_email(current_email: str, db: Session = Depends(get_db)):
    """Fix payment email mismatch by linking payments to current user email"""
    try:
        from sqlalchemy import func
        
        current_email_normalized = current_email.lower().strip()
        logger.info(f"🔧 Fixing payment email for: {current_email_normalized}")
        
        # Check if user exists
        user = db.query(models.User).filter(func.lower(models.User.email) == current_email_normalized).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's subscription to find the correct user_id
        subscription = db.query(models.UserSubscription).filter(
            func.lower(models.UserSubscription.user_email) == current_email_normalized,
            models.UserSubscription.status == "active"
        ).first()
        
        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")
        
        logger.info(f"🔧 Found subscription: {subscription.plan_name} for user_id: {subscription.user_id}")
        
        # Find payments for this user_id but with different email
        payments_to_fix = db.query(models.PaymentHistory).filter(
            models.PaymentHistory.user_id == subscription.user_id,
            func.lower(models.PaymentHistory.user_email) != current_email_normalized
        ).all()
        
        logger.info(f"🔧 Found {len(payments_to_fix)} payments to fix")
        
        # Update payment emails to match current email
        fixed_count = 0
        for payment in payments_to_fix:
            old_email = payment.user_email
            payment.user_email = current_email_normalized
            fixed_count += 1
            logger.info(f"🔧 Fixed payment {payment.id}: {old_email} -> {current_email_normalized}")
        
        db.commit()
        
        return {
            "message": f"Fixed {fixed_count} payment records",
            "fixed_payments": fixed_count,
            "current_email": current_email_normalized,
            "user_id": subscription.user_id
        }
        
    except Exception as e:
        logger.error(f"Fix payment email error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/payments/search/{partial_email}")
def search_payments_by_email(partial_email: str, db: Session = Depends(get_db)):
    """Search payments by partial email match"""
    try:
        from sqlalchemy import func
        
        # Search for emails that contain the partial email
        payments = db.query(models.PaymentHistory).filter(
            func.lower(models.PaymentHistory.user_email).contains(partial_email.lower())
        ).order_by(models.PaymentHistory.created_at.desc()).limit(10).all()
        
        return {
            "search_term": partial_email,
            "payments_found": len(payments),
            "payments": [
                {
                    "id": p.id,
                    "user_email": p.user_email,
                    "amount": p.amount,
                    "currency": p.currency,
                    "status": p.status,
                    "plan_name": p.plan_name,
                    "billing_cycle": p.billing_cycle,
                    "payment_date": p.created_at.isoformat() if p.created_at else None,
                    "razorpay_payment_id": p.razorpay_payment_id,
                    "payment_method": p.payment_method
                } for p in payments
            ]
        }
    except Exception as e:
        logger.error(f"Search payments error: {e}")
        return {"error": str(e)}


@app.post("/api/payment-webhook")
async def payment_webhook(request: Request):
    """Webhook endpoint for real-time payment notifications"""
    try:
        body = await request.json()
        logger.info(f"🔔 Payment webhook received: {body}")
        
        # Extract payment information
        payment_id = body.get('razorpay_payment_id')
        order_id = body.get('razorpay_order_id')
        signature = body.get('razorpay_signature')
        user_email = body.get('user_email')
        amount = body.get('amount')
        plan_name = body.get('plan_name')
        billing_cycle = body.get('billing_cycle', 'yearly')
        
        if not all([payment_id, user_email, amount, plan_name]):
            return {"status": "error", "message": "Missing required fields"}
        
        # Process payment immediately
        db = next(get_db())
        try:
            # Create payment record
            payment_data = PaymentCreate(
                user_email=user_email,
                amount=float(amount),
                razorpay_payment_id=payment_id,
                razorpay_order_id=order_id or f"order_{payment_id}",
                razorpay_signature=signature,
                status="success",
                plan_name=plan_name,
                billing_cycle=billing_cycle,
                payment_method="razorpay"
            )
            
            payment_record = create_payment_record(payment_data, db)
            
            # Create/update subscription immediately
            subscription_data = SubscriptionCreate(
                user_email=user_email,
                plan_name=plan_name.lower(),
                plan_display_name=plan_name,
                billing_cycle=billing_cycle,
                price=float(amount),
                currency="INR",
                max_analyses=-1 if plan_name.lower() in ['professional', 'enterprise', 'territorial dominance', 'growth architect'] else 5,
                features={}
            )
            
            subscription_record = create_subscription(subscription_data, db)
            
            logger.info(f"✅ Payment processed successfully: {payment_id}")
            
            return {
                "status": "success",
                "message": "Payment processed successfully",
                "payment_id": payment_id,
                "subscription_id": subscription_record.get('id') if isinstance(subscription_record, dict) else subscription_record.id,
                "timestamp": datetime.now().isoformat()
            }
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"Payment webhook error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/process-payment")
async def process_payment_immediately(request: Request, db: Session = Depends(get_db)):
    """Process payment immediately after successful Razorpay transaction"""
    try:
        body = await request.json()
        logger.info(f"🔔 Processing immediate payment: {body}")
        
        user_email = body.get('user_email')
        payment_id = body.get('razorpay_payment_id')
        order_id = body.get('razorpay_order_id')
        amount = body.get('amount')
        plan_name = body.get('plan_name')
        billing_cycle = body.get('billing_cycle', 'yearly')
        
        if not all([user_email, payment_id, amount, plan_name]):
            raise HTTPException(status_code=400, detail="Missing required payment information")
        
        # Create payment record immediately
        payment_data = PaymentCreate(
            user_email=user_email,
            amount=float(amount),
            razorpay_payment_id=payment_id,
            razorpay_order_id=order_id or f"order_{payment_id}",
            status="success",
            plan_name=plan_name,
            billing_cycle=billing_cycle,
            payment_method="razorpay"
        )
        
        payment_record = create_payment_record(payment_data, db)
        
        # Map plan names for subscription
        plan_mapping = {
            'territorial dominance': 'enterprise',
            'growth architect': 'professional',
            'growth accelerator': 'professional',
            'market dominator': 'enterprise',
            'venture strategist': 'free',
            'professional': 'professional',
            'enterprise': 'enterprise'
        }
        
        mapped_plan = plan_mapping.get(plan_name.lower(), plan_name.lower())
        
        # Create/update subscription immediately
        subscription_data = SubscriptionCreate(
            user_email=user_email,
            plan_name=mapped_plan,
            plan_display_name=plan_name,
            billing_cycle=billing_cycle,
            price=float(amount),
            currency="INR",
            max_analyses=-1 if mapped_plan in ['professional', 'enterprise'] else 5,
            features={}
        )
        
        subscription_record = create_subscription(subscription_data, db)
        
        logger.info(f"✅ Payment and subscription processed: {payment_id} -> {mapped_plan}")
        
        return {
            "status": "success",
            "message": "Payment processed successfully",
            "payment_id": payment_id,
            "plan_name": mapped_plan,
            "plan_display_name": plan_name,
            "subscription_active": True,
            "max_analyses": -1 if mapped_plan in ['professional', 'enterprise'] else 5,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Process payment error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process payment: {str(e)}")

@app.get("/api/users/{email}/profile")
def get_user_profile(email: str, db: Session = Depends(get_db)):
    """Get user profile information - REAL DATA ONLY"""
    from sqlalchemy import func
    from datetime import datetime, timedelta

    email_normalized = email.lower().strip()
    logger.info(f"🔍 Profile request for: {email_normalized}")

    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()

    if not user:
        logger.error(f"🔍 User not found: {email_normalized}")
        raise HTTPException(status_code=404, detail="User not found")

    # Get user statistics
    search_count = db.query(models.SearchHistory).filter(
        func.lower(models.SearchHistory.user_email) == email_normalized
    ).count()

    # Get subscription info
    subscription = db.query(models.UserSubscription).filter(
        func.lower(models.UserSubscription.user_email) == email_normalized,
        models.UserSubscription.status == "active"
    ).first()

    # Get real payment history only - no auto-creation
    recent_payments = db.query(models.PaymentHistory).filter(
        func.lower(models.PaymentHistory.user_email) == email_normalized
    ).order_by(models.PaymentHistory.created_at.desc()).limit(10).all()

    logger.info(f"🔍 Found {len(recent_payments)} real payments for {email_normalized}")

    # FIX: If user has payments but no subscription, create subscription from latest payment
    if recent_payments and not subscription:
        latest_payment = recent_payments[0]
        logger.info(f"🔧 Creating subscription from payment: {latest_payment.plan_name}")
        
        try:
            # Enhanced plan mapping to handle all variations
            plan_mapping = {
                'professional': 'professional',
                'pro': 'professional',
                'growth accelerator': 'professional',
                'growth architect': 'professional',
                'enterprise': 'enterprise',
                'territorial dominance': 'enterprise',
                'market dominator': 'enterprise',
                'free': 'free',
                'starter': 'free',
                'venture strategist': 'free'
            }
            
            # Check both plan_name and any display name variations
            payment_plan_lower = latest_payment.plan_name.lower()
            mapped_plan = plan_mapping.get(payment_plan_lower, 'professional')  # Default to professional if not found
            
            # Special handling for common payment plan names
            if 'territorial' in payment_plan_lower or 'dominance' in payment_plan_lower:
                mapped_plan = 'enterprise'
            elif 'growth' in payment_plan_lower or 'architect' in payment_plan_lower or 'accelerator' in payment_plan_lower:
                mapped_plan = 'professional'
            elif 'pro' in payment_plan_lower and payment_plan_lower != 'professional':
                mapped_plan = 'professional'
            
            logger.info(f"🔧 Mapping payment plan '{latest_payment.plan_name}' to subscription plan '{mapped_plan}'")
            
            # Create subscription record
            new_subscription = models.UserSubscription(
                user_id=user.id,
                user_email=email_normalized,
                plan_name=mapped_plan,
                plan_display_name=latest_payment.plan_name,
                billing_cycle=latest_payment.billing_cycle or 'yearly',
                price=latest_payment.amount,
                currency=latest_payment.currency or 'INR',
                max_analyses=-1 if mapped_plan in ['professional', 'enterprise'] else 5,
                features={},
                subscription_end=datetime.now() + timedelta(days=365),
                status='active'
            )
            
            db.add(new_subscription)
            db.commit()
            db.refresh(new_subscription)
            
            subscription = new_subscription
            logger.info(f"✅ Created subscription: {subscription.plan_name} (display: {subscription.plan_display_name}) for {email_normalized}")
            
        except Exception as e:
            logger.error(f"Failed to create subscription from payment: {e}")
            db.rollback()

    # FIX: If subscription exists but has wrong plan name, update it based on payments
    elif subscription and recent_payments:
        latest_payment = recent_payments[0]
        
        # Enhanced plan mapping with all possible variations
        plan_mapping = {
            'professional': 'professional',
            'pro': 'professional',
            'growth accelerator': 'professional',
            'growth architect': 'professional',
            'enterprise': 'enterprise',
            'territorial dominance': 'enterprise',
            'market dominator': 'enterprise',
            'free': 'free',
            'starter': 'free',
            'venture strategist': 'free'
        }
        
        # Check both plan_name and any display name variations
        payment_plan_lower = latest_payment.plan_name.lower()
        expected_plan = plan_mapping.get(payment_plan_lower, 'professional')  # Default to professional if not found
        
        # Special handling for common payment plan names
        if 'territorial' in payment_plan_lower or 'dominance' in payment_plan_lower:
            expected_plan = 'enterprise'
        elif 'growth' in payment_plan_lower or 'architect' in payment_plan_lower or 'accelerator' in payment_plan_lower:
            expected_plan = 'professional'
        elif 'pro' in payment_plan_lower and payment_plan_lower != 'professional':
            expected_plan = 'professional'
        
        if subscription.plan_name != expected_plan:
            logger.info(f"🔧 Updating subscription plan from {subscription.plan_name} to {expected_plan} based on payment: {latest_payment.plan_name}")
            
            try:
                subscription.plan_name = expected_plan
                subscription.plan_display_name = latest_payment.plan_name
                subscription.price = latest_payment.amount
                subscription.max_analyses = -1 if expected_plan in ['professional', 'enterprise'] else 5
                
                db.commit()
                db.refresh(subscription)
                
                logger.info(f"✅ Updated subscription plan to {expected_plan}")
                
            except Exception as e:
                logger.error(f"Failed to update subscription: {e}")
                db.rollback()

    return {
        "user": user,
        "analysis_count": search_count,
        "subscription": subscription,
        "recent_payments": [
            {
                "id": payment.id,
                "amount": payment.amount,
                "currency": payment.currency or "INR",
                "razorpay_payment_id": payment.razorpay_payment_id,
                "status": payment.status,
                "plan_name": payment.plan_name,
                "billing_cycle": payment.billing_cycle,
                "payment_date": payment.created_at,
                "payment_method": payment.payment_method
            }
            for payment in recent_payments
        ]
    }


@app.get("/api/debug-user-data/{email}")
def debug_user_data(email: str, db: Session = Depends(get_db)):
    """Debug endpoint to see user's complete data"""
    from sqlalchemy import func
    
    email_normalized = email.lower().strip()
    
    try:
        # Get user
        user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        
        # Get subscription
        subscription = db.query(models.UserSubscription).filter(
            func.lower(models.UserSubscription.user_email) == email_normalized,
            models.UserSubscription.status == "active"
        ).first()
        
        # Get payments
        payments = db.query(models.PaymentHistory).filter(
            func.lower(models.PaymentHistory.user_email) == email_normalized
        ).order_by(models.PaymentHistory.created_at.desc()).limit(5).all()
        
        return {
            "user": {
                "id": user.id if user else None,
                "email": user.email if user else None,
                "name": user.name if user else None
            } if user else None,
            "subscription": {
                "id": subscription.id if subscription else None,
                "plan_name": subscription.plan_name if subscription else None,
                "plan_display_name": subscription.plan_display_name if subscription else None,
                "status": subscription.status if subscription else None,
                "max_analyses": subscription.max_analyses if subscription else None,
                "price": subscription.price if subscription else None
            } if subscription else None,
            "payments": [
                {
                    "id": p.id,
                    "amount": p.amount,
                    "plan_name": p.plan_name,
                    "status": p.status,
                    "payment_date": p.created_at.isoformat(),
                    "razorpay_payment_id": p.razorpay_payment_id
                }
                for p in payments
            ],
            "debug_info": {
                "email_normalized": email_normalized,
                "user_exists": bool(user),
                "subscription_exists": bool(subscription),
                "payments_count": len(payments)
            }
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/refresh-user-plan/{email}")
def refresh_user_plan(email: str, db: Session = Depends(get_db)):
    """Force refresh user's plan based on their latest payment and subscription data"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    email_normalized = email.lower().strip()
    logger.info(f"🔄 Force refreshing plan for: {email_normalized}")
    
    try:
        # Get user
        user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get latest payment
        latest_payment = db.query(models.PaymentHistory).filter(
            func.lower(models.PaymentHistory.user_email) == email_normalized
        ).order_by(models.PaymentHistory.created_at.desc()).first()
        
        # Get current subscription
        subscription = db.query(models.UserSubscription).filter(
            func.lower(models.UserSubscription.user_email) == email_normalized,
            models.UserSubscription.status == "active"
        ).first()
        
        # Enhanced plan mapping with fuzzy matching
        plan_mapping = {
            'professional': 'professional',
            'pro': 'professional',
            'growth accelerator': 'professional',
            'growth architect': 'professional',
            'enterprise': 'enterprise',
            'territorial dominance': 'enterprise',
            'market dominator': 'enterprise',
            'free': 'free',
            'starter': 'free',
            'venture strategist': 'free'
        }
        
        if latest_payment:
            # Determine correct plan from payment with fuzzy matching
            payment_plan_lower = latest_payment.plan_name.lower()
            payment_plan = plan_mapping.get(payment_plan_lower, 'professional')  # Default to professional
            
            # Special handling for common payment plan names
            if 'territorial' in payment_plan_lower or 'dominance' in payment_plan_lower:
                payment_plan = 'enterprise'
            elif 'growth' in payment_plan_lower or 'architect' in payment_plan_lower or 'accelerator' in payment_plan_lower:
                payment_plan = 'professional'
            elif 'pro' in payment_plan_lower and payment_plan_lower != 'professional':
                payment_plan = 'professional'
            
            logger.info(f"🔧 Mapping payment plan '{latest_payment.plan_name}' to '{payment_plan}'")
            
            if subscription:
                # Update existing subscription
                subscription.plan_name = payment_plan
                subscription.plan_display_name = latest_payment.plan_name
                subscription.price = latest_payment.amount
                subscription.currency = latest_payment.currency or 'INR'
                subscription.billing_cycle = latest_payment.billing_cycle or 'yearly'
                subscription.max_analyses = -1 if payment_plan in ['professional', 'enterprise'] else 5
                subscription.subscription_end = datetime.now() + timedelta(days=365)
                
                db.commit()
                db.refresh(subscription)
                
                logger.info(f"✅ Updated subscription plan to: {payment_plan}")
                
            else:
                # Create new subscription
                new_subscription = models.UserSubscription(
                    user_id=user.id,
                    user_email=email_normalized,
                    plan_name=payment_plan,
                    plan_display_name=latest_payment.plan_name,
                    billing_cycle=latest_payment.billing_cycle or 'yearly',
                    price=latest_payment.amount,
                    currency=latest_payment.currency or 'INR',
                    max_analyses=-1 if payment_plan in ['professional', 'enterprise'] else 5,
                    features={},
                    subscription_end=datetime.now() + timedelta(days=365),
                    status='active'
                )
                
                db.add(new_subscription)
                db.commit()
                db.refresh(new_subscription)
                
                subscription = new_subscription
                logger.info(f"✅ Created new subscription with plan: {payment_plan}")
        
        return {
            "status": "success",
            "message": f"Plan refreshed for {email_normalized}",
            "user_email": email_normalized,
            "current_plan": subscription.plan_name if subscription else 'free',
            "plan_display_name": subscription.plan_display_name if subscription else 'Free',
            "max_analyses": subscription.max_analyses if subscription else 5,
            "has_payment": bool(latest_payment),
            "payment_amount": latest_payment.amount if latest_payment else 0,
            "payment_plan_name": latest_payment.plan_name if latest_payment else None
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to refresh user plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh plan: {str(e)}")

@app.post("/api/fix-subscription/{email}")
def fix_user_subscription(email: str, db: Session = Depends(get_db)):
    """Fix user subscription based on their payment history"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    email_normalized = email.lower().strip()
    logger.info(f"🔧 Fixing subscription for: {email_normalized}")
    
    # Get user
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get latest payment
    latest_payment = db.query(models.PaymentHistory).filter(
        func.lower(models.PaymentHistory.user_email) == email_normalized
    ).order_by(models.PaymentHistory.created_at.desc()).first()
    
    if not latest_payment:
        raise HTTPException(status_code=404, detail="No payment history found")
    
    # Get existing subscription
    subscription = db.query(models.UserSubscription).filter(
        func.lower(models.UserSubscription.user_email) == email_normalized,
        models.UserSubscription.status == "active"
    ).first()
    
    # Enhanced plan mapping with all possible variations
    plan_mapping = {
        'professional': 'professional',
        'pro': 'professional',
        'growth accelerator': 'professional',
        'growth architect': 'professional',
        'enterprise': 'enterprise',
        'territorial dominance': 'enterprise',
        'market dominator': 'enterprise',
        'free': 'free',
        'starter': 'free',
        'venture strategist': 'free'
    }
    
    mapped_plan = plan_mapping.get(latest_payment.plan_name.lower(), 'free')
    
    try:
        if subscription:
            # Update existing subscription
            subscription.plan_name = mapped_plan
            subscription.plan_display_name = latest_payment.plan_name
            subscription.price = latest_payment.amount
            subscription.currency = latest_payment.currency or 'INR'
            subscription.billing_cycle = latest_payment.billing_cycle or 'yearly'
            subscription.max_analyses = -1 if mapped_plan in ['professional', 'enterprise'] else 5
            subscription.subscription_end = datetime.now() + timedelta(days=365)
            
            db.commit()
            db.refresh(subscription)
            
            logger.info(f"✅ Updated subscription: {subscription.plan_name}")
            
        else:
            # Create new subscription
            new_subscription = models.UserSubscription(
                user_id=user.id,
                user_email=email_normalized,
                plan_name=mapped_plan,
                plan_display_name=latest_payment.plan_name,
                billing_cycle=latest_payment.billing_cycle or 'yearly',
                price=latest_payment.amount,
                currency=latest_payment.currency or 'INR',
                max_analyses=-1 if mapped_plan in ['professional', 'enterprise'] else 5,
                features={},
                subscription_end=datetime.now() + timedelta(days=365),
                status='active'
            )
            
            db.add(new_subscription)
            db.commit()
            db.refresh(new_subscription)
            
            subscription = new_subscription
            logger.info(f"✅ Created subscription: {subscription.plan_name}")
        
        return {
            "status": "success",
            "message": f"Subscription fixed for {email_normalized}",
            "subscription": {
                "plan_name": subscription.plan_name,
                "plan_display_name": subscription.plan_display_name,
                "price": subscription.price,
                "currency": subscription.currency,
                "max_analyses": subscription.max_analyses
            }
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to fix subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fix subscription: {str(e)}")

@app.get("/api/users/{email}/sessions")
def get_user_sessions(email: str, limit: int = 10, db: Session = Depends(get_db)):
    """Get user login sessions"""
    from sqlalchemy import func

    email_normalized = email.lower().strip()

    try:
        sessions = db.query(models.UserSession).filter(
            func.lower(models.UserSession.user_email) == email_normalized
        ).order_by(models.UserSession.session_start.desc()).limit(limit).all()

        return [
            {
                "id": session.id,
                "session_token": session.session_token[:8] + "..." if session.session_token else "unknown",
                "provider": session.provider,
                "ip_address": session.ip_address,
                "user_agent": session.user_agent,
                "device_info": session.device_info,
                "location_info": session.location_info,
                "login_method": session.login_method,
                "session_start": session.session_start,
                "session_end": session.session_end,
                "is_active": session.is_active
            }
            for session in sessions
        ]
    except Exception as e:
        print(f"Failed to fetch sessions (table might not exist): {e}")
        # Return empty list if sessions table doesn't exist
        return []


# Add missing PUT endpoint for user updates
class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    image_url: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None

@app.put("/api/users/{email}")
def update_user_profile(email: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    """Update user profile information"""
    from sqlalchemy import func
    
    email_normalized = email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields if provided
    if user_update.name is not None:
        user.name = user_update.name.strip()
    if user_update.image_url is not None:
        user.image_url = user_update.image_url
    if user_update.bio is not None:
        user.bio = user_update.bio.strip()
    if user_update.phone is not None:
        user.phone = user_update.phone.strip()
    if user_update.company is not None:
        user.company = user_update.company.strip()
    if user_update.location is not None:
        user.location = user_update.location.strip()
    if user_update.website is not None:
        user.website = user_update.website.strip()
    if user_update.industry is not None:
        user.industry = user_update.industry.strip()
    
    try:
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "bio": user.bio,
            "phone": user.phone,
            "image_url": user.image_url,
            "company": user.company,
            "location": user.location,
            "website": user.website,
            "industry": user.industry,
            "auth_provider": user.auth_provider,
            "login_count": user.login_count,
            "last_login": user.last_login,
            "created_at": user.created_at,
            "message": "Profile updated successfully"
        }
    except Exception as e:
        db.rollback()
        print(f"Failed to update user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

# Add Vercel handler at the end of the file
handler = app

@app.get("/api/users/{email}/location")
def get_user_location(email: str, db: Session = Depends(get_db)):
    """Get user's saved location from profile"""
    from sqlalchemy import func
    
    email_normalized = email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "location": user.location,
        "has_location": bool(user.location)
    }

@app.put("/api/users/{email}/location")
def update_user_location(email: str, location_data: dict, db: Session = Depends(get_db)):
    """Update user's saved location in profile"""
    from sqlalchemy import func
    
    email_normalized = email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.location = location_data.get("location", "").strip()
    db.commit()
    db.refresh(user)
    
    return {
        "status": "success",
        "message": "Location updated successfully",
        "location": user.location
    }


# Vercel handler
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)