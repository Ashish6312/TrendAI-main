import hashlib
import random
import time
import os
import requests
import json
from typing import List, Dict, Any
import praw
from datetime import datetime

# Local intelligence module
try:
    from integrated_business_intelligence import integrated_intelligence
except ImportError:
    integrated_intelligence = None

# Global caches with persistence
_LOC_CACHE_FILE = "location_telemetry_cache.json"
_MARKET_CACHE_FILE = "market_intel_cache.json"
_LOCATION_CACHE: Dict[str, Any] = {}
_MARKET_CACHE: Dict[str, Any] = {}

# Load persistent caches on startup
def load_caches():
    global _LOCATION_CACHE, _MARKET_CACHE
    if os.path.exists(_LOC_CACHE_FILE):
        try:
            with open(_LOC_CACHE_FILE, "r") as f:
                _LOCATION_CACHE = json.load(f)
                print(f"📡 [CACHE] Loaded {len(_LOCATION_CACHE)} mapped entities.")
        except: pass
        
    if os.path.exists(_MARKET_CACHE_FILE):
        try:
            with open(_MARKET_CACHE_FILE, "r") as f:
                _MARKET_CACHE = json.load(f)
                print(f"🧠 [CACHE] Loaded {len(_MARKET_CACHE)} market synthesis reports.")
        except: pass

load_caches()

def save_location_cache():
    try:
        with open(_LOC_CACHE_FILE, "w") as f:
            json.dump(_LOCATION_CACHE, f)
    except: pass

def save_market_cache():
    try:
        with open(_MARKET_CACHE_FILE, "w") as f:
            json.dump(_MARKET_CACHE, f)
    except: pass


def parse_real_location_data(area: str) -> Dict[str, Any]:
    """Resolve location details using AI and external APIs (No hardcoded mappings)"""
    area_lower = area.lower().strip()
    
    if area_lower in _LOCATION_CACHE:
        return _LOCATION_CACHE[area_lower]

    def fetch_api_location(query: str):
        """Fetch location details from CountryStateCity API using AI-resolved ISO codes"""
        api_key = os.getenv("CSCAPI_KEY")
        
        try:
            # 1. Ask AI to resolve the location string to standard JSON (Primary mechanism)
            prompt = f"Resolve this location string to strict JSON: '{query}'. Fields: country, country_iso, state, state_iso, city, latitude (float), longitude (float). MUST use strictly double quotes and NO trailing commas."
            
            content = None
            gemini_key = os.getenv("GEMINI_API_KEY")
            
            if gemini_key:
                try:
                    # Switch to V1beta for reliability in 2026
                    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
                    resp = requests.post(gemini_url, json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 256, "response_mime_type": "application/json"}
                    }, timeout=10)
                    if resp.status_code == 200:
                        content = resp.json()['candidates'][0]['content']['parts'][0]['text']
                except: pass
            
            if not content:
                # Fallback to Pollinations for resolution
                response = requests.post("https://text.pollinations.ai/", json={"messages": [{"role": "user", "content": prompt}]}, timeout=10)
                if response.status_code == 200:
                    content = response.text
                
            if content:
                import re
                # Robust extraction and repair
                content = re.sub(r'```json\s*|\s*```', '', content).strip()
                json_match = re.search(r'(\{.*\})', content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1).strip()
                    # Neural Repair
                    json_str = re.sub(r'\}\s*\{', '}, {', json_str)
                    json_str = re.sub(r',\s*\}', '}', json_str)
                    json_str = re.sub(r',\s*\]', ']', json_str)
                    
                    try:
                        iso_data = json.loads(json_str)
                    except json.JSONDecodeError:
                        # Final attempt: manual quote fix
                        if "'" in json_str and '"' not in json_str:
                             json_str = json_str.replace("'", '"')
                             iso_data = json.loads(json_str)
                        else:
                             raise
                else:
                    raise Exception("No JSON structure found in response")
            else:
                raise Exception("Location resolution empty")
            
            country_iso = str(iso_data.get('country_iso', 'XX')).upper()
            city_name = iso_data.get('city', query.split(',')[0].strip())
            
            return {
                'country': iso_data.get('country', 'Unknown'),
                'state': iso_data.get('state') or 'N/A',
                'city': city_name,
                'country_code': country_iso,
                'currency_symbol': '₹' if country_iso == 'IN' else '$',
                'coordinates': {'lat': float(iso_data.get('latitude', 0)), 'lng': float(iso_data.get('longitude', 0))}
            }
        except Exception as e:
            print(f"⚠️ Neural Layer location resolution failed for {query}: {e}")
            return None

    # Resolve
    api_loc = fetch_api_location(area)
    if api_loc:
        _LOCATION_CACHE[area_lower] = api_loc
        save_location_cache() # Persist to disk
        return api_loc

    # Absolute fallback (Generic) - No hardcoded city lists allowed
    return {
        'country': 'Unknown',
        'state': 'Unknown',
        'country_code': 'XX',
        'currency_symbol': '$',
        'coordinates': {'lat': 0, 'lng': 0}
    }

