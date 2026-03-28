from fastapi import FastAPI, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timedelta
from passlib.context import CryptContext
# Migration to PBKDF2 to natively support long passwords without 72-byte bcrypt limit
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "bcrypt"], 
    deprecated="auto",
    bcrypt__truncate_error=False
)
import os
import asyncio
import time
import urllib.parse
from dotenv import load_dotenv
load_dotenv()
import logging
import traceback
import hashlib
import json
from typing import Dict, List, Any, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import httpx
from dodopayments import DodoPayments

# ═══════════════════════════════════════════════════
# WEBSOCKET MANAGER (Real-Time Insight Streaming)
# ═══════════════════════════════════════════════════
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Link the intelligence engine's push stream to the FastAPI connection manager
from integrated_business_intelligence import register_ws_pusher
register_ws_pusher(manager.broadcast)


class OverpassQuery(BaseModel):
    query: str

class ScrapeRequest(BaseModel):
    query: str
    location: str
    max_results: int = 50
    email: Optional[str] = None

class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str
    profile_context: Optional[Dict[str, Any]] = None
try:
    from standardwebhooks import Webhook
except ImportError:
    Webhook = None


# Initialize FastAPI app
app = FastAPI(title="StarterScope Business Intelligence API", version="2.2")

# Combined CORS Configuration for Local & Production
ALLOWED_ORIGINS = [
    "*",
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
    "http://localhost:3002", "http://127.0.0.1:3002",
    "http://localhost:3003", "http://127.0.0.1:3003",
    "http://localhost:3004", "http://127.0.0.1:3004",
    "http://localhost:8000", "http://127.0.0.1:8000",
    "https://starterscope.entrext.com",
    "https://trend-ai-main.vercel.app",
    "https://trend-ai-sand.vercel.app"
]
# Dynamic additions from env
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    ALLOWED_ORIGINS.extend([o.strip() for o in env_origins.split(",") if o.strip()])
if os.getenv("VERCEL_URL"):
    ALLOWED_ORIGINS.append(f"https://{os.getenv('VERCEL_URL')}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?|https://.*\.(vercel\.app|entrext\.com))$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-rtb-fingerprint-id", "Content-Type", "Authorization"],
)

@app.websocket("/ws/analysis")
async def websocket_analysis_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)

# Simple Origin Logger for CORS Debugging
@app.middleware("http")
async def log_origin(request: Request, call_next):
    origin = request.headers.get("origin")
    if origin:
        logger.info(f"Incoming Request Origin: {origin}")
    response = await call_next(request)
    return response

# Consolidated Health Check
@app.post("/api/generate-roadmap")
async def api_generate_roadmap(request: Dict[str, str]):
    title = request.get("title")
    area = request.get("area")
    if not title or not area:
        return {"error": "Missing title or area"}
    from simple_recommendations import generate_ai_roadmap
    return await asyncio.to_thread(generate_ai_roadmap, title, area)

@app.get("/")
@app.get("/api/health")
@app.get("/api/v1/health")
@app.post("/api/health")
def system_health_check():
    return {
        "status": "online",
        "message": "StarterScope API Active",
        "version": "2.2",
        "timestamp": str(datetime.now())
    }

# ═══════════════════════════════════════════════════
# CONTACT & SUPPORT SYSTEM
# ═══════════════════════════════════════════════════
def send_support_email(host, port, user, password, recipient, subject, html_content, sender_name):
    """Sends support email in background thread with advanced resilience."""
    try:
        msg = MIMEMultipart()
        msg["From"] = str(user)
        msg["To"] = str(recipient)
        msg["Subject"] = f"StarterScope: {subject} (from {sender_name})"
        msg.attach(MIMEText(html_content, "html"))

        # 💡 PRO TIP: For Gmail, port 465 with SSL is often more reliable than 587.
        # Ensure you are using an 'APP PASSWORD' if 2FA is enabled.
        if "gmail.com" in str(host).lower() and int(port) == 465:
            with smtplib.SMTP_SSL(str(host), int(port)) as server:
                server.login(str(user), str(password))
                server.send_message(msg)
        else:
            with smtplib.SMTP(str(host), int(port)) as server:
                try:
                    server.starttls()
                except: pass
                server.login(str(user), str(password))
                server.send_message(msg)
        
        logging.info(f"✅ Neural transmission delivered to {recipient}")
        print(f"✅ EMAIL SUCCESS: Sent '{subject}' to {recipient}")
    except Exception as e:
        error_msg = str(e)
        logging.error(f"❌ Neural transmission failed in background: {error_msg}")
        print(f"❌ EMAIL FAILURE: {error_msg}")
        if "authentication" in error_msg.lower():
            print("💡 REASON: Likely incorrect credentials. For Gmail, you MUST use an 'App Password', NOT your primary login password.")
        elif "connection" in error_msg.lower():
            print("💡 REASON: Could not connect to the SMTP server. Check your firewall or proxy settings.")

