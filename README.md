# Startup Scope | Strategic Business Intelligence Platform

A high-fidelity business intelligence engine that provides AI-powered market analysis, hyper-local business recommendations, and neural strategic planning tools. It uses a 5-layer architecture designed for real-time market reconnaissance, swarm retrieval-augmented generation (RAG), and self-healing intelligence synthesis.

---

## 🚀 Live Demo & Infrastructure

*   **Official Domain**: [https://starterscope.entrext.com](https://starterscope.entrext.com)
*   **Vercel Mirror**: [https://trend-ai-main.vercel.app](https://trend-ai-main.vercel.app)
*   **Neural API Gateway**: [https://starterscope-api.onrender.com](https://starterscope-api.onrender.com)

---

## 🧠 System Architecture & Workflow

Startup Scope uses a decoupled frontend/backend structure to race real-time local intelligence pipelines and stream progress directly to the user dashboard.

```mermaid
graph TD
    subgraph "1. KINETIC CLIENT LAYER (Next.js 14)"
        A1[Reconnaissance Dashboard] --> A2[State Management: Context/sessionStorage]
        A2 --> A3[API Proxy Router]
        A3 --> A4[Websocket Stream Listener]
        A3 --> A5[CSS-Sanitized PDF Exporter]
    end

    subgraph "2. GATEWAY & ORCHESTRATION (FastAPI)"
        B1[CORS & Proxy Middleware] --> B2[Websocket Broadcast Manager]
        B1 --> B3[API Controller Router]
        B3 --> B4[Swarm Scheduler / Timeout Guard]
    end

    subgraph "3. RAG SCOUTING SWARM (Real-Time Intel)"
        C1[Tavily & Exa Neural Search] --- C2[SerpAPI & Serper: Google Maps]
        C2 --- C3[PRAW Reddit Scraper: Pain Points]
        C3 --- C4[FRED API: Economic Telemetry]
    end

    subgraph "4. REASONING CLUSTER (Intel Core)"
        D1[Gemini 1.5 Flash: Core RAG Model] --> D2[Claude 3.5 Critic: Consensus & Validation]
        D2 --> D3[Pollinations AI: Self-Healing Fallback]
        D3 --> D4[Zero-Fallback Verification Layer]
    end

    subgraph "5. PERSISTENCE LAYER (Neon PostgreSQL)"
        E1[Neon DB: Connection Pooling] --- E2[Search History Cache]
        E2 --- E3[Alpha Vault: Saved Strategic Nodes]
        E3 --- E4[Billing & User Metadata]
    end

    A3 -.-> B1
    B4 -.-> C1
    C1 -.-> D1
    D4 -.-> E1
```

### 🔄 End-to-End Operational Lifecycle

1.  **Reconnaissance Trigger**: The user inputs a target geographical area (e.g. `Karnataka, India`) or requests analysis for a specific business concept.
2.  **Telemetry & Location Resolution**: The API resolves location metadata natively via `Nominatim` and country/state/city APIs. If the location is in India, it enforces an **Indian Localization Policy** (using ₹, Lakhs, Crores, and mapping specific local neighborhood entities like Chowks, Mandis, and Colonies).
3.  **Active Swarm Scouting**: The system activates parallel crawlers/crawling proxies (Tavily, Reddit, SerpAPI, and FRED). Live search feeds and raw consumer pain points are compiled into a comprehensive RAG block.
4.  **WebSocket Progress Broadcast**: As telemetry runs, the backend broadcasts real-time progress events over a WebSocket connection (`/ws/analysis`), keeping the client updated.
5.  **Reasoning & Self-Healing Synthesis**:
    *   The compiled context is sent to the **Reasoning Cluster** led by **Gemini 1.5 Flash**.
    *   If Anthropic keys are active, **Claude 3.5 Sonnet** critiques and refines the JSON structure for mathematical coherence (ROI, breakeven validation) and localization.
    *   If rate-limits or transient gateway faults occur, a **Self-Healing Fallback Engine** (running via Pollinations AI) intercepts the error, running a secondary prompt to return structured JSON.
    *   As an absolute last resort, a hardcoded baseline structured model is returned to guarantee 0% UI downtime.
6.  **Alpha Vault Archival**: The parsed, sanitized JSON data is stored inside Neon PostgreSQL. Users can "save" specific recommendations, moving them to their personalized **Alpha Vault** for compliance verification, strategic business plans, and 6-month roadmap tracking.

---

## 📁 Repository Directory Structure

```
StarterScope/
├── frontend/                     # Next.js 14 Client App (TypeScript & Tailwind)
│   ├── src/
│   │   ├── app/                  # Next.js App Router (Dashboard, Roadmap, Tiers)
│   │   ├── components/           # UI Elements (Charts, Forms, Interactive Maps)
│   │   ├── context/              # Authentication & Subscription States
│   │   ├── hooks/                # Custom React Hooks
│   │   ├── types/                # TypeScript Data Models
│   │   └── utils/                # PDF Generation, API Proxying & Sanitization
│   └── package.json
│
├── api/                          # FastAPI Backend Engine (Python 3.10+)
│   ├── main.py                   # Central Gateway & Routing Controller
│   ├── database.py               # SQLAlchemy Connection & Pooling Config
│   ├── models.py                 # PostgreSQL Database Schema Models
│   ├── integrated_business_intelligence.py # RAG Scouting Swarm & Neural Reasoning
│   ├── simple_recommendations.py # Strategic Roadmaps, Plans & Location Resolvers
│   ├── apify_scraper.py          # Google Maps deep data extraction
│   └── requirements.txt          # Python Dependencies
│
├── vercel.json                   # Cloud Deployment Config
└── README.md                     # Documentation Hub (This File)
```

---

## 🔧 Environment Configuration

Create a `.env` file in the respective project directories:

### Backend Engine (`/api/.env`)
```env
DATABASE_URL=postgresql://user:password@neon-db-url/dbname?sslmode=require
GEMINI_API_KEY=your_google_gemini_api_key
CLAUDE_API_KEY=your_anthropic_claude_api_key  # Optional: For critic consensus
POLLINATIONS_API_KEY=your_pollinations_key    # Optional: For fallback processing
TAVILY_API_KEY=your_tavily_search_api_key
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_CLIENT_ID=your_praw_reddit_client_id
REDDIT_CLIENT_SECRET=your_praw_reddit_client_secret
DODO_PAYMENTS_API_KEY=your_dodo_api_key       # Sandbox/Live key
DODO_WEBHOOK_KEY=your_dodo_webhook_signing_key
EMAIL_USER=StarterScope7@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Next.js Client (`/frontend/.env`)
```env
NEXT_PUBLIC_API_URL=https://starterscope-api.onrender.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
NEXTAUTH_URL=https://starterscope.entrext.com
NEXTAUTH_SECRET=your_nextauth_jwt_secret
NEXT_PUBLIC_DODO_STARTER_ID=pd_xxx
NEXT_PUBLIC_DODO_PROFESSIONAL_ID=pd_yyy
DODO_PAYMENTS_API_KEY=your_dodo_public_api_key
```

---

## 🛰️ API Reference & Endpoint Workflows

All endpoints enforce strict CORS verification against authorized deployment origins.

---

### 1. Authentication & Profiling

#### `POST /api/auth/signup`
Creates a new user record with SHA-256 hashed credentials.
*   **Request Body**:
    ```json
    {
      "email": "innovator@example.com",
      "password": "SecurePassword123!",
      "name": "Alex Carter"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": 14,
      "email": "innovator@example.com",
      "name": "Alex Carter",
      "auth_provider": "email",
      "created_at": "2026-05-21T15:17:21Z"
    }
    ```

#### `POST /api/auth/signin`
Validates credentials and updates user session tracking.
*   **Request Body**:
    ```json
    {
      "email": "innovator@example.com",
      "password": "SecurePassword123!"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "user": {
        "email": "innovator@example.com",
        "name": "Alex Carter"
      }
    }
    ```

#### `POST /api/users/sync`
Synchronizes OAuth logins (e.g. Google Sign-In) to update identity profiles.
*   **Request Body**:
    ```json
    {
      "email": "innovator@example.com",
      "name": "Alex Carter",
      "image_url": "https://lh3.googleusercontent.com/a/ac-image"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": 14,
      "email": "innovator@example.com",
      "name": "Alex Carter",
      "image_url": "https://lh3.googleusercontent.com/a/ac-image",
      "status": "synchronized"
    }
    ```

#### `GET /api/users/{email}/profile`
Retrieves a complete summary of user profile data, active subscription statuses, and recent transaction history.
*   **Parameters**: `email` (path string)
*   **Response (200 OK)**:
    ```json
    {
      "user": {
        "id": 14,
        "email": "innovator@example.com",
        "name": "Alex Carter",
        "bio": "Tech founder looking to launch a localized micro-logistics firm.",
        "phone": "+91 98765 43210",
        "image_url": null,
        "company": "Carter Enterprises",
        "location": "Bengaluru, Karnataka",
        "website": "https://entrext.com",
        "industry": "Logistics",
        "auth_provider": "email",
        "login_count": 8,
        "last_login": "2026-05-21T14:30:00Z"
      },
      "analysis_count": 4,
      "subscription": {
        "id": 5,
        "plan_name": "professional",
        "plan_display_name": "Growth Accelerator",
        "billing_cycle": "monthly",
        "price": 1499.0,
        "currency": "INR",
        "status": "active",
        "max_analyses": 25,
        "features": {
          "deep_scouting": true,
          "financial_enrichment": true
        },
        "subscription_end": "2026-06-21T14:30:00Z"
      },
      "recent_payments": [
        {
          "id": 102,
          "amount": 1499.0,
          "currency": "INR",
          "dodo_payment_id": "pay_dodo_xyz123",
          "status": "success",
          "plan_name": "professional",
          "billing_cycle": "monthly",
          "payment_date": "2026-05-21T14:30:00Z",
          "payment_method": "card",
          "invoice_url": "https://dodo.payments/invoice/xyz"
        }
      ]
    }
    ```

#### `PUT /api/users/{email}`
Updates basic bio and business context metadata for the profile.
*   **Request Body**:
    ```json
    {
      "name": "Alex Carter",
      "bio": "Serial entrepreneur specializing in hyper-local market intelligence.",
      "phone": "+91 98765 43210",
      "company": "Carter Swarm Labs",
      "location": "Bengaluru, Karnataka",
      "website": "https://entrext.com",
      "industry": "SaaS / AI"
    }
    ```

---

### 2. Market Analysis & Intelligence Swarm

#### `POST /api/recommendations`
Triggers the multi-source RAG scouting swarm, runs the reasoning cluster, and generates 12-15 localized business proposals.
*   **Request Body**:
    ```json
    {
      "area": "Bengaluru, Karnataka, India",
      "user_email": "innovator@example.com",
      "language": "English",
      "phase": "discovery",
      "business_type": "Electric Vehicle charging station hub"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": 482,
      "area": "Bengaluru, Karnataka, India",
      "system_status": "Live Data Processing Active (2026)",
      "cached": false,
      "recommendations": [
        {
          "business_name": "Namma Charge EV Hubs",
          "description": "Localized neighborhood EV charging nodes targeting dense residential corridors.",
          "category": "CleanTech / EV",
          "is_seasonal": false,
          "market_gap": "Lack of Level-2 chargers near residential apartments in HSR Layout.",
          "target_audience": "Urban EV car/two-wheeler owners",
          "investment_range": "₹8L - ₹12L",
          "potential_revenue": "₹24L/Year",
          "roi_potential": "35%",
          "implementation_difficulty": "Medium",
          "cac": "₹350",
          "ideal_neighborhood": "HSR Sector 2, Bengaluru",
          "market_size": "₹5Cr",
          "payback_period": "14 Months",
          "key_success_factors": ["High grid stability", "Parking accessibility", "UPI integration"],
          "six_month_plan": [
            {"month": "Month 1-2", "goal": "Obtain BESCOM permits & secure charging hardware"},
            {"month": "Month 3-4", "goal": "Civil works installation and pilot site run"},
            {"month": "Month 5-6", "goal": "Launch mobile app integration and scale advertisements"}
          ],
          "m1_traffic": "400 vehicles",
          "retention_rate": "80%",
          "demand_index": 92,
          "strategic_recommendations": [
            {"title": "Partner with Local RWAs", "description": "Offer residential societies shared revenue to setup chargers on premises."}
          ]
        }
      ],
      "seasonal_opportunities": {
        "current_season": "Winter (Peak travel season)",
        "trending_ideas": [
          { "business_name": "Insta-Brew Chai Kiosks", "reason": "Higher consumption of hot beverages near IT hubs during cold months." }
        ]
      },
      "analysis": {
        "confidence_score": "94%",
        "market_gap_intensity": "High",
        "regional_stability": "High",
        "summary": "Bengaluru shows massive demand growth for urban EV charging infrastructure backed by localized subsidy policies.",
        "detailed_market_data": true,
        "live_economic_indicators": {
          "gdp_growth": "+7.4%",
          "investment_inflow": "High",
          "business_registrations": "+14% YoY"
        }
      }
    }
    ```

#### `POST /api/businesses/enrich`
Enriches details for a specific business concept with a detailed financial analysis report.
*   **Request Body**:
    ```json
    {
      "title": "Namma Charge EV Hubs",
      "area": "Bengaluru, Karnataka",
      "category": "CleanTech"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "funding_required": "₹10,00,000",
        "estimated_revenue": "₹24,00,000/Year",
        "roi_percentage": "35%",
        "payback_period": "14 Months",
        "market_size": "₹5,00,00,000",
        "competition_level": "Moderate",
        "startup_difficulty": "Medium",
        "initial_team_size": 3,
        "key_success_factors": "Strategic neighborhood partnerships, automated billing and high uptime guarantees.",
        "six_month_plan": "Establish pilot, secure electric permits, launch tracking app.",
        "profit_niches": ["Ad-supported charging screens", "Express battery swapping station for delivery fleets"],
        "demand_index": 92
      }
    }
    ```

---

### 3. Roadmaps & Strategy Implementation

#### `POST /api/business-plan`
Generates a structured, multi-month strategic business plan blueprint.
*   **Request Body**:
    ```json
    {
      "business_title": "Namma Charge EV Hubs",
      "area": "Bengaluru, Karnataka",
      "user_email": "innovator@example.com",
      "language": "English"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "business_overview": "Strategic framework for establishing Namma Charge EV Hubs in Bengaluru.",
      "market_analysis": "Targeting high demand HSR Layout sectors. Under-developed public grid infrastructure allows private entry.",
      "success_score": 88,
      "risk_level": "Medium",
      "market_gap": "High",
      "financial_projections": {
        "month_1": {"revenue": "₹0", "expenses": "₹8.5L", "profit": "-₹8.5L"},
        "month_2": {"revenue": "₹1.2L", "expenses": "₹1.5L", "profit": "-₹30K"},
        "month_3": {"revenue": "₹2.5L", "expenses": "₹1.6L", "profit": "₹90K"},
        "month_4": {"revenue": "₹3.8L", "expenses": "₹1.7L", "profit": "₹2.1L"},
        "month_5": {"revenue": "₹4.5L", "expenses": "₹1.8L", "profit": "₹2.7L"},
        "month_6": {"revenue": "₹5.8L", "expenses": "₹2.0L", "profit": "₹3.8L"}
      },
      "marketing_strategy": "Direct QR-code targeting in apartment parking garages and Google Maps listing indexing.",
      "operational_plan": "Deploying 4 smart charger hubs, integrated with UPI payment aggregators.",
      "risk_analysis": ["Delay in electricity board permits", "Hardware maintenance overheads"],
      "monthly_milestones": [
        "Secure vendor agreements & local permits",
        "Setup hardware and run integration tests",
        "Launch pilot hubs in selected colonies",
        "Enable premium fleet subscription deals",
        "Deploy mobile-app status alerts",
        "Reach breakeven and expand local sites"
      ],
      "resource_requirements": "Electrical contractor, UPI payment software licenses, grid connectors, and ₹10L seed capital.",
      "success_metrics": ["UPI txn fail rate < 1%", "98% uptime", "CAC < ₹250"]
    }
    ```

#### `POST /api/roadmap`
Initiates a interactive roadmap tracker for a target project.
*   **Request Body**:
    ```json
    {
      "area": "Bengaluru, Karnataka",
      "title": "Namma Charge EV Hubs",
      "description": "Establishment of hyper-local EV Charging Points",
      "user_email": "innovator@example.com",
      "language": "English"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "steps": [
        {
          "title": "Phase 1: Validation & Feasibility",
          "description": "Identify local residential grid limits and RWA willingness.",
          "detailed_insight": "Examine high-density neighborhoods (HSR, Indiranagar) and map competitor charging hubs.",
          "milestones": ["Competitor Mapping", "RWA Surveys", "Grid Feasibility Study"]
        },
        {
          "title": "Phase 2: Compliance Setup",
          "description": "GST registration and electrical safety certificates.",
          "detailed_insight": "Apply for BESCOM commercial connections and secure fire safety clearances.",
          "milestones": ["GST Filings", "BESCOM Approvals", "Zonal Safety Checks"]
        }
      ],
      "timeline": "6 Months Plan",
      "area": "Bengaluru, Karnataka",
      "requirements": "Ops engineer, electrical supplier, local zoning consultants.",
      "current_step": 0
    }
    ```

#### `PUT /api/roadmap/step`
Updates the step status on the user's roadmap timeline.
*   **Request Body**:
    ```json
    {
      "user_email": "innovator@example.com",
      "title": "Namma Charge EV Hubs",
      "area": "Bengaluru, Karnataka",
      "current_step": 2
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "current_step": 2,
      "status": "synchronized"
    }
    ```

#### `POST /api/roadmap/guide`
Generates step-by-step implementation instructions for a specific phase of a roadmap.
*   **Request Body**:
    ```json
    {
      "step_title": "Phase 2: Compliance Setup",
      "step_description": "GST registration and electrical safety certificates.",
      "business_type": "EV Charging Station Hub",
      "location": "Bengaluru, Karnataka"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "phase_info": {
        "current_phase": "Setup",
        "phase_progress": "Phase 2 of 6",
        "next_milestone": "Procurement of Level-2 Chargers"
      },
      "objective": "Establish formal legal status and secure commercial grid access rights.",
      "key_activities": [
        "Incorporate business entity (LLP or Private Limited)",
        "Submit online GST registration portal application",
        "Obtain electrical inspection certificate from Chief Electrical Inspectorate"
      ],
      "detailed_steps": [
        {
          "step_number": 1,
          "title": "Entity Setup & GST Filings",
          "description": "Formalize the company structure to write contracts.",
          "duration": "7 Days",
          "resources_needed": ["CA Consultant", "PAN/Aadhaar cards", "Registered address proof"],
          "success_criteria": "GSTIN number is active."
        }
      ],
      "risk_mitigation": {
        "common_risks": ["Zonal permit delays", "Overloaded local transformers"],
        "mitigation_strategies": ["Apply for grid clearance early", "Consider dual-input battery back-up setups"]
      },
      "location_advantages": "Karnataka state policy offers 100% tax waiver on EV charging infrastructure assets."
    }
    ```

---

### 4. Saved Strategic Nodes (Alpha Vault)

#### `POST /api/saved-businesses`
Saves an analysis card to the user's Alpha Vault.
*   **Request Body**:
    ```json
    {
      "user_email": "innovator@example.com",
      "business_name": "Namma Charge EV Hubs",
      "category": "CleanTech",
      "location": "Bengaluru, Karnataka",
      "details": {
        "investment_range": "₹8L - ₹12L",
        "potential_revenue": "₹24L/Year",
        "roi_potential": "35%",
        "market_gap": "Lack of Level-2 chargers near HSR Layout."
      }
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "id": 142,
      "user_email": "innovator@example.com",
      "business_name": "Namma Charge EV Hubs",
      "status": "archived"
    }
    ```

#### `GET /api/saved-businesses/{email}`
Retrieves all archived cards for a user.
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": 142,
        "business_name": "Namma Charge EV Hubs",
        "category": "CleanTech",
        "location": "Bengaluru, Karnataka",
        "details": {
          "investment_range": "₹8L - ₹12L",
          "potential_revenue": "₹24L/Year",
          "roi_potential": "35%"
        },
        "created_at": "2026-05-21T15:17:21Z"
      }
    ]
    ```

#### `DELETE /api/saved-businesses/{saved_id}`
Deletes a saved card from the database.
*   **Response (200 OK)**:
    ```json
    {
      "status": "deleted",
      "id": 142
    }
    ```

---

### 5. Dodo Payments V3 Integration

#### `POST /api/dodo/create-session`
Initializes a new payment checkout session using the official Dodo Payments Python SDK.
*   **Request Body**:
    ```json
    {
      "product_id": "pd_starterscope_professional",
      "quantity": 1,
      "email": "innovator@example.com",
      "name": "Alex Carter",
      "return_url": "https://starterscope.entrext.com/payment-success",
      "amount": 1499,
      "billing_cycle": "monthly",
      "is_recurring": false
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "session_id": "sess_dodo_987654321",
      "payment_url": "https://checkout.dodopayments.com/checkout/sess_dodo_987654321",
      "status": "session_created"
    }
    ```

#### `POST /api/dodo/confirm-payment`
Manually processes transaction success events sent from the client-side checkout redirection.
*   **Request Body**:
    ```json
    {
      "payment_id": "pay_dodo_xyz123",
      "status": "succeeded",
      "email": "innovator@example.com",
      "plan_name": "professional",
      "billing_cycle": "monthly",
      "amount": 1499.00,
      "currency": "INR"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Payment confirmed and user plan updated.",
      "plan": "professional",
      "expiry": "2026-06-21T15:17:21"
    }
    ```

#### `POST /api/dodo/webhook`
Webhook handler that parses and verifies incoming payment and subscription webhook events from Dodo Payments.
*   **Headers**: `x-dodo-signature` (HMAC SHA256 Webhook signature validation)
*   **Supported Events**:
    *   `payment.succeeded`: Records payment history, activates subscriptions, and queues a billing PDF invoice email.
    *   `payment.failed`: Records failed attempts and logs the incident.
    *   `subscription.created` / `subscription.renewed`: Sets active billing ranges.
    *   `subscription.cancelled` / `subscription.expired`: Modifies plan fallback limits to the free tier.
*   **Response (200 OK)**:
    ```json
    {
      "status": "processed",
      "event_id": "evt_dodo_001"
    }
    ```

---

### 6. System & Map Proxies

#### `GET /api/businesses/search`
Proxies OpenStreetMap Nominatim requests server-side to prevent browser CORS blocks and rate-limiting.
*   **Parameters**: `q` (Query string, e.g. `HSR Layout, Bengaluru`)
*   **Response (200 OK)**:
    ```json
    {
      "source": "nominatim_server",
      "data": [
        {
          "place_id": 1482910,
          "licence": "Data © OpenStreetMap contributors, ODbL 1.0.",
          "osm_type": "node",
          "lat": "12.9116",
          "lon": "77.6389",
          "display_name": "HSR Layout, Sector 2, Bengaluru, Karnataka, 560102, India",
          "address": {
            "suburb": "HSR Layout",
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "India",
            "country_code": "in"
          }
        }
      ]
    }
    ```

#### `POST /api/businesses/overpass`
Proxies and runs overpass queries by racing multiple active mirrors (e.g. `overpass-api.de`, `kumi.systems`, `osm.ch`) to return node results.
*   **Request Body**:
    ```json
    {
      "query": "[out:json];node(around:2000,12.9116,77.6389)[amenity=cafe];out;"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "elements": [
        {
          "type": "node",
          "id": 8492019,
          "lat": 12.9118,
          "lon": 77.6391,
          "tags": {
            "amenity": "cafe",
            "name": "Chai Point HSR"
          }
        }
      ]
    }
    ```

---

## ⚡ WebSocket Integration (Real-Time Streams)

To receive real-time, step-by-step telemetry progress as the RAG scouting swarm runs, connect to the websocket interface.

*   **URL**: `ws://localhost:8000/ws/analysis` (or `wss://starterscope-api.onrender.com/ws/analysis`)
*   **Protocol**: JSON-framed event stream

#### Progress Update Frame
During execution, the backend broadcasts status frames:
```json
{
  "type": "analysis_progress",
  "message": "Connecting to local market data...",
  "timestamp": "2026-05-21T15:17:21.492010"
}
```

#### Progressive Workflow Messages:
1. `"Starting our expert market scan..."`
2. `"Connecting to local market data..."`
3. `"Scanning local business gaps..."`
4. `"Organizing local insights..."`
5. `"Building your business profile..."`
6. `"Reasoning through the best opportunities..."`
7. `"Polishing your final report..."`

---

## 💻 Local Development Setup

### Prerequisite Environment
*   Node.js v18.0+
*   Python 3.10+
*   PostgreSQL v14+ (or a Neon.tech cloud instance)

### 1. Initialize and Run the Backend

```bash
# Navigate to API directory
cd api

# Set up virtual environment
python -m venv venv
source venv/Scripts/activate # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server with Uvicorn (standardized to UTF-8 to prevent character encoding crashes)
python main.py
```
The backend API is now running at `http://localhost:8000`.

### 2. Initialize and Run the Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install client packages
npm install

# Start Next.js development server
npm run dev
```
The Next.js dev server is now running at `http://localhost:3000`.

---

## 🚀 Cloud Deployment

### Backend Deploy (Render / Heroku)
The project contains a `Procfile` and `render.yaml` template configured for easy deployment on Render. Ensure all environment variables listed in the backend section are mapped correctly in the dashboard.

### Frontend Deploy (Vercel)
Connect your GitHub repository to Vercel, set the **Framework Preset** to Next.js, configure the root directory to `frontend`, and configure all frontend environment variables.

---

## 📄 Licensing & Compliance

This platform and its proprietary strategic engine source code are **Proprietary**. All rights reserved. 
Unauthorized duplication, distribution, or reverse-engineering of the neural RAG mapping cluster layers is strictly prohibited.