def format_amount(amt_lakhs, is_ind, curr):
    """Utility to format regional currency denominators"""
    if is_ind:
        if amt_lakhs >= 100:
            val = amt_lakhs / 100
            return f"{curr}{val:.2f}Cr" if val % 1 != 0 else f"{curr}{int(val)}Cr"
        return f"{curr}{amt_lakhs:.1f}L" if amt_lakhs % 1 != 0 else f"{curr}{int(amt_lakhs)}L"
    else:
        return f"{curr}{int(amt_lakhs * 10)}K"

def get_real_time_market_data(area: str) -> str:
    """Fetch real-time market data and news using DuckDuckGo Search"""
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            # Current trends and opportunities
            search_query = f"business opportunities and market trends in {area} 2025-2026 news"
            results = list(ddgs.text(search_query, max_results=8))
            
            context = "Real-time Search Results for {area}:\n"
            for r in results:
                context += f"- {r['title']}: {r['body']} (Source: {r.get('href', 'N/A')})\n"
            
            # Local economic news
            news_query = f"latest business news economy {area} 2026"
            news_results = list(ddgs.text(news_query, max_results=5))
            for r in news_results:
                context += f"- NEWS: {r['title']}: {r['body']}\n"
                
            return context
    except Exception as e:
        print(f"⚠️ Neural Search failed: {e}")
        return ""

def get_reddit_market_data(area: str) -> str:
    """Fetch real-time consumer pain points from Reddit (RAG context)"""
    try:
        reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            password=os.getenv("REDDIT_PASSWORD"),
            user_agent="StarterScope Agent 1.0",
            username=os.getenv("REDDIT_USERNAME"),
        )
        search_query = f"{area} business problems needs services"
        reddit_context = "Reddit Intelligence Insights:\n"
        
        for submission in reddit.subreddit("all").search(search_query, limit=5, time_filter="year"):
            reddit_context += f"- [{submission.subreddit}] {submission.title}\n"
            submission.comment_sort = 'top'
            comments = submission.comments.list()
            for comment in comments[:3]:
                if hasattr(comment, 'body'):
                    reddit_context += f"  > {comment.body[:150]}...\n"
        return reddit_context
    except: return "No Reddit context available."