@app.post("/api/contact")
async def contact_form_submission(contact: ContactRequest, background_tasks: BackgroundTasks):
    """
    Receives contact form submissions and triggers background neural transmission to StarterScope7@gmail.com.
    """
    try:
        # 1. Environment Variables for Email
        EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
        EMAIL_USER = os.getenv("EMAIL_USER")
        EMAIL_PASS = os.getenv("EMAIL_PASS")
        TARGET_EMAIL = "StarterScope7@gmail.com"

        # ═══════════════════════════════════════════════════
        # EMAIL TEMPLATE (Predefined & Professional)
        # ═══════════════════════════════════════════════════
        request_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
                body {{ font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }}
                .header {{ background-color: #0f172a; padding: 48px 40px; text-align: center; border-bottom: 4px solid #10b981; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; font-style: italic; }}
                .sub {{ color: #10b981; }}
                .content {{ padding: 40px; }}
                .meta-label {{ text-transform: uppercase; font-size: 11px; font-weight: 900; letter-spacing: 0.15em; color: #64748b; margin-bottom: 8px; }}
                .subject-box {{ margin-bottom: 32px; }}
                .subject-text {{ font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2; word-break: break-word; }}
                .message-box {{ background-color: #f8fafc; padding: 32px; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 32px; }}
                .message-text {{ font-size: 16px; line-height: 1.7; color: #334155; margin: 0; white-space: pre-wrap; word-break: break-word; }}
                .sender-card {{ background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; }}
                .label {{ color: #64748b; font-weight: 500; font-size: 14px; padding: 12px 0; word-break: break-word; }}
                .value {{ color: #0f172a; font-weight: 700; font-size: 14px; text-align: right; padding: 12px 0; word-break: break-word; }}
                .footer {{ background-color: #fafafa; padding: 24px 40px; text-align: center; border-top: 1px solid #f1f5f9; }}
                .footer p {{ font-size: 12px; color: #94a3b8; margin: 0; }}
                .accent-bar {{ height: 8px; background: linear-gradient(90deg, #10b981, #3b82f6); }}
                
                @media only screen and (max-width: 600px) {{
                    .container {{ margin: 0 !important; border-radius: 0 !important; width: 100% !important; }}
                    .header, .content, .footer {{ padding: 32px 20px !important; }}
                    .subject-text {{ font-size: 20px !important; }}
                    .message-box {{ padding: 20px !important; }}
                    .label, .value {{ display: block !important; width: 100% !important; text-align: left !important; padding: 4px 0 !important; }}
                    .label {{ padding-top: 12px !important; }}
                    .value {{ padding-bottom: 12px !important; }}
                    .sender-card {{ padding: 16px !important; }}
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>StarterScope <span class="sub">Support</span></h1>
                </div>
                <div class="accent-bar"></div>
                <div class="content">
                    <div class="subject-box">
                        <div class="meta-label">Priority Support Request</div>
                        <h2 class="subject-text">{contact.subject}</h2>
                    </div>

                    <div class="meta-label">Communication content</div>
                    <div class="message-box">
                        <p class="message-text">{contact.message}</p>
                    </div>

                    <div class="meta-label">Origin details</div>
                    <div class="sender-card">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td class="label">Name</td>
                                <td class="value">{contact.name}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td class="label">Identity</td>
                                <td class="value" style="color: #10b981;">{contact.email}</td>
                            </tr>
                            {f'''
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td class="label">Company</td>
                                <td class="value">{contact.profile_context.get("company", "Not specified")}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td class="label">Industry</td>
                                <td class="value">{contact.profile_context.get("industry", "Not specified")}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td class="label">Location</td>
                                <td class="value">{contact.profile_context.get("location", "Not specified")}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td class="label">Phone</td>
                                <td class="value">{contact.profile_context.get("phone", "Not specified")}</td>
                            </tr>
                            ''' if contact.profile_context else ''}
                            <tr>
                                <td class="label">Intelligence Logged</td>
                                <td class="value">{request_time}</td>
                            </tr>
                        </table>
                    </div>
                    {f'''
                    <div style="margin-top: 24px;">
                        <div class="meta-label">Pro Profile Context</div>
                        <div class="message-box" style="margin-bottom: 0;">
                            <p class="message-text" style="font-style: italic; font-size: 14px;">"{contact.profile_context.get("bio", "No bio provided.")}"</p>
                            {f'<p style="font-size: 12px; margin-top: 12px; color: #3b82f6;">Website: {contact.profile_context.get("website")}</p>' if contact.profile_context.get("website") else ''}
                        </div>
                    </div>
                    ''' if contact.profile_context else ''}
                </div>
                <div class="footer">
                    <p>Designed for Enterprise Strategic Insights • STARTERSCOPE V3.0</p>
                    <p style="margin-top: 8px; font-size: 10px;">ID: UN-INITIATED-NEURAL-GATE-TX</p>
                </div>
            </div>
        </body>
        </html>
        """

        request_id = str(hashlib.md5(f"{contact.email}{time.time()}".encode()).hexdigest())[:8]

        # ═══════════════════════════════════════════════════
        # BACKGROUND TRANSMISSION
        # ═══════════════════════════════════════════════════
        if (not EMAIL_USER or not EMAIL_PASS):
            logging.warning("⚠️ SMTP Credentials missing! Logging message to terminal instead.")
            print(f"📬 FORM SUBMISSION: {contact.name} ({contact.email}) | Sub: {contact.subject}")
            print(f"💬 MESSAGE: {contact.message}")
            if contact.profile_context:
                print(f"👤 PRO PROFILE CONTEXT: {json.dumps(contact.profile_context, indent=2)}")
            return {"status": "success", "message": "Feedback logged locally", "id": request_id}

        # Queue the email send so we can respond to the user IMMEDIATELY
        background_tasks.add_task(
            send_support_email, 
            EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, 
            TARGET_EMAIL, contact.subject, html_content, contact.name
        )

        return {"status": "success", "message": "Neural transmission initiated", "id": request_id}

    except Exception as e:
        logging.error(f"❌ Contact processing failed: {str(e)}")
        return {"status": "error", "message": "Transmission protocol failed"}

@app.get("/api/info")
async def api_info():
    payments = "dodo" if dodo_available else "fallback"
    return {"title": "StarterScope API", "version": "2.2", "status": "operational", "payments": payments}

# --- Map Data Proxy ---
@app.get("/api/businesses/search")
async def search_businesses(q: str):
    """
    Proxies map search requests through the backend to avoid browser CORS and 
    IP rate limits. Hits Nominatim/Overpass with a server-side User-Agent.
    """
    if not q:
        return {"data": []}
        
    try:
        import urllib.parse
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Add a compliant User-Agent as required by Nominatim/OSM policy
            headers = {"User-Agent": "StarterScopeBackend/2.2 (DataScout)"}
            url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(q)}&limit=15&addressdetails=1"
            

            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            return {"data": response.json(), "source": "nominatim_server"}
            
    except Exception as e:
        logger.error(f"Backend proxy map search failed: {e}")
        return {"data": [], "error": str(e)}

class OverpassQuery(BaseModel):
    query: str

@app.post("/api/businesses/overpass")
async def search_overpass(payload: OverpassQuery):
    """
    Proxies Overpass API queries through the backend to avoid browser CORS, 
    rate limits, and 403 Forbidden errors from mirrors. 
    """
    if not payload.query:
        return {"elements": []}
        
    mirrors = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    ]
    
    import asyncio
    
    async def fetch_mirror(client, mirror_url):
        headers = {
            "User-Agent": "StarterScopeBackend/2.2 (DataScout)",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = f"data={httpx.utils.quote(payload.query)}" if hasattr(httpx, 'utils') else f"data={urllib.parse.quote(payload.query)}"
        response = await client.post(mirror_url, headers=headers, content=data)
        response.raise_for_status()
        return response.json()

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Race the mirrors - first successful response wins
            tasks = [asyncio.create_task(fetch_mirror(client, mirror)) for mirror in mirrors]
            
            done, pending = await asyncio.wait(
                tasks,
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Cancel lingering tasks
            for task in pending:
                task.cancel()
                
            for task in done:
                try:
                    return task.result()
                except Exception as e:
                    logger.warning(f"Mirror fetch failed: {e}")
                    continue
                    
            return {"elements": []}
    except Exception as e:
        logger.error(f"Backend proxy overpass search failed: {e}")
        return {"elements": [], "error": str(e)}



# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Razorpay removed (Total migration to Dodo Payments completed)

try:
    from dodopayments import DodoPayments
    dodo_available = bool(os.getenv("DODO_PAYMENTS_API_KEY"))
    logger.info(f"✅ Dodo Payments status: {'available' if dodo_available else 'missing key'}")
except ImportError:
    dodo_available = False
    logger.warning("⚠️ Dodo Payments SDK not found")

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

# Database initialization moved to startup event for non-blocking boot
@app.on_event("startup")
async def startup_db_init():
    if db_available:
        try:
            logger.info("🚀 Starting Database Initialization (Neural Link)...")
            # Run blocking init in a thread to keep the event loop alive
            success = await asyncio.to_thread(init_database)
            if success:
                db_status = await asyncio.to_thread(check_db_connection)
                if not db_status:
                    logger.warning("⚠️ Database connection test failed")
                else:
                    logger.info("✅ Database connection successful and tables ready")
            else:
                logger.error("❌ Database initialization failed")
        except Exception as e:
            logger.error(f"⚠️ Critical database startup error: {e}")
            import traceback
            logger.error(traceback.format_exc())

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
    from simple_recommendations import generate_ai_business_plan, generate_ai_roadmap, parse_real_location_data
    recommendations_available = True
    logger.info("✅ Simple recommendations and location resolver imported successfully")
except Exception as e:
    logger.error(f"⚠️ Simple recommendations import failed: {e}")
    recommendations_available = False
    # Create dummy functions to prevent crashes
    def generate_ai_business_plan(*args, **kwargs):
        return None
    def generate_ai_roadmap(*args, **kwargs):
        return None
    def parse_real_location_data(*args, **kwargs):
        return {}

# Import integrated intelligence lazily
_cached_intelligence = None

# Global In-Memory Cache for optimization (as requested)
_SUBSCRIPTION_CACHE = {}
_USER_CACHE = {}
_CACHE_TTL = 300 # 5 minutes

def get_cached_subscription(email: str, db: Session):
    """Get subscription from cache or DB with smart cache population"""
    import time
    email = email.lower().strip()
    now = time.time()
    
    # Check cache
    if email in _SUBSCRIPTION_CACHE:
        data, expiry = _SUBSCRIPTION_CACHE[email]
        if now < expiry:
            logger.info(f"⚡ Cache hit (Subscription): {email}")
            return data
            
    # Cache miss or expired
    sub = get_synced_subscription(db, email)
    _SUBSCRIPTION_CACHE[email] = (sub, now + _CACHE_TTL)
    return sub

def invalidate_user_cache(email: str):
    """Clear cache for a specific user after updates"""
    email = email.lower().strip()
    _SUBSCRIPTION_CACHE.pop(email, None)
    _USER_CACHE.pop(email, None)
    logger.info(f"🧹 Cache invalidated for: {email}")

def get_intelligence():
    global _cached_intelligence
    if _cached_intelligence is None:
        try:
            from integrated_business_intelligence import IntegratedBusinessIntelligence, register_ws_pusher
            # Register the global WebSocket broadcaster
            register_ws_pusher(manager.broadcast)
            _cached_intelligence = IntegratedBusinessIntelligence()
            logger.info("✅ Integrated business intelligence initialized with WebSocket push support")
        except Exception as e:
            logger.error(f"⚠️ Lazy intelligence initialization failed: {e}")
            logger.error(f"Full error: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    return _cached_intelligence

# Remove module-level import that was previously here
# integrated_intelligence = ... (now accessed via get_intelligence())

# CORS Middleware already added via consolidated setup


# Consolidated Database Dependency
def get_db():
    """Robust generator to provide database sessions via dependency injection."""
    if not db_available:
        raise HTTPException(status_code=503, detail="Database not available")
    
    from database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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


class RecommendationRequest(BaseModel):
    area: str
    user_email: str = "anonymous"
    language: str = "English"
    phase: str = "discovery"  # Business development phase

@app.post("/api/businesses/scrape")
async def scrape_businesses(payload: ScrapeRequest, db: Session = Depends(get_db)):
    """Deep extract Google Maps business contacts via Apify (PRO feature)"""
    from apify_scraper import scrape_google_maps_contacts, format_apify_to_internal
    import json
    
    logger.info(f"🔍 Deep Scrape Requested: '{payload.query}' in {payload.location} (Limit: {payload.max_results})")
    
    # ENFORCED Tier Gate: Only Professional, Growth, and Enterprise can access deep extraction
    if payload.email and isinstance(payload.email, str):
        try:
            sub = get_cached_subscription(str(payload.email), db)
            if not sub or sub.plan_name not in ['professional', 'growth', 'enterprise']:
                logger.warning(f"🚫 GATED: Non-PRO user {payload.email} blocked from deep scrape.")
                return {
                    "success": False,
                    "message": f"Deep Extraction is a PREMIUM feature for Professional, Growth, and Enterprise plans. Please upgrade to unlock."
                }
        except Exception as tier_error:
            logger.error(f"⚠️ Subscription check failed during scrape: {tier_error}")
            pass
    
    try:
        # Apify call (Wait for actor to finish)
        raw_items = scrape_google_maps_contacts([payload.query], payload.location, max_results=payload.max_results)
        
        if not raw_items:
            return {
                "success": False,
                "message": "No results found or Apify execution failed.",
                "data": []
            }
            
        # Format results using our standard mapping
        results = [format_apify_to_internal(item) for item in raw_items]
        
        # 🧠 NEURAL INTELLIGENCE LAYER: Generate Landscape Summary (RAG-style)
        landscape_summary = "Competitive mapping complete. Local market shows standard density."
        try:
            competitor_names = ", ".join([r['name'] for r in results[:10]])
            categories = ", ".join(list(set([r['category'] for r in results])))
            
            prompt = f"Analyze this competitive landscape for '{payload.query}' in '{payload.location}'. " \
                     f"Competitors found: {competitor_names}. Categories: {categories}. " \
                     f"Provide a 2-sentence professional high-level assessment of market saturation and strategic entry potential."
            
            from simple_recommendations import call_pollinations_ai
            summary_response = await asyncio.to_thread(call_pollinations_ai, prompt)
            if summary_response:
                landscape_summary = summary_response
        except Exception as ai_err:
            logger.error(f"Landscape AI analysis failed: {ai_err}")

        # 💾 SAVE TO HISTORY
        if payload.email and db_available:
            try:
                area_label = f"{payload.query} in {payload.location} (Deep Extraction)"
                db_record = models.SearchHistory(
                    user_email=payload.email,
                    area=area_label,
                    analysis=json.dumps({"source": "apify_google_maps", "count": len(results), "ai_summary": landscape_summary}),
                    recommendations=results
                )
                db.add(db_record)
                db.commit()
                db.refresh(db_record)
                logger.info(f"✅ Deep scrape saved to history for {payload.email} (ID: {db_record.id})")
            except Exception as db_save_error:
                logger.error(f"⚠️ Failed to save scrape to history: {db_save_error}")
        
        return {
            "success": True,
            "data": results,
            "count": len(results),
            "summary": landscape_summary,
            "source": "google_maps_apify_deep"
        }
    except Exception as e:
        logger.error(f"❌ Apify deep scrape failed: {e}")
        return {
            "success": False, 
            "error": str(e),
            "message": "Encountered a critical error during extraction."
        }

class BusinessPlanRequest(BaseModel):
    business_title: str
    area: str
    user_email: Optional[str] = "anonymous"
    language: Optional[str] = "English"

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

class SavedBusinessCreate(BaseModel):
    user_email: str
    business_name: str
    category: Optional[str] = None
    location: Optional[str] = None
    details: Dict[str, Any]


class SubscriptionCreate(BaseModel):
    user_email: str
    plan_name: str
    plan_display_name: str
    billing_cycle: str
    price: float
    currency: str = "INR"
    max_analyses: int = 5
    features: Dict
    dodo_subscription_id: Optional[str] = None
    dodo_customer_id: Optional[str] = None


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
    dodo_payment_id: Optional[str] = None

class ProcessPaymentRequest(BaseModel):
    user_email: str
    dodo_payment_id: str
    order_id: Optional[str] = None
    amount: float
    plan_name: str
    billing_cycle: str = "monthly"
    currency: Optional[str] = "INR"

    status: str = "success"
    payment_method: Optional[str] = None
    plan_name: str
    billing_cycle: str
    currency: Optional[str] = "INR"
    
class ScrapeRequest(BaseModel):
    query: str
    location: str
    max_results: int = 50
    email: Optional[str] = None

class DodoCheckoutRequest(BaseModel):
    product_id: str
    quantity: int = 1
    email: str
    name: str
    return_url: str
    amount: Optional[int] = None
    billing_cycle: Optional[str] = "yearly"

class DodoPaymentConfirmation(BaseModel):
    payment_id: str
    status: str
    email: str
    plan_name: str
    billing_cycle: str
    amount: float
    currency: str = "USD"


def normalize_plan_name(plan_name: str) -> str:
    """Enhanced mapping for 5-tier growth strategy"""
    if not plan_name:
        return "free"
        
    p = plan_name.lower().strip()
    
    # Enterprise mapping
    if any(x in p for x in ['enterprise', 'dominance', 'dominator']):
        return "enterprise"
        
    # Growth mapping
    if any(x in p for x in ['growth', 'business', 'accelerator']):
        return "growth"
        
    # Professional mapping
    if any(x in p for x in ['pro', 'professional', 'architect']):
        return "professional"
        
    # Starter mapping
    if any(x in p for x in ['starter', 'venture', 'strategist']):
        return "starter"
        
    # Free/Explorer mapping
    if any(x in p for x in ['free', 'explorer']):
        return "free"
        
    return "free"

def get_synced_subscription(db: Session, email: str):
    """Robust helper to get or reconcile subscription based on payment history and expiry"""
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    email_normalized = email.lower().strip()
    now = datetime.now()
    
    # 1. Get latest successful payment (Search by both email and user_id for robustness)
    logger.info(f"🔄 Reconciling subscription for {email_normalized}...")
    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
    
    query = db.query(models.PaymentHistory).filter(models.PaymentHistory.status == "success")
    if user:
        query = query.filter((func.lower(models.PaymentHistory.user_email) == email_normalized) | (models.PaymentHistory.user_id == user.id))
    else:
        query = query.filter(func.lower(models.PaymentHistory.user_email) == email_normalized)
        
    latest_payment = query.order_by(models.PaymentHistory.created_at.desc()).first()
    if latest_payment:
        logger.info(f"✅ Found latest payment: {latest_payment.dodo_payment_id} (Plan: {latest_payment.plan_name})")
    else:
        logger.info(f"ℹ️ No payment history found for {email_normalized}")
    
    # 2. Get current supposedly active subscription
    subscription = db.query(models.UserSubscription).filter(
        func.lower(models.UserSubscription.user_email) == email_normalized,
        models.UserSubscription.status == "active"
    ).order_by(models.UserSubscription.created_at.desc()).first()
    
    # 3. If no payment history, fallback to subscription's own expiry
    if not latest_payment:
        if subscription and subscription.plan_name != "free":
            # Only expire if it has an end_date and it's actually in the past
            if subscription.subscription_end and subscription.subscription_end.replace(tzinfo=None) < now.replace(tzinfo=None):
                subscription.status = "expired"
                db.commit()
                return None
            return subscription
        return subscription

    # 4. We have a payment. Let's validate the subscription against it.
    mapped_plan = normalize_plan_name(latest_payment.plan_name)
    duration = timedelta(days=365) if latest_payment.billing_cycle == 'yearly' else timedelta(days=30)
    
    # Safety check for created_at
    payment_time = latest_payment.created_at or latest_payment.payment_date
    if not payment_time:
        logger.warning(f"⚠️ No timestamp for payment {latest_payment.id}, using fallback")
        payment_time = now
        
    # We use payment date + duration as the hard truth for expiry
    # If the payment was made long ago, it's expired
    expiry_date = payment_time + duration
    
    if expiry_date.replace(tzinfo=None) < now.replace(tzinfo=None):
        # Latest payment is already expired
        if subscription:
            subscription.status = "expired"
            db.commit()
        return None
        
    # 5. Payment is still valid. Ensure subscription exists and matches.
    if not subscription:
        # User has a valid payment but NO active subscription record
        # Create it now
        user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        if user:
            new_sub = models.UserSubscription(
                user_id=user.id,
                user_email=email_normalized,
                plan_name=mapped_plan,
                plan_display_name=latest_payment.plan_name,
                billing_cycle=latest_payment.billing_cycle or 'yearly',
                price=latest_payment.amount,
                currency=latest_payment.currency or 'INR',
                max_analyses=-1 if mapped_plan in ['professional', 'growth', 'enterprise'] else (100 if mapped_plan == 'starter' else 10),
                features={},
                subscription_end=expiry_date,
                status='active'
            )
            db.add(new_sub)
            db.commit()
            db.refresh(new_sub)
            return new_sub
    else:
        # Subscription exists, check if it matches the latest valid payment
        needs_update = False
        if subscription.plan_name != mapped_plan:
            subscription.plan_name = mapped_plan
            subscription.plan_display_name = latest_payment.plan_name
            needs_update = True
            
        if not subscription.subscription_end or (subscription.subscription_end.replace(tzinfo=None) != expiry_date.replace(tzinfo=None)):
            subscription.subscription_end = expiry_date
            needs_update = True
            
        if needs_update:
            subscription.max_analyses = -1 if mapped_plan in ['professional', 'growth', 'enterprise'] else (100 if mapped_plan == 'starter' else 10)
            subscription.status = "active"
            db.commit()
            db.refresh(subscription)
            
    return subscription




# Manual OPTIONS handler removed to prevent conflicts with CORSMiddleware


# (Redundant CORS middleware removed: app.add_middleware(CORSMiddleware, ...) used instead)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    import json
    exc_str = f'{exc}'.replace('\n', ' ').replace('   ', ' ')
    print(f"--- ⚠️ Validation Error (422) on {request.url.path}: {exc_str}")
    # Log the body if possible
    try:
        body = await request.body()
        print(f"--- 📎 Request Body: {body.decode()}")
    except:
        pass
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.errors())},
    )

# Root endpoint for health checks and deployment verification
# Essential System Handlers consolidated below

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
        pass

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

@app.get("/api/system/resolve-location")
async def resolve_location(q: str):
    """Resolve a location string into geographical entities using AI & local research"""
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    
    try:
        # Calls the function in simple_recommendations which uses Gemini/Pollinations
        location_data = parse_real_location_data(q)
        if not location_data:
            return {
                "success": False,
                "message": "AI could not resolve this location accurately"
            }
        
        return {
            "success": True,
            "data": location_data
        }
    except Exception as e:
        logger.error(f"Location resolution failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/", tags=["System"])
def system_root():
    """Consolidated health and status check"""
    try:
        return {
            "message": "StarterScope Business Intelligence API", 
            "status": "healthy", 
            "version": "2.0",
            "timestamp": datetime.now().isoformat(),
            "location_context": "India/INR Preferred",
            "system_status": {
                "database": "connected" if db_available else "disconnected",
                "models": "available" if models_available else "unavailable", 
                "recommendations": "available" if recommendations_available else "unavailable",
                "integrated_intelligence": "available" if get_intelligence() else "unavailable"
            }
        }
    except Exception as e:
        logger.error(f"Root endpoint error: {e}")
        return {"status": "partial", "error": str(e)}

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
    """Sign up with email and password with normalization"""
    from sqlalchemy import func
    
    email_normalized = user_data.email.lower().strip()
    logger.info(f"📝 Sign up attempt for: {email_normalized}")
    
    try:
        # Check if user already exists (case-insensitive)
        existing_user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        if existing_user:
            logger.warning(f"⚠️ Sign up failed: User {email_normalized} already exists")
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Password validation
        password = user_data.password
        if len(password) < 8:
            logger.warning(f"⚠️ Sign up failed: Password too short for {email_normalized}")
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
            
        if not any(char.isdigit() for char in password):
            logger.warning(f"⚠️ Sign up failed: Password missing digit for {email_normalized}")
            raise HTTPException(status_code=400, detail="Password must contain at least one number")
            
        import re
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            logger.warning(f"⚠️ Sign up failed: Password missing special char for {email_normalized}")
            raise HTTPException(status_code=400, detail="Password must contain at least one special character")
        
        # Secure password hashing (pbkdf2 natively supports long passwords)
        password_hash = pwd_context.hash(user_data.password)
        
        # Create new user
        db_user = models.User(
            email=email_normalized,
            name=user_data.name.strip(),
            password_hash=password_hash,
            auth_provider="email",
            login_count=1,
            last_login=func.now()
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"✅ User created successfully: {email_normalized}")
        return {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "image_url": db_user.image_url
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ SignUp critical failure: {str(e)}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DEBUG signup error: {str(e)}")

@app.post("/api/auth/signin")
def sign_in(user_data: UserSignIn, db: Session = Depends(get_db)):
    """Sign in with email and password with normalization"""
    from sqlalchemy import func
    
    email_normalized = user_data.email.lower().strip()
    logger.info(f"🔑 Sign in attempt for: {email_normalized}")
    
    try:
        # Find user (case-insensitive)
        db_user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        if not db_user:
            logger.warning(f"⚠️ Sign in failed: User {email_normalized} not found")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if user has a password (might be OAuth only)
        if not db_user.password_hash:
            logger.warning(f"⚠️ Sign in failed: User {email_normalized} has no password (social login)")
            raise HTTPException(status_code=401, detail="This account uses social login. Please sign in with Google.")
        
        # Verify password with support for both legacy bcrypt and new pbkdf2
        try:
            is_valid = pwd_context.verify(user_data.password, db_user.password_hash)
        except Exception as e:
            logger.warning(f"⚠️ Low-level verification failed for {email_normalized}, attempting legacy hex-hash fallback: {e}")
            # Final fallback for users created during the brief v2.0 pre-hashing experiment
            try:
                legacy_hex = hashlib.sha256(user_data.password.encode('utf-8')).hexdigest()
                is_valid = pwd_context.verify(legacy_hex, db_user.password_hash)
            except:
                is_valid = False

        if not is_valid:
            logger.warning(f"⚠️ Sign in failed: Invalid credentials for {email_normalized}")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Update login info
        db_user.login_count = (db_user.login_count or 0) + 1
        db_user.last_login = func.now()
        db.commit()
        
        logger.info(f"✅ User signed in successfully: {email_normalized}")
        return {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "image_url": db_user.image_url
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ SignIn critical failure: {str(e)}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=f"DEBUG signin error: {str(e)}")

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


@app.post("/api/recommendations")
async def get_recommendations(request: RecommendationRequest, db: Session = Depends(get_db)):
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
        
        # Helper to safely parse JSON from DB (Defensive Layer)
        def ensure_json_obj(val):
            if isinstance(val, (dict, list)): return val
            if isinstance(val, str) and val.strip():
                try: 
                    loaded = json.loads(val)
                    if isinstance(loaded, str): # Handle double-encoded strings
                        return ensure_json_obj(loaded)
                    return loaded
                except: return {"raw_string": val}
            return []

        if existing_record:
            cached_recs = ensure_json_obj(existing_record.recommendations)
            # 🎯 CACHE QUALITY GUARD: FORCE REFRESH FOR ALL LEGACY RESULTS
            cache_str = str(cached_recs)
            # Detect old-style generic fallbacks or placeholder data
            is_generic_placeholder = "Strategic Market Opportunity" in cache_str or "₹5L-₹15L" in cache_str
            is_generic_template = any(t in cache_str for t in ["Local Digital Solutions", "Hyper-Local Logistics", "Eco-Smart Retail Hub"])
            
            # STRICT COUNT VALIDATION: The V4.2 Strategic Engine SHOULD return 12-15 items. 
            # If the cache has fewer than 10, it's definitely legacy data and MUST be refreshed.
            rec_count = len(cached_recs) if isinstance(cached_recs, list) else 0
            is_legacy_count = rec_count < 10
            
            # ADDRESS IN TITLE DETECTION: If any recommendation title is low-fidelity
            is_bad_naming = False
            if isinstance(cached_recs, list):
                for rec in cached_recs:
                    if isinstance(rec, dict):
                        title = str(rec.get("title", rec.get("name", "")))
                        if title.count(",") >= 2 or "India" in title or "zip" in title.lower():
                            is_bad_naming = True
                            print(f"⚠️  Detected low-fidelity naming in cached title: '{title}'. Forcing refresh...")
                            break
            
            # Use 10 as the baseline for "valid enough and fast"
            is_valid_cache = isinstance(cached_recs, list) and rec_count >= 10 and not is_generic_placeholder and not is_generic_template and not is_bad_naming and not is_legacy_count
            
            if is_valid_cache:
                # Deep validation: ensuring the structure has actual business titles, not empty shells
                sample = cached_recs[0] if len(cached_recs) > 0 else {}
                if isinstance(sample, dict) and not any(sample.get(k) for k in ['title', 'name', 'business_title', 'business_name', 'idea']):
                    is_valid_cache = False

            if is_valid_cache:
                print(f"♻️  Returning high-quality cached intelligence from database (ID: {existing_record.id}, {len(cached_recs)} items)")
                # Recursively unpack if double-encoded
                final_recs = cached_recs
                if isinstance(final_recs, str) and final_recs.strip():
                    try: 
                        loaded = json.loads(final_recs)
                        if isinstance(loaded, (list, dict)):
                            final_recs = loaded
                    except: pass
                
                return {
                    "id": existing_record.id,
                    "area": existing_record.area,
                    "analysis": ensure_json_obj(existing_record.analysis),
                    "recommendations": ensure_json_obj(final_recs),
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
        result = None
        
        if intelligence:
            try:
                result = await intelligence.generate_data_driven_recommendations(analysis_area, request.user_email, request.language, request.phase)
                # Validate the result has actual AI-generated recommendations
                recs = result.get("recommendations", []) if isinstance(result, dict) else []
                if isinstance(recs, list) and len(recs) > 0:
                    print(f"[SUCCESS] Generated {len(recs)} real-time recommendations")
                else:
                    print(f"⚠️ Engine returned empty recommendations. Message: {result.get('message', 'None')}")
                    result = None
            except Exception as e:
                logger.error(f"Integrated intelligence failed: {e}")
                result = None
            
        # ═══════════════════════════════════════════════════════════
        # ZERO FALLBACK POLICY: No fake data. Ever.
        # If the AI engine failed, tell the user to wait and
        # launch a background thread to auto-fix and retry.
        # ═══════════════════════════════════════════════════════════
        if not result:
            logger.warning("Intelligence engine unavailable. Launching background self-fix...")
            
            # 🔧 BACKGROUND SELF-FIXING TASK
            _area = analysis_area
            _email = request.user_email
            _lang = request.language
            _phase = request.phase
            
            async def background_self_fix():
                max_retries = 6  
                wait_seconds = 30  
                
                for attempt in range(1, max_retries + 1):
                    print(f"🔧 [BACKGROUND FIX] Attempt {attempt}/{max_retries} for '{_area}' (waiting {wait_seconds}s)...")
                    await asyncio.sleep(wait_seconds)
                    
                    try:
                        fix_intelligence = get_intelligence()
                        if not fix_intelligence:
                            wait_seconds = min(wait_seconds * 2, 960)
                            continue
                        
                        fix_result = await fix_intelligence.generate_data_driven_recommendations(_area, _email, _lang, _phase)
                        fix_recs = fix_result.get("recommendations", []) if isinstance(fix_result, dict) else []
                        
                        if isinstance(fix_recs, list) and len(fix_recs) > 0:
                            print(f"✅ [BACKGROUND FIX] Successfully generated recommendations for {_area}!")
                            try:
                                from database import SessionLocal
                                fix_db = SessionLocal()
                                final_analysis = fix_result.get("analysis", {})
                                if isinstance(final_analysis, (dict, list)):
                                    final_analysis_str = json.dumps(final_analysis)
                                else:
                                    final_analysis_str = str(final_analysis)

                                fix_record = models.SearchHistory(
                                    user_email=_email,
                                    area=_area,
                                    analysis=final_analysis_str,
                                    recommendations=json.dumps(fix_recs)
                                )
                                fix_db.add(fix_record)
                                fix_db.commit()
                                fix_db.close()
                                return
                            except Exception as db_err:
                                print(f"❌ [BACKGROUND FIX] DB Save failed: {db_err}")
                    except Exception as e:
                        print(f"⚠️ [BACKGROUND FIX] Attempt {attempt} failed: {e}")
                    
                    wait_seconds = min(wait_seconds * 2, 960)
                
                print("❌ [BACKGROUND FIX] All retry attempts exhausted.")
            
            asyncio.create_task(background_self_fix())
            print("🚀 Background self-fix task launched.")
            
            return {
                "area": analysis_area,
                "status": "service_unavailable",
                "error": "Service Unavailable",
                "message": "The AI engine is warming up. Please wait 30 seconds and try again — it will work on retry!",
                "analysis": {},
                "recommendations": [],
                "retry_after_seconds": 30,
                "self_healing": True
            }
        
        # Standardize keys to prevent KeyError in DB save
        recs = result.get("recommendations", [])
        ana = result.get("analysis", result.get("analysis_report", result.get("summary", "Analysis Pending")))
        
        # Save to database
        db_record = models.SearchHistory(
            user_email=request.user_email,
            area=analysis_area,
            analysis=ana,
            recommendations=recs
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        print(f"💾 Saved to database with ID: {db_record.id}")
        
        return {
            "id": db_record.id,
            "area": db_record.area,
            "analysis": ensure_json_obj(db_record.analysis),
            "recommendations": ensure_json_obj(db_record.recommendations),
            "logs": {"reddit": [], "web": []},
            "cached": False,
            "system_status": result.get("system_status", "Live Data Processing Active (2026)"),
            "timestamp": result.get("timestamp"),
            "location_data": result.get("location_data", {}),
            "using_profile_location": bool(user_location and not request.area),
            "profile_location": user_location
        }
        
    except Exception as e:
        print(f"[ERROR] Critical error in recommendations endpoint: {e}")
        import traceback
        traceback.print_exc()
        
        # ZERO FALLBACK: Return service unavailable, never fake data
        return {
            "area": request.area,
            "status": "service_unavailable",
            "error": "Service Unavailable",
            "message": f"Unexpected error: {str(e)[:120]}. Please try again in 30 seconds.",
            "analysis": {},
            "recommendations": [],
            "retry_after_seconds": 30,
            "self_healing": True
        }

@app.get("/api/history/{email}")
def get_user_history(email: str, db: Session = Depends(get_db)):
    """Fetch search history with automatic 7-day cleanup and serialization"""
    try:
        user_email = email.lower().strip()
        
        # 🧹 AUTOMATIC CLEANUP: Purge history older than 7 days OR legacy low-fidelity results (<8 items)
        # This forces the dashboard to only show high-fidelity V4.2 Strategic RAG-Chain results
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        # 1. Delete by age
        db.query(models.SearchHistory).filter(
            models.SearchHistory.user_email == user_email,
            models.SearchHistory.created_at < seven_days_ago
        ).delete(synchronize_session=False)
        
        # 2. Delete by fidelity (Count < 8 is legacy V2/V3 data)
        # We fetch all and check JSON length because SQLite/Postgres JSON length functions vary
        all_recs = db.query(models.SearchHistory).filter(models.SearchHistory.user_email == user_email).all()
        ids_to_purge = []
        for r in all_recs:
            try:
                # Handle potential string-encoded JSON
                recs = r.recommendations
                if isinstance(recs, str): recs = json.loads(recs)
                if not isinstance(recs, list) or len(recs) < 3:
                    ids_to_purge.append(r.id)
            except: ids_to_purge.append(r.id)
            
        deleted_count = 0
        if ids_to_purge:
            deleted_count = db.query(models.SearchHistory).filter(models.SearchHistory.id.in_(ids_to_purge)).delete(synchronize_session=False)
        
        db.commit()
            
        # Fetch remaining high-fidelity history
        history = db.query(models.SearchHistory).filter(
            models.SearchHistory.user_email == user_email
        ).order_by(models.SearchHistory.created_at.desc()).all()
        
        serialized_history = []
        for h in history:
            serialized_history.append({
                "id": getattr(h, "id", None),
                "area": getattr(h, "area", "Unknown Area"),
                "recommendations": getattr(h, "recommendations", []),
                "created_at": str(getattr(h, "created_at", datetime.now())),
                "user_email": getattr(h, "user_email", user_email)
            })
            
        return {
            "history": serialized_history,
            "purged_count": deleted_count
        }
    except Exception as e:
        logger.error(f"Error fetching history for {email}: {e}")
        return {"history": [], "purged_count": 0}

# NEW: Saved Businesses Endpoints
@app.post("/api/saved-businesses")
def save_business(request: SavedBusinessCreate, db: Session = Depends(get_db)):
    """Allow subscribers to save a business recommendation"""
    email = request.user_email.lower().strip()
    
    # Check subscription status (Only paid tiers)
    sub = get_cached_subscription(email, db)
    if not sub or sub.status != "active" or sub.plan_name == "free":
        raise HTTPException(
            status_code=403, 
            detail="Business saving is an Alpha Vault feature. Please upgrade to Professional to save businesses."
        )
    
    # Save the business
    new_saved = models.SavedBusiness(
        user_email=email,
        business_name=request.business_name,
        category=request.category,
        location=request.location,
        details=request.details
    )
    db.add(new_saved)
    db.commit()
    db.refresh(new_saved)
    
    return {"status": "success", "id": new_saved.id, "business_name": new_saved.business_name}

@app.get("/api/saved-businesses/{email}")
def get_saved_businesses(email: str, db: Session = Depends(get_db)):
    """Fetch all businesses saved by a user (Subscriber Only)"""
    email_normalized = email.lower().strip()
    
    # Verify subscriber access via cache for performance
    sub = get_cached_subscription(email_normalized, db)

    # Allow access if they have ANY active paid plan
    if not sub or sub.plan_name == "free" or sub.status != "active":
        raise HTTPException(
            status_code=403, 
            detail="The Business Vault is only accessible with an active Professional subscription."
        )

    saved = db.query(models.SavedBusiness).filter(
        models.SavedBusiness.user_email == email_normalized
    ).order_by(models.SavedBusiness.created_at.desc()).all()
    
    return saved

@app.get("/api/saved-businesses")
def get_saved_businesses_legacy(email: str, db: Session = Depends(get_db)):
    """Fallback for query-string email parameter"""
    return get_saved_businesses(email, db)

@app.delete("/api/saved-businesses/{saved_id}")
def delete_saved_business(saved_id: int, user_email: str, db: Session = Depends(get_db)):
    """Remove a business from the vault"""
    email = user_email.lower().strip()
    saved = db.query(models.SavedBusiness).filter(
        models.SavedBusiness.id == saved_id,
        models.SavedBusiness.user_email == email
    ).first()
    
    if not saved:
        raise HTTPException(status_code=404, detail="Saved business not found or access denied.")
        
    db.delete(saved)
    db.commit()
    return {"status": "deleted", "id": saved_id}



@app.post("/api/business-plan")
def get_business_plan(request: BusinessPlanRequest, db: Session = Depends(get_db)):
    """Generate a high-fidelity business plan using the best available intelligence engine"""
    title = request.business_title
    area = request.area
    email = (request.user_email or "anonymous").lower().strip()
    lang = request.language
    
    print(f"--- 🚀 Dispatching Business Plan Request: {title} in {area}")
    
    business_plan = None
    
    # 1. Try Premium Integrated Intelligence First
    intel = get_intelligence()
    if intel:
        try:
            business_plan = intel.generate_business_plan(title, area, lang)
        except Exception as e:
            print(f"⚠️ Premium engine failed, falling back: {e}")
            
    # 2. Try Standard AI Recommendation Engine if premium failed
    if not business_plan:
        try:
            business_plan = generate_ai_business_plan(title, area, lang)
        except Exception as e:
            print(f"⚠️ Standard AI failed: {e}")
            
    # 3. Final Fallback if everything fails
    if not business_plan:
        area_lower = area.lower()
        is_india = True  # Force India-only mapping as requested
        curr = "₹"
        
        business_plan = {
            "business_overview": f"A strategic initiative to launch {title} in {area} for 2026.",
            "market_analysis": f"The {area} market presents unique growth opportunities for {title}.",
            "success_score": 82,
            "risk_level": "Medium",
            "market_gap": "High",
            "financial_projections": {
                "month_1": {"revenue": f"{curr}0", "expenses": f"{curr}50K", "profit": f"-{curr}50K"},
                "month_2": {"revenue": f"{curr}25K", "expenses": f"{curr}40K", "profit": f"-{curr}15K"},
                "month_3": {"revenue": f"{curr}80K", "expenses": f"{curr}40K", "profit": f"{curr}40K"},
                "month_4": {"revenue": f"{curr}1.5L" if is_india else f"{curr}25K", "expenses": f"{curr}50K", "profit": f"{curr}1L" if is_india else f"{curr}13K"},
                "month_5": {"revenue": f"{curr}2.2L" if is_india else f"{curr}35K", "expenses": f"{curr}55K", "profit": f"{curr}1.6L" if is_india else f"{curr}20K"},
                "month_6": {"revenue": f"{curr}3.5L" if is_india else f"{curr}50K", "expenses": f"{curr}60K", "profit": f"{curr}2.9L" if is_india else f"{curr}32K"}
            },
            "marketing_strategy": "Multi-channel local engagement strategy.",
            "operational_plan": "Scalable operational framework.",
            "risk_analysis": ["Market entry barriers", "Operational overhead"],
            "monthly_milestones": ["Concept & Licensing", "Infrastructure", "Soft Launch", "Scale marketing", "Optimize Operations", "Target ROI"],
            "resource_requirements": "Essential physical/digital infrastructure and core team.",
            "success_metrics": ["User Growth", "Revenue Run-rate", "Customer Retention"]
        }
    
    # Save to database for history/profile
    try:
        db_plan = models.BusinessPlan(
            user_email=email,
            business_title=title,
            area=area,
            plan_data=business_plan
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        print(f"✅ Business plan saved to database for {email}")
    except Exception as e:
        print(f"⚠️ Database save failed: {e}")
        # We still return the plan even if save failed
        
    return business_plan

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
    is_indian_city = True # Force INR for all roadmaps as requested
    currency = "₹"
    
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
                auth_provider="dodo"
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
            # Razorpay sync removed
            
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
            # Razorpay sync removed
        )
        db.add(db_subscription)
        db.commit()
        db.refresh(db_subscription)
        
        print(f"SUCCESS: Created subscription: {db_subscription.id} for {email_normalized}")
        
        return db_subscription
        
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

# System location already defined as async proxy above

# Endpoint consolidated at the end of file for stability

@app.post("/api/payments")
def create_payment_record(payment: PaymentCreate, db: Session = Depends(get_db)):
    """Create payment record with enhanced error handling (Dodo focused)"""
    from sqlalchemy import func
    import traceback
    
    try:
        logger.info(f"🔔 Payment creation request received: {payment.user_email}")
        
        email_normalized = payment.user_email.lower().strip()
        logger.info(f"DEBUG: Creating payment record for {email_normalized} - Amount: {payment.amount}")
        
        # Validate required fields
        if not payment.dodo_payment_id:
            raise HTTPException(status_code=400, detail="dodo_payment_id is required")
        if not payment.plan_name:
            raise HTTPException(status_code=400, detail="plan_name is required")
        if not payment.billing_cycle:
            raise HTTPException(status_code=400, detail="billing_cycle is required")
        
        # Get User ID with better error handling
        try:
            logger.info(f"🔍 Looking for user: {email_normalized}")
            user_rec = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
            if not user_rec:
                logger.info(f"DEBUG: User {email_normalized} not found, creating user record")
                # Create user if doesn't exist
                user_rec = models.User(
                    email=email_normalized,
                    name=email_normalized.split('@')[0],
                    auth_provider="dodo"
                )
                db.add(user_rec)
                db.commit()
                db.refresh(user_rec)
                logger.info(f"✅ Created new user: {user_rec.id}")
            
            u_id = user_rec.id
            logger.info(f"✅ User ID found/created: {u_id}")
        except Exception as e:
            logger.error(f"ERROR: Failed to get/create user: {e}")
            logger.error(f"ERROR: Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"User creation failed: {str(e)}")

        try:
            # Check if payment already exists
            logger.info(f"🔍 Checking for existing payment: {payment.dodo_payment_id}")
            existing_payment = db.query(models.PaymentHistory).filter(
                models.PaymentHistory.dodo_payment_id == payment.dodo_payment_id
            ).first()
            
            if existing_payment:
                logger.info(f"INFO: Payment {payment.dodo_payment_id} already exists, returning existing")
                return existing_payment
            
            # Create new payment record
            logger.info(f"💳 Creating new payment record...")
            
            # Normalize plan name for database consistency
            normalized_plan = normalize_plan_name(payment.plan_name)
            
            db_payment = models.PaymentHistory(
                user_id=u_id,
                user_email=email_normalized,
                subscription_id=payment.subscription_id,
                amount=payment.amount,
                currency=payment.currency or "INR",
                dodo_payment_id=payment.dodo_payment_id,
                status=payment.status,
                payment_method=payment.payment_method or "dodo",
                plan_name=normalized_plan,
                billing_cycle=payment.billing_cycle
            )
            db.add(db_payment)
            db.commit()
            db.refresh(db_payment)
            
            logger.info(f"SUCCESS: Payment record created with ID: {db_payment.id}")
            
            # CLEAR CACHE after new payment to ensure immediate sync
            invalidate_user_cache(email_normalized)
            
            return db_payment
            
        except Exception as e:
            db.rollback()
            error_msg = str(e).lower()
            logger.error(f"ERROR: Failed to create payment record: {e}")
            logger.error(f"ERROR: Traceback: {traceback.format_exc()}")
            
            # Check for duplicate key errors
            if any(term in error_msg for term in ["duplicate key", "unique constraint", "already exists"]):
                existing = db.query(models.PaymentHistory).filter(
                    models.PaymentHistory.dodo_payment_id == payment.dodo_payment_id
                ).first()
                if existing:
                    logger.info(f"INFO: Returning existing payment record for {payment.dodo_payment_id}")
                    return existing
            
            # Return a more detailed error
            raise HTTPException(
                status_code=500, 
                detail={
                    "error": "Failed to create payment record",
                    "message": str(e),
                    "payment_id": payment.dodo_payment_id,
                    "user_email": email_normalized,
                    "traceback": traceback.format_exc()
                }
            )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"CRITICAL ERROR in create_payment_record: {e}")
        logger.error(f"CRITICAL ERROR Traceback: {traceback.format_exc()}")
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
    
    return [
        {
            "id": p.id,
            "amount": p.amount,
            "currency": p.currency or "INR",
            "dodo_payment_id": p.dodo_payment_id,
            "status": p.status,
            "plan_name": p.plan_name,
            "billing_cycle": p.billing_cycle,
            "payment_date": getattr(p, 'payment_date', p.created_at).isoformat() if getattr(p, 'payment_date', p.created_at) else None,
            "payment_method": p.payment_method
        }
        for p in payments
    ]

@app.post("/api/process-payment")
def process_frontend_payment(payload: ProcessPaymentRequest, db: Session = Depends(get_db)):
    """Frontend endpoint to securely process and fulfill a successful payment from the confirmation modal."""
    try:
        from dodopayments import DodoPayments
        api_key = os.getenv("DODO_PAYMENTS_API_KEY")
        if not api_key:
            logger.warning("⚠️ DODO_PAYMENTS_API_KEY is not set. Bypassing SDK verification logic.")
        else:
            env = "test_mode" if "test" in api_key.lower() or os.getenv("DODO_ENVIRONMENT") == "test" else "live_mode"
            client = DodoPayments(bearer_token=api_key, environment=env)
            
            # Verify the payment id actually succeeded, guarding against frontend tampering
            try:
                payment_record_from_dodo = client.payments.retrieve(payload.dodo_payment_id)
                # Dodo's success status comes back generically or specifically as 'succeeded'
                if payment_record_from_dodo.status.lower() not in ["succeeded", "success"]:
                     raise HTTPException(status_code=400, detail="Transaction not verified as successful by Dodo.")
            except AttributeError:
                # Catch cases where older SDK versions return a dictionary or different structure
                pass
            except Exception as e:
                logger.error(f"❌ Dodo verification error for {payload.dodo_payment_id}: {e}")
                raise HTTPException(status_code=400, detail=f"Failed to verify payment status: {str(e)}")

        email_normalized = payload.user_email.lower().strip()
        plan_name = payload.plan_name
        mapped_plan = normalize_plan_name(plan_name)
        
        logger.info(f"🔄 Fulfilling verified payment for {email_normalized} (Plan: {plan_name})")

        # 1. Update Payment History if it doesn't exist (Webhook might have beaten us to it)
        existing_payment = db.query(models.PaymentHistory).filter(models.PaymentHistory.dodo_payment_id == payload.dodo_payment_id).first()
        
        if not existing_payment:
            payment_record = models.PaymentHistory(
                user_email=email_normalized,
                dodo_payment_id=payload.dodo_payment_id,
                amount=payload.amount,
                currency=payload.currency or "INR",
                status="success",
                plan_name=plan_name,
                billing_cycle=payload.billing_cycle,
                payment_method="dodo"
            )
            db.add(payment_record)
            
        # 2. Trigger robust subscription upgrade
        subscription_data = SubscriptionCreate(
            user_email=email_normalized,
            plan_name=mapped_plan,
            plan_display_name=plan_name,
            billing_cycle=payload.billing_cycle,
            price=payload.amount,
            currency=payload.currency or "INR",
            max_analyses=-1 if mapped_plan == 'professional' else 100,
            features={}
        )
        
        create_subscription(subscription_data, db)
        db.commit()
        invalidate_user_cache(email_normalized)
        
        return {
            "status": "success",
            "plan_name": mapped_plan,
            "plan_display_name": plan_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Critical error in process-payment: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={"error": "Fulfillment failure", "message": str(e)}
        )


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
        user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        
        query = db.query(models.PaymentHistory).filter(models.PaymentHistory.status == "success")
        if user:
            query = query.filter((func.lower(models.PaymentHistory.user_email) == email_normalized) | (models.PaymentHistory.user_id == user.id))
        else:
            query = query.filter(func.lower(models.PaymentHistory.user_email) == email_normalized)
            
        payments = query.order_by(models.PaymentHistory.created_at.desc()).all()
        
        if not payments:
            return {"status": "info", "message": "No receipts available for download", "count": 0}
        
        # Simple JSON response for now
        return {
            "status": "success",
            "message": f"Successfully found {len(payments)} receipts",
            "count": len(payments),
            "payments": [{
                "id": p.id,
                "date": p.created_at.isoformat(),
                "amount": p.amount,
                "plan": p.plan_name
            } for p in payments]
        }
    except Exception as e:
        logger.error(f"Error in download_all_receipts: {e}")
        return {"status": "error", "message": str(e)}
        return {
            "message": f"Found {len(payments)} receipts",
            "receipts": [
                {
                    "id": p.dodo_payment_id,
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
                    "dodo_payment_id": p.dodo_payment_id,
                    "payment_method": p.payment_method
                } for p in payments
            ]
        }
    except Exception as e:
        logger.error(f"Search payments error: {e}")
        return {"error": str(e)}


# --- DEPRECATED: RAZORPAY ENDPOINTS (Migrated to Dodo Payments V6.1) ---
# Razorpay endpoints completely removed (Migration to Dodo Payments V6.1)

@app.get("/api/test-cors")
async def test_cors_endpoint():
    """Simple endpoint to test CORS from frontend"""
    return {
        "status": "success",
        "message": "CORS is working",
        "timestamp": datetime.now().isoformat(),
        "server": "trendai-api.onrender.com"
    }

@app.get("/api/dodo/test")
async def test_dodo_import():
    """Test if Dodo Payments library can be imported"""
    try:
        from dodopayments import DodoPayments
        api_key = os.getenv("DODO_PAYMENTS_API_KEY")
        return {
            "status": "success",
            "library_imported": True,
            "api_key_present": bool(api_key),
            "api_key_prefix": api_key[:10] + "..." if api_key else None
        }
    except ImportError as e:
        return {
            "status": "error",
            "library_imported": False,
            "error": f"Import error: {str(e)}"
        }
    except Exception as e:
        return {
            "status": "error", 
            "library_imported": True,
            "error": f"Other error: {str(e)}"
        }

@app.post("/api/dodo/create-session")
async def create_dodo_checkout_session(request: DodoCheckoutRequest):
    """Integrate with Dodo Payments using their official Python SDK"""
    api_key = os.getenv("DODO_PAYMENTS_API_KEY")
    if not api_key:
        logger.error("❌ Dodo API Key is missing from environment variables")
        raise HTTPException(status_code=401, detail="Dodo API Key missing. Please check your .env file.")
    
    try:
        # Configuration
        product_id = request.product_id
        email = request.email
        return_url = request.return_url
        
        logger.info(f"🔄 Creating Dodo session for {email} with product {product_id}")
        
        # Determine environment
        env = "test_mode" if "test" in api_key.lower() or os.getenv("DODO_ENVIRONMENT") == "test" else "live_mode"
        
        # Initialize official Dodo SDK
        # The merchant's SDK version uses bearer_token as the keyword
        client = DodoPayments(
            bearer_token=api_key,
            environment=env
        )
        
        # Create checkout session using SDK
        # We use product_cart for newer SDK versions or direct product_id for older ones
        # Multiplied by 100 to convert Rupees/Dollars to Paisa/Cents for certain SKU configurations
        price_amount = request.amount * 100 if request.amount else None
        
        try:
            cart_item = {"product_id": product_id, "quantity": request.quantity or 1}
            if price_amount:
                cart_item["amount"] = price_amount # Use 'amount' or 'price' depending on SDK version
                
            session = client.checkout_sessions.create(
                product_cart=[cart_item],
                customer={"email": email, "name": request.name},
                return_url=return_url
            )
        except (TypeError, AttributeError):
            # Fallback for older SDK version structure
            session = client.checkout_sessions.create(
                product_id=product_id,
                customer={"email": email},
                return_url=return_url
            )
        
        # Log the response structure for debugging
        logger.info(f"✅ Dodo SDK response received for amount {request.amount}. Keys: {dir(session)}")
        
        # Safely get ID and URL (SDK version compatibility)
        checkout_id = getattr(session, "id", getattr(session, "checkout_id", "DODO_" + str(int(time.time()))))
        checkout_url = getattr(session, "checkout_url", None)
        
        if not checkout_url:
            raise HTTPException(status_code=500, detail="Dodo SDK failed to provide a checkout URL")
            
        return {
            "checkout_url": checkout_url,
            "session_id": checkout_id
        }
                
    except Exception as sdk_error:
        error_msg = str(sdk_error)
        logger.error(f"❌ Dodo SDK Request failed: {error_msg}")
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Failed to create checkout session",
                "message": error_msg
            }
        )

@app.post("/api/dodo/webhook")
@app.post("/dodo/webhook")
@app.post("/webhook/dodo")
async def dodo_webhook(request: Request):
    """Standard Webhooks integration for Dodo Payments following Standard Webhooks spec"""
    webhook_secret = os.getenv("DODO_WEBHOOK_KEY")
    
    if not webhook_secret:
        logger.warning("⚠️ DODO_WEBHOOK_KEY not set, skipping verification (DEV ONLY)")
        try:
            body = await request.json()
            return await process_dodo_payload(body)
        except Exception as e:
            logger.error(f"❌ Webhook processing failed: {e}")
            return {"status": "error", "message": str(e)}

    try:
        from standardwebhooks import Webhook
        
        # 🛡️ Dodo 'whsec_' prefix handling
        if webhook_secret.startswith("whsec_"):
            logger.info("🔧 Stripping 'whsec_' prefix from webhook key for verification")
            webhook_secret = webhook_secret.replace("whsec_", "")
        
        # Get webhook headers following Standard Webhooks spec
        webhook_id = request.headers.get("webhook-id")
        webhook_signature = request.headers.get("webhook-signature")
        webhook_timestamp = request.headers.get("webhook-timestamp")
        
        # Log received headers for debugging (only in non-prod or carefully)
        logger.info(f"🔔 Webhook Headers: id={webhook_id}, has_sig={bool(webhook_signature)}, ts={webhook_timestamp}")
        
        if not all([webhook_id, webhook_signature, webhook_timestamp]):
            logger.error(f"❌ Missing required webhook headers. Raw headers: {dict(request.headers)}")
            raise HTTPException(status_code=400, detail="Missing required webhook headers (id, signature, or timestamp)")
        
        headers = {
            "webhook-id": webhook_id,
            "webhook-signature": webhook_signature,
            "webhook-timestamp": webhook_timestamp,
        }
        
        raw_body = await request.body()
        wh = Webhook(webhook_secret)
        
        try:
            wh.verify(raw_body.decode(), headers)
            payload = json.loads(raw_body)
            logger.info(f"✅ Webhook verified successfully: {payload.get('type')}")
            return await process_dodo_payload(payload)
        except Exception as verify_err:
            logger.error(f"❌ Webhook verification failed logic: {verify_err}")
            # Log first few chars of secret for sanity check
            logger.error(f"❌ Secret key used ends with: ...{webhook_secret[-10:]}")
            raise HTTPException(status_code=400, detail=f"Invalid webhook signature matching failed: {str(verify_err)}")
        
    except Exception as e:
        logger.error(f"❌ Webhook verification critical error: {e}")
        raise HTTPException(status_code=400, detail=f"Webhook verification Error: {str(e)}")

@app.get("/api/dodo/webhook")
@app.get("/dodo/webhook")
async def dodo_webhook_heartbeat():
    """Heartbeat for Dodo Webhook to prevent 404 on browser visits"""
    return {"status": "active", "message": "StarterScope Dodo Webhook is Up (POST Only)"}

async def process_dodo_payload(payload: Dict[str, Any]):
    """Internal logic to process verified Dodo webhook payload and activate subscriptions"""
    logger.info(f"🔔 Processing Dodo Event: {payload.get('type')}")
    
    event_type = payload.get("type")
    data = payload.get("data", payload)
    
    if event_type == "payment.succeeded":
        payment_id = data.get("payment_id")
        customer = data.get("customer", {})
        email = (customer.get("email") or "").lower().strip()
        
        # Amount in Dodo is in cents
        amount_cents = data.get("total_amount") or data.get("amount") or 0
        amount = float(amount_cents) / 100
        
        # Determine plan from product_id or amount
        product_cart = data.get("product_cart", [])
        product_id = product_cart[0].get("product_id") if product_cart else None
        
        if product_id:
            if "professional" in product_id.lower():
                plan_name = "Professional"
            elif "starter" in product_id.lower():
                plan_name = "Starter"
            else:
                plan_name = "Starter" # Fallback
        else:
            plan_name = "Professional" if amount > 300 else "Starter"
            
        mapped_plan = normalize_plan_name(plan_name)
        
        from database import SessionLocal
        db = SessionLocal()
        try:
            # 1. Update Payment History
            # Check if this payment already recorded
            existing = db.query(models.PaymentHistory).filter(models.PaymentHistory.dodo_payment_id == payment_id).first()
            if not existing:
                payment_record = models.PaymentHistory(
                    user_email=email,
                    dodo_payment_id=payment_id,
                    amount=amount,
                    currency=data.get("currency") or "INR",
                    status="success",
                    plan_name=plan_name,
                    billing_cycle="monthly", # Default
                    payment_method="dodo"
                )
                db.add(payment_record)
            
            # 2. Update Subscription
            # Use SubscriptionCreate model if available
            subscription_data = SubscriptionCreate(
                user_email=email,
                plan_name=mapped_plan,
                plan_display_name=plan_name,
                billing_cycle="monthly",
                price=amount,
                currency=data.get("currency") or "INR",
                max_analyses=-1 if mapped_plan == 'professional' else 100,
                features={}
            )
            create_subscription(subscription_data, db)
            
            db.commit()
            invalidate_user_cache(email)
            logger.info(f"✅ Dodo Subscription Activated via Webhook: {email} | Plan: {plan_name}")
            return {"status": "success"}
        except Exception as e:
            logger.error(f"❌ Error processing Dodo webhook: {e}")
            db.rollback()
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
            
    return {"status": "ignored", "message": f"Event type {event_type} not handled"}

@app.post("/api/dodo/confirm-payment")
async def confirm_dodo_payment(confirmation: DodoPaymentConfirmation, db: Session = Depends(get_db)):
    """Manual confirmation from frontend after Dodo redirect"""
    email_normalized = confirmation.email.lower().strip()
    logger.info(f"💳 Confirming Dodo Payment: {confirmation.payment_id} for {email_normalized}")
    
    try:
        user_rec = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()
        if not user_rec:
            user_rec = models.User(email=email_normalized, name=email_normalized.split('@')[0], auth_provider="dodo")
            db.add(user_rec)
            db.commit()
            db.refresh(user_rec)
        
        db_payment = models.PaymentHistory(
            user_id=user_rec.id,
            user_email=email_normalized,
            amount=confirmation.amount,
            currency=confirmation.currency,
            dodo_payment_id=confirmation.payment_id,
            status="success",
            payment_method="dodo",
            plan_name=normalize_plan_name(confirmation.plan_name),
            billing_cycle=confirmation.billing_cycle
        )
        db.add(db_payment)
        
        mapped_plan = normalize_plan_name(confirmation.plan_name)
        sub_end = datetime.now() + (timedelta(days=365) if confirmation.billing_cycle == "yearly" else timedelta(days=30))
        
        existing_sub = db.query(models.UserSubscription).filter(
            func.lower(models.UserSubscription.user_email) == email_normalized
        ).first()
        
        if existing_sub:
            existing_sub.plan_name = mapped_plan
            existing_sub.plan_display_name = confirmation.plan_name
            existing_sub.status = "active"
            existing_sub.subscription_end = sub_end
        else:
            new_sub = models.UserSubscription(
                user_id=user_rec.id,
                user_email=email_normalized,
                plan_name=mapped_plan,
                plan_display_name=confirmation.plan_name,
                status="active",
                subscription_end=sub_end,
                billing_cycle=confirmation.billing_cycle,
                price=confirmation.amount,
                currency=confirmation.currency
            )
            db.add(new_sub)
            
        db.commit()
        invalidate_user_cache(email_normalized)
        return {"status": "success", "message": "Payment confirmed and subscription active"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Dodo confirmation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/process-payment")
async def process_payment_immediately(request: Request, db: Session = Depends(get_db)):
    """Process payment immediately after successful transaction"""
    try:
        body = await request.json()
        logger.info(f"🔔 Processing immediate payment: {body}")
        
        user_email = body.get('user_email')
        payment_id = body.get('dodo_payment_id') or body.get('payment_id')
        order_id = body.get('order_id') or f"order_{payment_id}"
        amount = body.get('amount')
        plan_name = body.get('plan_name')
        billing_cycle = body.get('billing_cycle', 'yearly')
        
        if not all([user_email, payment_id, amount, plan_name]):
            raise HTTPException(status_code=400, detail="Missing required payment information")
        
        # Create payment record immediately
        payment_data = PaymentCreate(
            user_email=user_email,
            amount=float(amount),
            dodo_payment_id=payment_id,
            status="success",
            plan_name=plan_name,
            billing_cycle=billing_cycle,
            payment_method="dodo"
        )
        
        payment_record = create_payment_record(payment_data, db)
        
        # Map plan names for subscription
        mapped_plan = normalize_plan_name(plan_name)
        
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
            "payment_id": str(payment_id),
            "plan_name": str(mapped_plan),
            "plan_display_name": str(plan_name),
            "subscription_active": True,
            "max_analyses": -1 if mapped_plan in ['professional', 'enterprise'] else 5,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Process payment error: {e}")
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail={
            "error": "Failed to process payment",
            "message": str(e),
            "traceback": traceback.format_exc()
        })

@app.get("/api/users/{email}/profile")
def get_user_profile(email: str, db: Session = Depends(get_db)):
    """Get user profile information with robust subscription synchronization"""
    email_normalized = email.lower().strip()
    logger.info(f"🔍 Profile request for: {email_normalized}")

    user = db.query(models.User).filter(func.lower(models.User.email) == email_normalized).first()

    if not user:
        logger.error(f"🔍 User not found: {email_normalized}")
        raise HTTPException(status_code=404, detail="User not found")

    # Reconcile and get subscription using robust helper
    subscription = get_synced_subscription(db, email_normalized)

    # Get user statistics
    search_count = db.query(models.SearchHistory).filter(
        func.lower(models.SearchHistory.user_email) == email_normalized
    ).count()

    # Get real payment history (Robust lookup)
    logger.info(f"📊 Fetching transactions for {email_normalized} (User ID: {user.id})...")
    payments_query = db.query(models.PaymentHistory).filter(
        (func.lower(models.PaymentHistory.user_email) == email_normalized) |
        (models.PaymentHistory.user_id == user.id)
    )
    recent_payments = payments_query.order_by(models.PaymentHistory.created_at.desc()).limit(15).all()
    logger.info(f"✅ Found {len(recent_payments)} records in payment_history table")

    return {
        "user": {
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
            "last_login": user.last_login.isoformat() if user.last_login else None
        },
        "analysis_count": search_count,
        "subscription": {
            "id": subscription.id,
            "plan_name": subscription.plan_name,
            "plan_display_name": subscription.plan_display_name,
            "billing_cycle": subscription.billing_cycle,
            "price": float(subscription.price) if subscription.price else 0.0,
            "currency": subscription.currency,
            "status": subscription.status,
            "max_analyses": subscription.max_analyses,
            "features": subscription.features,
            "subscription_end": subscription.subscription_end.isoformat() if subscription.subscription_end else None
        } if subscription else None,
        "recent_payments": [
            {
                "id": payment.id,
                "amount": payment.amount,
                "currency": payment.currency or "INR",
                "dodo_payment_id": payment.dodo_payment_id,
                "status": payment.status,
                "plan_name": payment.plan_name,
                "billing_cycle": payment.billing_cycle,
                "payment_date": payment.payment_date.isoformat() if payment.payment_date else payment.created_at.isoformat(),
                "payment_method": payment.payment_method
            }
            for payment in recent_payments
        ]
    }


# Legacy Razorpay synchronization and debug endpoints removed.

@app.post("/api/refresh-user-plan/{email}")
def refresh_user_plan(email: str, db: Session = Depends(get_db)):
    """Force refresh user's plan based on unified sync logic"""
    email_normalized = email.lower().strip()
    logger.info(f"🔄 Force refreshing plan for: {email_normalized}")
    
    try:
        # Reconcile and get subscription using robust helper
        subscription = get_synced_subscription(db, email_normalized)
        
        return {
            "status": "success",
            "message": f"Plan refreshed for {email_normalized}",
            "user_email": email_normalized,
            "current_plan": subscription.plan_name if subscription else 'free',
            "plan_display_name": subscription.plan_display_name if subscription else 'Starter',
            "max_analyses": subscription.max_analyses if subscription else 5,
            "subscription_end": subscription.subscription_end.isoformat() if (subscription and subscription.subscription_end) else None
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to refresh user plan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh plan: {str(e)}")

@app.get("/api/subscriptions/{user_email}")
def get_user_subscription(user_email: str, db: Session = Depends(get_db)):
    """Get user subscription status with payment-based reconciliation
    
    This is the primary endpoint the frontend SubscriptionContext calls.
    It MUST return accurate data based on payment history, not just the subscription table.
    """
    email_normalized = user_email.lower().strip()
    logger.info(f"📋 Subscription check for: {email_normalized}")
    
    try:
        # Always reconcile against payment history (source of truth)
        subscription = get_synced_subscription(db, email_normalized)
        
        if subscription and subscription.plan_name and subscription.plan_name != 'free':
            plan = normalize_plan_name(subscription.plan_name)
            logger.info(f"✅ Subscription found: {plan} (display: {subscription.plan_display_name})")
            return {
                "plan_name": plan,
                "plan_display_name": subscription.plan_display_name or plan.capitalize(),
                "status": subscription.status,
                "max_analyses": subscription.max_analyses,
                "subscription_end": subscription.subscription_end.isoformat() if subscription.subscription_end else None,
                "billing_cycle": subscription.billing_cycle,
            }
        
        # No paid subscription - return free tier
        logger.info(f"ℹ️ No paid subscription for {email_normalized}, returning free")
        return {
            "plan_name": "free",
            "plan_display_name": "Explorer",
            "status": "active",
            "max_analyses": 10,
            "subscription_end": None,
            "billing_cycle": None,
        }
    
    except Exception as e:
        logger.error(f"❌ Error fetching subscription for {email_normalized}: {e}")
        # Return free gracefully on errors (don't crash the UI)
        return {
            "plan_name": "free",
            "plan_display_name": "Explorer",
            "status": "active",
            "max_analyses": 10,
            "subscription_end": None,
            "billing_cycle": None,
        }

@app.post("/api/fix-subscription/{email}")
def fix_user_subscription(email: str, db: Session = Depends(get_db)):
    """Fix user subscription based on centralized logic"""
    email_normalized = email.lower().strip()
    logger.info(f"🔧 Fixing subscription for: {email_normalized}")
    
    try:
        # Reconcile and get subscription using robust helper
        subscription = get_synced_subscription(db, email_normalized)
        
        return {
            "status": "success",
            "message": f"Subscription fixed for {email_normalized}",
            "subscription": {
                "plan_name": subscription.plan_name if subscription else 'free',
                "plan_display_name": subscription.plan_display_name if subscription else 'Starter',
                "status": subscription.status if subscription else 'active',
                "max_analyses": subscription.max_analyses if subscription else 5,
                "subscription_end": subscription.subscription_end.isoformat() if (subscription and subscription.subscription_end) else None
            }
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to fix subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fix subscription: {str(e)}")



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
        user.name = str(user_update.name).strip()
    if user_update.image_url is not None:
        user.image_url = str(user_update.image_url)
    if user_update.bio is not None:
        user.bio = str(user_update.bio).strip()
    if user_update.phone is not None:
        user.phone = str(user_update.phone).strip()
    if user_update.company is not None:
        user.company = str(user_update.company).strip()
    if user_update.location is not None:
        user.location = str(user_update.location).strip()
    if user_update.website is not None:
        user.website = str(user_update.website).strip()
    if user_update.industry is not None:
        user.industry = str(user_update.industry).strip()
    
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
            "last_login": user.last_login if user.last_login else None,
            "created_at": user.created_at,
            "message": "Profile updated successfully"
        }
    except Exception as e:
        db.rollback()
        print(f"Failed to update user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

# Vercel handler for cloud deployments

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


# Razorpay legacy endpoints removed as part of full migration to Dodo Payments.


# Vercel handler
handler = app

if __name__ == "__main__":
    import uvicorn
    # Set console to UTF-8 for Windows (prevents charmap crashes)
    import sys
    import io
    if sys.platform == "win32":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
        
    print("--- [STARTUP] Engine V4.2 Standardized on UTF-8 (RAG Cluster) ---")
    # Hot-reload enabled for strategic session updates
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
