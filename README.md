# StarterScope | Strategic Business Intelligence Platform

A high-fidelity business intelligence engine that provides AI-powered market analysis, hyper-local business recommendations, and neural strategic planning tools.

## 🚀 Live Demo

- **Official Domain**: [https://starterscope.entrext.com](https://starterscope.entrext.com)
- **Vercel Mirror**: [https://trend-ai-main.vercel.app](https://trend-ai-main.vercel.app)
- **Neural API**: [https://starterscope-api.onrender.com](https://starterscope-api.onrender.com)

## 📁 Project Structure

```
StarterScope/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/       # Next.js 13+ app directory
│   │   ├── components/# React components
│   │   ├── context/   # React context providers
│   │   ├── hooks/     # Custom React hooks
│   │   ├── types/     # TypeScript type definitions
│   │   └── utils/     # Utility functions
│   ├── public/        # Static assets
│   └── package.json   # Frontend dependencies
│
├── api/               # FastAPI backend application
│   ├── main.py        # Main FastAPI application
│   ├── database.py    # Database configuration
│   ├── models.py      # SQLAlchemy models
│   ├── simple_recommendations.py    # Basic recommendation engine
│   ├── integrated_business_intelligence.py  # Advanced AI engine
│   ├── requirements.txt  # Python dependencies
│   ├── Procfile       # Render deployment config
│   ├── render.yaml    # Render service configuration
│   └── runtime.txt    # Python version specification
│
└── README.md          # This file
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Payment**: Dodo Payments integration (Checkout Sessions)
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (Neon)
- **ORM**: SQLAlchemy
- **AI/ML**: Google Gemini API, OpenAI
- **External APIs**: SerpAPI, Reddit API, Alpha Vantage
- **Deployment**: Render

## 🚀 Deployment

### Frontend (Vercel)
The frontend is automatically deployed to Vercel from the `frontend/` directory.

### Backend (Render)
The backend is deployed to Render using the configuration in `api/render.yaml`.

## 🔧 Environment Variables

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=your_render_backend_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=your_frontend_url
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_DODO_STARTER_ID=your_dodo_starter_id
NEXT_PUBLIC_DODO_PROFESSIONAL_ID=your_dodo_professional_id
DODO_PAYMENTS_API_KEY=your_dodo_api_key
DODO_WEBHOOK_KEY=your_dodo_webhook_key
```

### Backend (.env)
```
DATABASE_URL=your_postgresql_url
POLLINATION_API_KEY=your_pollination_key
SERPAPI_API_KEY=your_serpapi_key
GEMINI_API_KEY=your_gemini_key
DODO_PAYMENTS_API_KEY=your_dodo_api_key
DODO_WEBHOOK_KEY=your_dodo_webhook_key
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

## 📋 Features

- **AI-Powered Market Analysis**: Get comprehensive business insights for any location
- **Business Recommendations**: Receive tailored business suggestions based on market data
- **Strategic Planning**: Generate detailed business plans and roadmaps
- **User Authentication**: Secure login with Google OAuth and email/password
- **Subscription Management**: Tiered pricing with Dodo Payments integration
- **Location Intelligence**: GPS-based location detection and analysis
- **Real-time Data**: Integration with multiple APIs for current market data

## 🔄 Core Intelligence Architecture

### 🧠 Backend: The Analysis Cluster (FastAPI)
The backend functions as a high-density intelligence refinery, employing a multi-layered RAG (Retrieval-Augmented Generation) strategy:
- **Neural Analysis Engine**: Powered by `Pollinations AI`, the engine synthesizes market gaps and venture roadmaps using real-time economic indicators.
- **Scouting Swarm**: Parallelizes data gathering across `Tavily`, `Exa`, `Serper`, and `Firecrawl` to ensure zero-stale market reasoning.
- **Data Persistence**: Uses a hardened PostgreSQL (Neon) layer with `SQLAlchemy` for mission-critical storage of search history, user metrics, and the 'Alpha Vault'.
- **Operational Resilience**: Features adaptive connection pooling (`pool_pre_ping`) and extended 60s neural timeouts to process complex metropolitan nodes like Karnataka and Mumbai.

### 🌐 Frontend: The Reconnaissance Dashboard (Next.js)
The frontend is a high-performance command center built for real-time visualization:
- **Kinetic Reconnaissance Interface**: Implements `framer-motion` for ultra-smooth glassmorphic transitions and tactile feedback.
- **RealBusiness Scouting Engine**: Races `Overpass API` and `Nominatim` via secure backend proxies. Adheres to a strict **Zero-Fallback Policy**, ensuring every business record displayed is a verifiable real-world entity.
- **State Management**: Orchestrates complex reconnaissance flows using React Context and `sessionStorage` to maintain intelligence continuity during deep-scouting sessions.
- **Intelligence Archival**: Features a proprietary PDF generation suite that recursively sanitizes modern CSS v4 color functions (oklch/oklab) for stable archival generation.

## 🔄 API Configuration

### Intelligence & Reconnaissance
- `POST /api/recommendations` - Initiates the 5-layer neural analysis cluster.
- `POST /api/businesses/search` - Proxy for secure OSM reconnaissance.
- `POST /api/businesses/scrape` - Deep-extraction of business metadata via Apify.
- `POST /api/business-plan` - Strategic blueprint generation.

### Security & Vault Operations
- `GET /api/users/profile` - Fetches the user's operational status and metadata.
- `GET /api/saved-businesses` - Retrieves archived nodes from the Alpha Vault.
- `POST /api/contact` - Mission-critical support pipeline with background SMTP transmission.

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For support and inquiries, please contact the development team.