from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timedelta
import bcrypt
import os
import logging
import traceback
import json
from typing import Dict, List, Any, Optional

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

# Import integrated intelligence with error handling
try:
    from integrated_business_intelligence import integrated_intelligence
    logger.info("✅ Integrated business intelligence imported successfully")
except ImportError as e:
    logger.error(f"⚠️ Integrated business intelligence import failed: {e}")
    integrated_intelligence = None
except Exception as e:
    logger.error(f"⚠️ Unexpected error importing integrated business intelligence: {e}")
    integrated_intelligence = None

from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI app without lifespan for Vercel compatibility
app = FastAPI(title="TrendAI Business Intelligence API", version="2.0")

# No additional database initialization here since it's done above

# CORS configuration
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# Add wildcard for Vercel domains in production
if os.getenv("VERCEL_ENV"):  # Running on Vercel
    allowed_origins.extend([
        "https://*.vercel.app",
        "https://trend-ai-main.vercel.app",  # Your specific domain
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if not os.getenv("VERCEL_ENV") else ["*"],  # Allow all origins on Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        return get_db()
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
                "integrated_intelligence": "available" if integrated_intelligence else "unavailable"
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
                "integrated_intelligence": "ok" if integrated_intelligence else "error"
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

# Authentication endpoints
@app.get("/api/auth/test")
def test_auth():
    """Test endpoint to verify auth endpoints are working"""
    return {"status": "ok", "message": "Auth endpoints are working"}

@app.get("/test")
def test_endpoint():
    return {
        "test": "success",
        "message": "API is working correctly",
        "timestamp": datetime.now().isoformat(),
        "all_systems": {
            "database": db_available,
            "models": models_available,
            "recommendations": recommendations_available,
            "integrated_intelligence": integrated_intelligence is not None
        }
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
    password_hash = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
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
    if not bcrypt.checkpw(user_data.password.encode('utf-8'), db_user.password_hash.encode('utf-8')):
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
        if integrated_intelligence:
            try:
                result = integrated_intelligence.generate_data_driven_recommendations(analysis_area, request.user_email, request.language, request.phase)
                print(f"[SUCCESS] Generated {len(result['recommendations'])} real-time recommendations")
            except Exception as e:
                logger.error(f"Integrated intelligence failed: {e}")
                result = None
        else:
            result = None
            
        if not result and recommendations_available:
            try:
                print("⚠️ Integrated intelligence not available, using fallback")
                # Import fallback function
                from simple_recommendations import generate_dynamic_recommendations
                result = generate_dynamic_recommendations(analysis_area, request.user_email, request.language)
                print(f"[FALLBACK] Generated {len(result['recommendations'])} fallback recommendations")
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
        if integrated_intelligence:
            guide = integrated_intelligence.generate_implementation_guide(
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
    """Create or update user subscription"""
    from sqlalchemy import func
    
    email_normalized = subscription.user_email.lower().strip()
    print(f"DEBUG: Creating subscription for {email_normalized} - Plan: {subscription.plan_name}")
    
    # Check if user already has an active subscription
    existing = db.query(models.UserSubscription).filter(
        func.lower(models.UserSubscription.user_email) == email_normalized,
        models.UserSubscription.status == "active"
    ).first()
    
    # Get User ID
    user_rec = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    if not user_rec:
        print(f"DEBUG: User {email_normalized} not found during subscription creation")
    u_id = user_rec.id if user_rec else None

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
        return existing
    
    # Calculate subscription end date
    sub_end = datetime.now() + (timedelta(days=365) if subscription.billing_cycle == "yearly" else timedelta(days=30))

    try:
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
        
        print(f"[SUCCESS] Created subscription: {db_subscription.id} for {email_normalized}")
        
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
        print(f"[ERROR] ERROR in create_subscription: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

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
    """Create payment record"""
    email_normalized = payment.user_email.lower().strip()
    print(f"DEBUG: Creating payment record for {email_normalized} - Amount: {payment.amount} {payment.currency}")
    
    # Get User ID
    user_rec = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    if not user_rec:
        print(f"DEBUG: User {email_normalized} not found during payment creation")
    u_id = user_rec.id if user_rec else None

    try:
        db_payment = models.PaymentHistory(
            user_id=u_id,
            user_email=payment.user_email.lower().strip(),
            subscription_id=payment.subscription_id,
            amount=payment.amount,
            currency=payment.currency,
            razorpay_payment_id=payment.razorpay_payment_id,
            razorpay_order_id=payment.razorpay_order_id,
            status=payment.status,
            payment_method=payment.payment_method,
            plan_name=payment.plan_name,
            billing_cycle=payment.billing_cycle
        )
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        return db_payment
    except Exception as e:
        db.rollback()
        error_msg = str(e).lower()
        print(f"[ERROR] Failed to create payment record: {e}")
        
        # More robust check for unique constraint violations (IntegrityError)
        if any(term in error_msg for term in ["duplicate key", "unique constraint", "already exists"]):
            # Try to find exactly what was unique (the payment id)
            existing = db.query(models.PaymentHistory).filter(models.PaymentHistory.razorpay_payment_id == payment.razorpay_payment_id).first()
            if existing:
                print(f"[INFO] Payment record {payment.razorpay_payment_id} already exists, returning existing.")
                return existing
        
        raise HTTPException(status_code=500, detail=f"Failed to create payment record: {str(e)}")


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

@app.get("/api/users/{email}/profile")
def get_user_profile(email: str, db: Session = Depends(get_db)):
    """Get user profile information"""
    from sqlalchemy import func

    email_normalized = email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()

    if not user:
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
    
    # Get recent payments
    recent_payments = db.query(models.PaymentHistory).filter(
        func.lower(models.PaymentHistory.user_email) == email_normalized
    ).order_by(models.PaymentHistory.created_at.desc()).limit(10).all()

    return {
        "user": user,
        "analysis_count": search_count,
        "subscription": subscription,
        "recent_payments": [
            {
                "id": payment.id,
                "amount": payment.amount,
                "currency": "INR",
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
        "email": user.email,
        "location": user.location,
        "has_location": bool(user.location)
    }

@app.put("/api/users/{email}/location")
def update_user_location(email: str, location_data: dict, db: Session = Depends(get_db)):
    """Update user's location in profile"""
    from sqlalchemy import func
    
    email_normalized = email.lower().strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update location
    user.location = location_data.get("location", "").strip()
    user.updated_at = func.now()
    
    db.commit()
    db.refresh(user)
    
    return {
        "status": "success",
        "message": "Location updated successfully",
        "location": user.location
    }