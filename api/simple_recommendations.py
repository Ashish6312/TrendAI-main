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

# Global cache for location resolution
_LOCATION_CACHE: Dict[str, Any] = {}

def generate_detailed_roadmap_step_guide(step_title: str, step_description: str, business_type: str, location: str) -> Dict[str, Any]:
    """Generate high-fidelity implementation details for a roadmap step using advanced intelligence"""
    if integrated_intelligence:
        return integrated_intelligence.generate_implementation_guide(step_title, step_description, business_type, location)
    
    # Fail-fast if engine is missing (Real-time policy)
    return {
        "error": "Intelligence engine unavailable for real-time guidance.",
        "status": "OFFLINE"
    }

def parse_real_location_data(area: str) -> Dict[str, Any]:
    """Resolve location details using AI and external APIs (No hardcoded mappings)"""
    area_lower = area.lower()
    
    if area_lower in _LOCATION_CACHE:
        return _LOCATION_CACHE[area_lower]

    def fetch_api_location(query: str):
        """Fetch location details from CountryStateCity API using AI-resolved ISO codes"""
        api_key = os.getenv("CSCAPI_KEY")
        
        try:
            # 1. Ask AI to resolve the location string to standard JSON (Primary mechanism)
            prompt = f"Resolve this location string to strict JSON: '{query}'. Fields: country (Full Name), country_iso (2 chars), state (Full Name or empty), state_iso (2nd level ISO or empty), city (official name), latitude (float), longitude (float)."
            
            content = None
            gemini_key = os.getenv("GEMINI_API_KEY")
            
            if gemini_key:
                try:
                    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                    resp = requests.post(gemini_url, json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 256}
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
                if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
                iso_data = json.loads(content)
            else:
                raise Exception("Location resolution empty")
            
            country_iso = iso_data.get('country_iso', 'XX').upper()
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
            print(f"⚠️ API location fetch failed: {e}")
            return None

    # Resolve
    api_loc = fetch_api_location(area)
    if api_loc:
        _LOCATION_CACHE[area_lower] = api_loc
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
        from duckduckgo_search import DDGS
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
        print(f"⚠️ DDG Search failed: {e}")
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
                "funding_required": "...",
                "estimated_profit": "...",
                "roi_percentage": 85,
                "payback_period": "...",
                "unique_selling_proposition": "...",
                "six_month_plan": ["Phase 1", "Phase 2", "Phase 3"]
            }}
        ]
    }}
    *MUST RETURN 15 ITEMS IN 'recommendations' list.*
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
        print(f"❌ Pollinations failed: {e}")
        return None
    return None

def generate_ai_business_plan(business_title: str, area: str, language: str = "English") -> Dict[str, Any]:
    """High-fidelity business plan generation (100% AI)"""
    market_context = get_real_time_market_data(area)
    prompt = f"Generate a hyper-detailed 6-month business plan for '{business_title}' in {area}. Context: {market_context[:1000]}. Return JSON only."
    try:
        response = requests.post("https://text.pollinations.ai/", json={"messages": [{"role": "user", "content": prompt}]}, timeout=45)
        content = response.text
        if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
        return json.loads(content)
    except: return {"error": "Failed to generate plan."}

def generate_ai_roadmap(title: str, area: str, language: str = "English") -> Dict[str, Any]:
    """Roadmap generation (High-Fidelity Structured AI)"""
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
    """Primary entry point for the dashboard intelligence (Strictly dynamic)"""
    print(f"📡 Initiating Real-time Intelligence Search for: {area}")
    
    location_info = parse_real_location_data(area)
    
    # 🎯 PRIORITY: Use the Integrated Intelligence Cluster (No fallbacks allowed)
    if integrated_intelligence:
        try:
            return integrated_intelligence.generate_data_driven_recommendations(area, user_email, language)
        except Exception as e:
            print(f"⚠️ Cluster failed, trying direct AI: {e}")
    
    # Direct AI Generation (No hardcoded templates)
    result = generate_ai_recommendations(area, location_info, language)
    if result:
        return result
        
    return {
        "error": "Real-time analysis failed. Please try again in a moment.",
        "status": "ENGINE_FAIL"
    }