def generate_ai_recommendations(area: str, location_info: Dict[str, Any], language: str = "English") -> Dict[str, Any]:
    """Generate 15 data-driven recommendations using Pollinations AI (Strict Zero-Fallback)"""
    
    # 1. GATHER RAG CONTEXT
    market_context = get_real_time_market_data(area)
    reddit_context = get_reddit_market_data(area)
    
    currency = location_info.get('currency_symbol', '₹')
    prompt = f"""
    ROLE: Senior Business Intelligence Analyst
    CONTEXT: Generating 2026 market opportunities for {area}.
    
    MARKET CONTEXT (LIVE SEARCH):
    {market_context}
    
    CONSUMER PAIN POINTS (REDDIT):
    {reddit_context}
    
    TASK: Provide EXACTLY 15 unique, high-fidelity business ideas based on the LIVE data provided above.
    
    CRITICAL - INDIAN LOCALIZATION & NAMES: 
    - Use easy, catchy, and RELATABLE Indian names (e.g., 'Bhopal Cold-Pressed Oils', 'Shree Ganesha Logistics', 'Desi-Delight Snacks', 'Apna Kirana').
    - Every business name MUST sound like a real local shop or service in {area}.
    - Use local neighborhood context (Chowks, Mandis, specific colonies if available).
    
    HUMANIZATION: 
    - Write like a seasoned Indian business uncle/expert who is friendly and practical.
    - Use simple, encouraging language. Avoid technical jargon.
    - Focus on 'ground reality' and immediate actionability.
    
    CONSTRAINTS:
    - NO generic ideas.
    - NO hardcoded templates.
    - Use Indian Rupees (Lakhs/Crores) if location is in India.
    - Currency: {currency}
    - Format: Strict JSON.
    
    OUTPUT STRUCTURE:
    {{
        "analysis": {{
            "executive_summary": "...",
            "market_overview": "...",
            "key_facts": ["...", "...", "..."],
            "full_analysis": "3-paragraph detailed analysis using search/reddit data"
        }},
        "recommendations": [
            {{
                "title": "...",
                "description": "...",
                "category": "...",
                "market_gap": "Specific calculated gap",
                "target_audience": "Specific demographics",
                "competitive_advantage": "Calculated edge",
                "revenue_model": "Revenue stream breakdown",
                "funding_required": "UNQ_LOCAL_AMT (e.g. ₹14L)",
                "estimated_profit": "MONTHLY_PROFIT (e.g. ₹55k)",
                "roi_percentage": number (annual, e.g. 42),
                "difficulty": "Low/Medium/High",
                "market_size": "SPECIFIC_REGION_SCOPE",
                "payback_period": "UNQ_MONTHS (e.g. 18 months)",
                "unique_selling_proposition": "USP",
                "six_month_plan": [
                    {{"month": "Month 1-2", "goal": "..."}},
                    {{"month": "Month 3-4", "goal": "..."}},
                    {{"month": "Month 5-6", "goal": "..."}}
                ]
            }}
        ]
    }}
    *RULE: NO PLACEHOLDERS. Every field must be a specific calculated prediction for {area}.*
    *CRITICAL RULE: NO GENERIC PLACEHOLDERS like '₹5L-₹15L' or 'Regional market'. Every single business item MUST have its own unique, realistic numbers based on current 2026 economic data for {area}. If you return the same investment range or ROI for different items, the analysis is CONSIDERED FAILED.*
    *MUST RETURN 15 HIGH-FIDELITY ITEMS IN 'recommendations' list.*
    """

    try:
        response = requests.post(
            "https://text.pollinations.ai/",
            json={"messages": [{"role": "user", "content": prompt}]}, 
            timeout=50
        )
        if response.status_code == 200:
            content = response.text
            if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
            data = json.loads(content)
            data['location_data'] = location_info
            return data
    except Exception as e:
        print(f"❌ Neural Layer failed: {e}")
        return None
    return None

def call_pollinations_ai(prompt: str, system_prompt: str = "Assistant") -> str:
    """Robust fallback for string-based AI requests using Pollinations"""
    try:
        response = requests.post(
            "https://text.pollinations.ai/",
            json={
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "model": "openai"
            }, 
            timeout=30
        )
        if response.status_code == 200:
            return response.text.strip()
    except Exception as e:
        print(f"⚠️ Neural Layer synthesis failed: {e}")
    return ""

async def generate_detailed_roadmap_step_guide(step_title: str, step_description: str, business_type: str, location: str) -> Dict[str, Any]:
    """Generate high-fidelity implementation details for a roadmap step using advanced intelligence"""
    if integrated_intelligence:
        try:
            return await integrated_intelligence.generate_implementation_guide(step_title, step_description, business_type, location)
        except Exception as e:
            print(f"⚠️ Cluster guide generation failed: {e}")
    
    # Fail-fast if engine is missing (Real-time policy)
    return {
        "error": "Intelligence engine unavailable for real-time guidance.",
        "status": "OFFLINE"
    }

async def generate_ai_business_plan(business_title: str, area: str, language: str = "English") -> Dict[str, Any]:
    """High-fidelity business plan generation (100% AI)"""
    market_context = get_real_time_market_data(area)
    prompt = f"Generate a hyper-detailed 6-month business plan for '{business_title}' in {area}. Context: {market_context[:1000]}. Return JSON only."
    
    if integrated_intelligence:
        try:
            # We can use the cluster's generic JSON caller
            return await integrated_intelligence.call_ai_cluster_json(prompt)
        except Exception as e:
            print(f"⚠️ Cluster plan generation failed: {e}")

    try:
        response = requests.post("https://text.pollinations.ai/", json={"messages": [{"role": "user", "content": prompt}]}, timeout=45)
        content = response.text
        if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
        return json.loads(content)
    except: return {"error": "Failed to generate plan."}

async def generate_ai_roadmap(title: str, area: str, language: str = "English") -> Dict[str, Any]:
    """Roadmap generation (High-Fidelity Structured AI)"""
    if integrated_intelligence:
        try:
            return await integrated_intelligence.generate_strategic_roadmap(title, area)
        except Exception as e:
            print(f"⚠️ Cluster roadmap generation failed: {e}")

    prompt = f"Generate a detailed 6-month strategic roadmap for starting '{title}' in {area}. " \
             f"Return ONLY valid JSON with a 'steps' key containing a list of 6 objects. " \
             f"Each object must have: 'title' (short phase name), 'description' (tactical summary), " \
             f"and 'milestones' (a list of 3 specific action items for that month)."
    try:
        response = requests.post("https://text.pollinations.ai/", json={"messages": [{"role": "user", "content": prompt}]}, timeout=45)
        content = response.text
        if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
        return json.loads(content)
    except: return {"steps": []}

def generate_dynamic_recommendations(area: str, user_email: str, language: str = "English") -> Dict[str, Any]:
    """Primary entry point for the dashboard intelligence with deep persistence"""
    area_key = f"{area.lower().strip()}_{language.lower()}"
    
    # 🧠 CHECK PERSISTENT MARKET CACHE FIRST
    if area_key in _MARKET_CACHE:
        print(f"✨ [SINGULARITY CACHE] Instant retrieval for: {area}")
        return _MARKET_CACHE[area_key]

    print(f"📡 Initiating Real-time Intelligence Search for: {area}")
    location_info = parse_real_location_data(area)
    
    # 🎯 PRIORITY: Use the Integrated Intelligence Cluster
    result = None
    if integrated_intelligence:
        try:
            result = integrated_intelligence.generate_data_driven_recommendations(area, user_email, language)
        except Exception as e:
            print(f"⚠️ Cluster failed, trying direct neural synthesis: {e}")
    
    # Direct Neural Synthesis if cluster fails
    if not result:
        result = generate_ai_recommendations(area, location_info, language)
        
    if result and not result.get('error'):
        # 💾 SAVE TO PERSISTENT CACHE
        _MARKET_CACHE[area_key] = result
        save_market_cache()
        return result
        
    return {
        "error": "Neural reconnaissance stalled. Immediate retry available via active swarm layers.",
        "status": "SWARM_WARMUP"
    }