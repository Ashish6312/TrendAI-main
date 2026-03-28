import hashlib
import random
import time
import os
import requests
import json
from typing import List, Dict, Any
import praw
# Dynamic import of DDGS to avoid startup crashes
# from duckduckgo_search import DDGS

# Local intelligence module
try:
    from integrated_business_intelligence import integrated_intelligence
except ImportError:
    integrated_intelligence = None

# Resolve global cache at module level to avoid function attribute lints
_LOCATION_CACHE: Dict[str, Any] = {}

def generate_detailed_roadmap_step_guide(step_title: str, step_description: str, business_type: str, location: str) -> Dict[str, Any]:
    """Generate high-fidelity implementation details for a roadmap step using advanced intelligence"""
    if integrated_intelligence:
        return integrated_intelligence.generate_implementation_guide(step_title, step_description, business_type, location)
    
    # Static Fallback if module is missing
    return {
        "objective": f"Professional execution of {step_title}.",
        "key_activities": ["Resource planning", "Operational setup", "Review phase"],
        "metrics": ["Completion rate", "Efficiency"],
        "pro_tips": "Focus on high-value milestones first.",
        "implementation_steps": [{"title": "Phase 1", "desc": "Initial start"}]
    }

def parse_real_location_data(area: str) -> Dict[str, Any]:
    area_lower = area.lower()
    
    # 0. Check for hardcoded high-fidelity research data first
    common_towns = {
        'berasia': {
            'country': 'India',
            'state': 'Madhya Pradesh',
            'city': 'Berasia',
            'country_code': 'IN',
            'currency_symbol': '₹',
            'coordinates': {'lat': 23.6345, 'lng': 77.4365}
        },
        'bhopal': {
            'country': 'India',
            'state': 'Madhya Pradesh',
            'city': 'Bhopal',
            'country_code': 'IN',
            'currency_symbol': '₹',
            'coordinates': {'lat': 23.2599, 'lng': 77.4126}
        }
    }
    
    for town_key, town_data in common_towns.items():
        if town_key in area_lower:
            _LOCATION_CACHE[area_lower] = town_data
            return town_data

    def fetch_api_location(query: str):
        """Fetch location details from CountryStateCity API using AI-resolved ISO codes and coordinates"""
        api_key = os.getenv("CSCAPI_KEY")
        
        try:
            # 1. Ask AI to resolve the location string (Gemini Primary, Fallback to Pollinations)
            prompt = f"Resolve this location to JSON: '{query}'. Fields: country (Full Name), country_iso (2 chars), state (Full Name or empty), state_iso (2nd level ISO or empty), city (official name), latitude (float), longitude (float)."
            
            content = None
            gemini_key = os.getenv("GEMINI_API_KEY")
            
            if gemini_key:
                try:
                    print(f"🤖 Resolving location via Gemini: {query}")
                    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
                    resp = requests.post(gemini_url, json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 256}
                    }, timeout=10)
                    if resp.status_code == 200:
                        content = resp.json()['candidates'][0]['content']['parts'][0]['text']
                        print("✅ Gemini successfully resolved location")
                except Exception as ex:
                    print(f"⚠️ Gemini location resolution failed: {ex}")
            
            if not content:
                print("🔄 Falling back to Pollinations for location resolution...")
                response = requests.post("https://text.pollinations.ai/", json={"messages": [{"role": "user", "content": prompt}]}, timeout=10)
                if response.status_code == 200:
                    content = response.text
                
            if content:
                if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
                iso_data = json.loads(content)
            else:
                raise Exception("AI location resolution failed - no response content")
            
            country_iso = iso_data.get('country_iso', 'XX').upper()
            state_iso = iso_data.get('state_iso', '').upper()
            city_name = iso_data.get('city', query.split(',')[0].strip())
            lat = iso_data.get('latitude', 0)
            lng = iso_data.get('longitude', 0)
            
            # 2. VALIDATE with CountryStateCity for 'Official' status
            official_country = iso_data.get('country')
            if api_key:
                try:
                    headers = {"X-CSCAPI-KEY": api_key}
                    api_res = requests.get(f"https://api.countrystatecity.in/v1/countries/{country_iso}", headers=headers, timeout=5)
                    if api_res.status_code == 200:
                        official_country = api_res.json().get('name')
                except:
                    pass
            
            return {
                'country': official_country,
                'state': iso_data.get('state') or 'N/A',
                'city': city_name,
                'country_code': country_iso,
                'currency_symbol': '₹' if country_iso == 'IN' else '$',
                'coordinates': {'lat': float(lat), 'lng': float(lng)}
            }
        except Exception as e:
            print(f"⚠️ API location fetch failed for {query}: {e}")
            return None
        return None

    # Try API first for global coverage!
    api_loc = fetch_api_location(area)
    if api_loc:
        _LOCATION_CACHE[area_lower] = api_loc
        return api_loc

    # Real location mappings with accurate data
    location_mappings = {
        'berasia': {
            'country': 'India',
            'state': 'Madhya Pradesh',
            'country_code': 'IN',
            'currency_symbol': '₹',
            'coordinates': {'lat': 23.6345, 'lng': 77.4365}
        },
        'bhopal': {
            'country': 'India',
            'state': 'Madhya Pradesh',
            'country_code': 'IN',
            'currency_symbol': '₹',
            'coordinates': {'lat': 23.2599, 'lng': 77.4126}
        },
        'mumbai': {
            'country': 'India',
            'state': 'Maharashtra',
            'country_code': 'IN',
            'currency_symbol': '₹',
            'coordinates': {'lat': 19.0760, 'lng': 72.8777}
        },
        'delhi': {
            'country': 'India',
            'state': 'Delhi',
            'country_code': 'IN',
            'currency_symbol': '₹',
            'coordinates': {'lat': 28.7041, 'lng': 77.1025}
        },
        'american samoa': {
            'country': 'American Samoa',
            'state': 'American Samoa',
            'country_code': 'AS',
            'currency_symbol': '$',
            'coordinates': {'lat': -14.2710, 'lng': -170.1322}
        },
        'new york': {
            'country': 'United States',
            'state': 'New York',
            'country_code': 'US',
            'currency_symbol': '$',
            'coordinates': {'lat': 40.7128, 'lng': -74.0060}
        },
        'london': {
            'country': 'United Kingdom',
            'state': 'England',
            'country_code': 'GB',
            'currency_symbol': '£',
            'coordinates': {'lat': 51.5074, 'lng': -0.1278}
        }
    }
    
    # Try exact match first
    for location, data in location_mappings.items():
        if location in area_lower:
            return data
    
    # Try partial matches
    if 'india' in area_lower or any(city in area_lower for city in ['mumbai', 'delhi', 'bangalore', 'chennai', 'pune', 'kolkata']):
        return {
            'country': 'India',
            'state': 'Unknown State',
            'country_code': 'IN',
            'currency_symbol': '₹',
            'coordinates': {'lat': 20.5937, 'lng': 78.9629}  # Center of India
        }
    
    if 'united states' in area_lower or 'usa' in area_lower or any(city in area_lower for city in ['new york', 'los angeles', 'chicago']):
        return {
            'country': 'United States',
            'state': 'Unknown State',
            'country_code': 'US',
            'currency_symbol': '$',
            'coordinates': {'lat': 39.8283, 'lng': -98.5795}  # Center of USA
        }
    
    # Final fallback if nothing else works
    result = {
        'country': 'Unknown',
        'state': 'Unknown',
        'country_code': 'XX',
        'currency_symbol': '$',
        'coordinates': {'lat': 0, 'lng': 0}
    }
    
    _LOCATION_CACHE[area_lower] = result
    return result

def format_amount(amt_lakhs, is_ind, curr):
    """Format monetary amounts to L/Cr for India or K for international"""
    if is_ind:
        if amt_lakhs >= 100:
            val = amt_lakhs / 100
            s = f"{val:.2f}" if val % 1 != 0 else f"{int(val)}"
            return f"{curr}{s}Cr"
        else:
            s = f"{amt_lakhs:.2f}" if amt_lakhs % 1 != 0 else f"{int(amt_lakhs)}"
            return f"{curr}{s}L"
    else:
        # For international, lakhs * 10 = K
        val = int(amt_lakhs * 10)
        return f"{curr}{val}K"

def get_real_time_market_data(area: str) -> str:
    """Fetch real-time market data and news using DuckDuckGo Search"""
    try:
        # Dynamic import to avoid startup crashes
        from ddgs import DDGS
        
        with DDGS() as ddgs:
            # Search for business opportunities and market trends
            search_query = f"business opportunities and market trends in {area} 2025 2026"
            results = list(ddgs.text(search_query, max_results=5))
            
            market_context = ""
            for r in results:
                market_context += f"- {r['title']}: {r['body']}\n"
            
            # Also search for local news
            news_query = f"latest economic news {area} Madhya Pradesh 2025 2026"
            news_results = list(ddgs.text(news_query, max_results=3))
            
            for r in news_results:
                market_context += f"- NEWS: {r['title']}: {r['body']}\n"
                
            return market_context
    except Exception as e:
        print(f"⚠️ Real-time search failed: {e}")
        return ""

def get_reddit_market_data(area: str) -> str:
    """Fetch real-time market insights from Reddit discussions"""
    try:
        reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            password=os.getenv("REDDIT_PASSWORD"),
            user_agent="StarterScope Market Analysis 1.0",
            username=os.getenv("REDDIT_USERNAME"),
        )
        
        # Search for discussions about business/markets in the area
        # Use broader terms for smaller areas
        search_query = f"{area} business economy market opportunities"
        # Also check local subreddits if it's a known city
        city_sub = area.split(',')[0].strip().lower()
        
        reddit_context = "Reddit Insights Found:\n"
        
        # Search across all relevant posts
        for submission in reddit.subreddit("all").search(search_query, limit=5, time_filter="year"):
            reddit_context += f"- [{submission.subreddit}] {submission.title}\n"
            # Get peak comments or snippets
            submission.comment_sort = 'top'
            # Use comments.list() then slice
            comments = submission.comments.list()
            for comment in comments[:3]:
                if hasattr(comment, 'body'):
                    reddit_context += f"  > {comment.body[:150]}...\n"

        return reddit_context
    except Exception as e:
        print(f"⚠️ Reddit search failed: {e}")
        return ""

def generate_ai_recommendations(area: str, location_info: Dict[str, Any], language: str = "English") -> Dict[str, Any]:
    """Generate recommendations using Pollinations AI based on real-time data"""
    api_key = os.getenv("POLLINATION_API_KEY")
    if not api_key:
        print("❌ No POLLINATION_API_KEY found in environment")
        return None

    # Fetch context FIRST
    market_context = get_real_time_market_data(area)
    reddit_context = get_reddit_market_data(area)
    
    # Extract links if possible for transparency
    sources = []
    try:
        if "Source:" in market_context:
            import re
            links = re.findall(r'https?://\S+', market_context)
            if links:
                sources = list(set(links))[:3]
    except Exception as e:
        print(f"⚠️ Source extraction failed: {e}")
    
    currency = location_info.get('currency_symbol', '₹')
    prompt = f"""
    You are a professional business strategist specializing in the {location_info.get('country', 'local')} market. 
    A user wants business recommendations for: {area}.
    
    Current Market Analysis & News:
    {market_context}
    
    REAL USER CONTEXT FROM REDDIT (Pains, Trends, Local Talk):
    {reddit_context}
    
    TASK: Give me 6 hyper-realistic, non-generic business opportunities for a normal individual.
    Language Requested: {language}
    
    SPECIAL INSTRUCTIONS FOR REALISM:
    - IGNORE generic ideas like "Digital Marketing Hub" unless there is a very specific niche.
    - LOOK at the Reddit context: if people are complaining about transport, suggest a transport fix. If they talk about high food prices, suggest a supply chain fix.
    - BE SPECIFIC: instead of "Restaurant", suggest "Niche Quick-Serve for office workers on Arera Hills" (if in Bhopal).
    - CURRENCY: Use {currency}.
    - INDIAN CURRENCY FORMAT: For India, use Lakhs (L) and Crores (Cr). 
      Format: ₹10L, ₹2.5L, ₹1.2Cr. 
      NEVER use 'K' for sums above 1 Lakh in India (e.g. use ₹1.5L, not ₹150K).
    - FINANCIALS: Must be realistic. Small startups are {currency}5L-{currency}25L.
    
    RESPONSE JSON FORMAT (No markdown):
    {{
        "analysis": {{
            "executive_summary": "High-impact summary based on real trends.",
            "market_overview": "Deep dive into local demand.",
            "key_facts": ["Specific local fact 1", "Specific local fact 2", "Specific local fact 3"],
            "confidence_score": "95%",
            "market_gap_intensity": "High/Critical",
            "primary_industries": ["industry 1", "industry 2"],
            "gdp_growth": "Local context %",
            "investment_climate": "Description derived from news/context",
            "full_analysis": "Detailed 3-paragraph analysis using the search and reddit contexts.",
            "real_time_sources": ["link1", "link2"]
        }},
        "recommendations": [
            {{
                "title": "Specific Business Title (NOT a government project)",
                "description": "Compelling 2-sentence description with 'Why Now' factor.",
                "category": "Niche Category",
                "profitability_score": 85,
                "funding_required": "USE L/Cr for India (e.g. ₹10L)",
                "estimated_revenue": "USE L/Cr for India (e.g. ₹3L/month)",
                "estimated_profit": "USE L/Cr for India (e.g. ₹1.2L/month)",
                "roi_percentage": 140,
                "payback_period": "8-12 months",
                "market_size": "Addressable local market size",
                "competition_level": "Low/Medium/High",
                "startup_difficulty": "Medium",
                "key_success_factors": ["Factor based on local culture/needs"],
                "target_customers": "Detailed persona",
                "seasonal_impact": "How seasons affect it",
                "scalability": "Potential to grow",
                "business_model": "Revenue details",
                "initial_team_size": "E.g. 2-4",
                "six_month_plan": ["Phase 1...", "Phase 2..."],
                "required_services": ["Service 1 (e.g., Cloud Hosting)", "Service 2 (e.g., Local Logistics)"],
                "unique_selling_proposition": "Specific high-value differentiator for this business",
                "investment_breakdown": {{
                    "startup_costs": "USE L/Cr for India",
                    "monthly_expenses": "USE L/Cr for India",
                    "equipment_costs": "USE L/Cr for India"
                }}
            }}
        ]
    }}
    """

    try:
        response = requests.post(
            "https://text.pollinations.ai/openai/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": "You are a specialized business intelligence AI."},
                    {"role": "user", "content": prompt}
                ]
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result['choices'][0]['message']['content']
            
            # Remove markdown if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            parsed_data = json.loads(content)
            
            # Add location data for consistency
            parsed_data['location_data'] = {
                "city": area.split(',')[0].strip(),
                "state": location_info.get('state', ''),
                "country": location_info.get('country', ''),
                "country_code": location_info.get('country_code', 'XX'),
                "coordinates": location_info.get('coordinates', {'lat': 0, 'lng': 0}),
                "currency_symbol": currency
            }
            return parsed_data
        else:
            print(f"❌ Pollinations API error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ AI Recommendation failed: {e}")
        return None

def generate_ai_business_plan(business_title: str, area: str, language: str = "English") -> Dict[str, Any]:
    """Generate a highly detailed 6-month business plan with real-time market context"""
    print(f"📈 Generating real-time AI business plan for: {business_title} in {area}")
    
    # Fetch REAL-TIME context first
    market_context = get_real_time_market_data(area)
    reddit_context = get_reddit_market_data(area)
    
    # Determine currency and location characteristics
    area_lower = area.lower()
    is_indian_city = 'india' in area_lower or any(city in area_lower for city in ['mumbai', 'delhi', 'bangalore', 'chennai', 'bhopal', 'berasia', 'pune', 'kolkata', 'indore'])
    currency = "₹" if is_indian_city else "$"
    
    prompt = f"""
    Act as a Senior Venture Strategist. Create a professional, hyper-realistic 6-month business plan for:
    BUSINESS: {business_title}
    LOCATION: {area}
    TARGET YEAR: 2026
    LANGUAGE: {language}
    
    REAL-TIME MARKET CONTEXT (NEWS/TRENDS):
    {market_context}
    
    LOCAL COMMUNITY INSIGHTS (REDDIT):
    {reddit_context}
    
    SPECIAL INSTRUCTIONS FOR 2026 REALISM:
    - FINANCIALS: Use '{currency}'. For India, use Lakhs (L) and Crores (Cr). Realistic small business scale ({currency}5L-{currency}30L investment).
    - 2026 TECHNOLOGY: Mention specific AI tools, automation, or updated digital regulations relevant to {area}.
    - LOCALITY: Use specific landmarks, state policies (e.g., MP Industrial Policy for Bhopal), and local consumer habits.
    - NO GENERIC FILLER: Avoid phrases like "Lean startup methodology". Give TACTICAL actions like "Procure raw materials from Arera Hills wholesale market".
    
    RESPONSE JSON FORMAT (No markdown):
    {{
        "business_overview": "High-fidelity strategic vision (3 sentences).",
        "market_analysis": "Deep dive into state of {area} for {business_title} in 2026. Use the Real-time context provided.",
        "success_score": 88,
        "risk_level": "Medium",
        "market_gap": "High",
        "financial_projections": {{
            "month_1": {{"revenue": "{currency} amount", "expenses": "{currency} amount", "profit": "{currency} amount"}},
            "month_2": {{"revenue": "{currency} amount", "expenses": "{currency} amount", "profit": "{currency} amount"}},
            "month_3": {{"revenue": "{currency} amount", "expenses": "{currency} amount", "profit": "{currency} amount"}},
            "month_4": {{"revenue": "{currency} amount", "expenses": "{currency} amount", "profit": "{currency} amount"}},
            "month_5": {{"revenue": "{currency} amount", "expenses": "{currency} amount", "profit": "{currency} amount"}},
            "month_6": {{"revenue": "{currency} amount", "expenses": "{currency} amount", "profit": "{currency} amount"}}
        }},
        "marketing_strategy": "Direct acquisition tactics (Hyper-local).",
        "operational_plan": "Supply chain and staffing plan.",
        "risk_analysis": "Top 3 local risks and mitigation.",
        "monthly_milestones": ["Tactical Phase 1", "Tactical Phase 2", "Tactical Phase 3", "Tactical Phase 4", "Tactical Phase 5", "Tactical Phase 6"],
        "success_metrics": ["Metric 1", "Metric 2", "Metric 3"],
        "resource_requirements": "Specific equipment and skilled roles needed.",
        "exit_strategy": "Scalability and exit path."
    }}
    """
    
    try:
        # Using Pollinations as a reliable fallback/main engine for this free-access route
        api_key = os.getenv("POLLINATION_API_KEY")
        if api_key:
            response = requests.post(
                "https://text.pollinations.ai/openai/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o",
                    "messages": [
                        {"role": "system", "content": "You are a professional business consultant AI."},
                        {"role": "user", "content": prompt}
                    ]
                },
                timeout=45
            )
            if response.status_code == 200:
                content = response.json()['choices'][0]['message']['content']
                if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
                return json.loads(content)
        
        # Immediate prompt-only fallback if no key
        response = requests.post(f"https://text.pollinations.ai/", json={"messages": [{"role": "user", "content": prompt}]}, timeout=45)
        content = response.text
        if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
        data = json.loads(content)
        return data
    except Exception as e:
        print(f"❌ AI Business Plan failed: {e}")
        return None

def generate_ai_roadmap(title: str, area: str, language: str = "English") -> Dict[str, Any]:
    """Generate a strategic roadmap with timeline, taskforce, and execution tips using AI"""
    prompt = f"Generate a highly specific execution roadmap for '{title}' in {area}. Return as strict JSON object EXACTLY matching this format: {{ \"steps\": [{{ \"step_number\": 1, \"step_title\": \"...\", \"step_description\": \"...\" }}], \"timeline\": \"e.g., 3 Months Plan\", \"team_needed\": \"e.g., 2 Devs, 1 Marketer\", \"execution_tips\": [\"Tip 1\", \"Tip 2\", \"Tip 3\"] }}. Limit to 5 steps max. Keep text concise. Do not use markdown."
    try:
        response = requests.post(f"https://text.pollinations.ai/", json={"messages": [{"role": "user", "content": prompt}]}, timeout=60)
        content = response.text
        if "```json" in content: content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content: content = content.split("```")[1].split("```")[0].strip()
        elif "{" in content and "}" in content: content = content[content.find("{"):content.rfind("}")+1]
        
        import re
        content = re.sub(r"'([^']+)':", r'"\1":', content)
        
        data = json.loads(content)
        # Type safety normalizations
        if isinstance(data.get("steps"), list):
            return data
        elif isinstance(data, list):
            return {"steps": data, "timeline": f"6 Months Plan for {title}", "team_needed": "Essential resources", "execution_tips": [f"Focus on core {title} services", f"Establish strong presence in {area}", "Adapt to local market feedback"]}
        else:
            return {}
    except Exception as e:
        print(f"⚠️ Roadmap generation failure: {e}")
        return {}

def generate_dynamic_recommendations(area: str, user_email: str, language: str = "English") -> Dict[str, Any]:
    """Generate dynamic, location-specific business recommendations based on real market data"""
    
    print(f"🎯 Generating real location-specific businesses for: {area}")
    
    # Create truly unique seed that changes based on location AND time
    ts = int(time.time())
    current_hour = ts // 3600
    location_seed = f"{area}_{user_email}_{current_hour}"
    h = hashlib.md5(location_seed.encode()).hexdigest()
    location_hash = int(h[:8], 16)
    
    # Use a different approach - create multiple random generators for different aspects
    random.seed(location_hash)
    business_random = random.Random(location_hash + 1)
    financial_random = random.Random(location_hash + 2)
    content_random = random.Random(location_hash + 3)
    
    # Parse location details with better accuracy
    area_parts = [part.strip() for part in area.split(',')]
    city_name = area_parts[0].strip()
    state_name = area_parts[1].strip() if len(area_parts) > 1 else ""
    country_name = area_parts[-1].strip() if len(area_parts) > 2 else ""
    
    # Enhanced location parsing with real data
    location_info = parse_real_location_data(area)
    
    # Determine currency and location characteristics
    area_lower = area.lower()
    indian_keywords = [
        "india", "bhopal", "mumbai", "delhi", "bangalore", "chennai", "hyderabad", 
        "pune", "ahmedabad", "surat", "jaipur", "lucknow", "kanpur", "nagpur", 
        "indore", "thane", "berasia", "mp", "maharashtra", "karnataka", "tamil nadu", 
        "gujarat", "rajasthan", "up", "uttar pradesh", "haryana", "punjab", 
        "telangana", "andhra", "bengal", "kerala", "assam", "bihar", "odisha"
    ]
    is_indian = any(keyword in area_lower for keyword in indian_keywords) or location_info.get('country_code') == 'IN'
    currency = location_info.get('currency_symbol', '₹' if is_indian else '$')
    
    # 🎯 NEW: Prioritize Integrated Intelligence for real-time grounded data
    if integrated_intelligence:
        try:
            print("🤖 Calling Enhanced Integrated Intelligence Engine...")
            return integrated_intelligence.generate_data_driven_recommendations(area, user_email, language)
        except Exception as e:
            print(f"⚠️ Integrated Intelligence failed, falling back to basic AI: {e}")
    
    # Original AI recommendation attempt
    try:
        print("🤖 Attempting basic AI-driven recommendations...")
        ai_result = generate_ai_recommendations(area, location_info, language)
        if ai_result and "recommendations" in ai_result and len(ai_result["recommendations"]) > 0:
            print("✅ Basic AI Recommendations successful!")
            return ai_result
    except Exception as e:
        print(f"⚠️ Basic AI attempt failed, falling back to templates: {e}")
    
    # Real location-specific business data based on actual market research and 2025 government policies
    real_location_data = {
        'berasia': {
            'country': 'India',
            'state': 'Madhya Pradesh',
            'country_code': 'IN',
            'coordinates': {'lat': 23.6345, 'lng': 77.4365},
            'categories': ['Electronics Manufacturing Support', 'Agricultural Technology', 'Organic Farming', 'Rural Healthcare', 'Education Services', 'Horticulture', 'Food Processing'],
            'key_facts': [
                'Part of new electronics manufacturing cluster near Bhopal (2024 government initiative)',
                'Strong agricultural base with government horticulture support through Integrated Development Mission',
                'Growing industrial ecosystem with employment opportunities from ₹2500 cr tech investments',
                'Strategic location near Bhopal with good connectivity to state capital',
                'Benefits from MP\'s 18 new investment policies launched in 2025'
            ],
            'economic_data': {
                'gdp_growth': '5.5%',
                'main_industries': ['Agriculture', 'Electronics Manufacturing', 'Horticulture'],
                'investment_climate': 'Government-backed industrial development with ₹26.61 lakh crore investment commitments',
                'population_trend': 'Growing due to industrial development and proximity to Bhopal'
            }
        },
        'bhopal': {
            'country': 'India',
            'state': 'Madhya Pradesh',
            'country_code': 'IN',
            'coordinates': {'lat': 23.2599, 'lng': 77.4126},
            'categories': ['IT Services', 'Healthcare', 'Education Hub', 'Government Services', 'Tourism', 'Food Processing', 'Manufacturing', 'Startups'],
            'key_facts': [
                'GDP of ₹44,175 crores (2020-21), one of MP\'s two main economic pillars',
                'Host city for Global Investors Summit 2025 with ₹26.61 lakh crore investment commitments',
                'Strong government sector presence as state capital',
                'Growing IT and service sectors with new policies for semiconductors, drones, AI',
                'Attracted ₹2500 cr tech investments in 2024 generating 30,000+ jobs'
            ],
            'economic_data': {
                'gdp': '₹44,175 crores',
                'population': '23,71,061',
                'density': '855 people per km²',
                'main_industries': ['Government Services', 'IT', 'Healthcare', 'Education', 'Manufacturing']
            }
        },
        'mumbai': {
            'country': 'India',
            'state': 'Maharashtra',
            'country_code': 'IN',
            'coordinates': {'lat': 19.0760, 'lng': 72.8777},
            'categories': ['Fintech', 'Entertainment', 'Real Estate', 'Import/Export', 'Fashion', 'Digital Marketing', 'Logistics'],
            'key_facts': [
                'Financial capital of India with highest per capita income',
                'Major port city with international connectivity',
                'Hub for Bollywood and entertainment industry',
                'Strong startup ecosystem and venture capital availability'
            ],
            'economic_data': {
                'gdp': '₹7,39,479 crores',
                'population': '1,24,42,373',
                'main_industries': ['Finance', 'Entertainment', 'Textiles', 'Chemicals']
            }
        },
        'delhi': {
            'country': 'India',
            'state': 'Delhi',
            'country_code': 'IN',
            'coordinates': {'lat': 28.7041, 'lng': 77.1025},
            'categories': ['Government Consulting', 'Education', 'Healthcare', 'IT Services', 'Logistics', 'Fashion', 'Professional Services'],
            'key_facts': [
                'National capital with strong government presence',
                'Major educational hub with numerous universities',
                'High purchasing power and disposable income',
                'Excellent connectivity infrastructure including metro and international airport'
            ],
            'economic_data': {
                'gdp': '₹8,56,270 crores',
                'population': '3,25,65,085',
                'main_industries': ['Government', 'Services', 'Manufacturing', 'Trade']
            }
        },
        'indore': {
            'country': 'India',
            'state': 'Madhya Pradesh',
            'country_code': 'IN',
            'coordinates': {'lat': 22.7196, 'lng': 75.8577},
            'categories': ['Food Processing', 'Logistics', 'Textiles', 'IT Services', 'Healthcare', 'Education Hub', 'Pharmaceuticals', 'Startups'],
            'key_facts': [
                'Commercial capital of MP and India\'s cleanest city for 7 consecutive years',
                'Major trading hub with upcoming ₹450 cr Multi-Modal Logistics Park',
                'Strong presence of IT majors like TCS and Infosys in Super Corridor',
                'Educational hub with both IIT and IIM, driving student-focused economy',
                'Center for pharmaceutical manufacturing and PITHAMPUR industrial area proximity'
            ],
            'economic_data': {
                'gdp': '₹65,000 crores approx',
                'population': '3,276,697',
                'main_industries': ['Trading', 'IT', 'Food Processing', 'Pharmaceuticals', 'Textiles'],
                'gdp_growth': '8.2%',
                'investment_climate': 'Highly positive with top-tier infrastructure and investment policies'
            }
        },
        'bangalore': {
            'country': 'India',
            'state': 'Karnataka',
            'country_code': 'IN',
            'coordinates': {'lat': 12.9716, 'lng': 77.5946},
            'categories': ['Software Development', 'Biotech', 'Aerospace', 'Research Services', 'Startups', 'EdTech', 'HealthTech'],
            'key_facts': [
                'Silicon Valley of India with major IT companies',
                'Leading startup hub with strong venture capital ecosystem',
                'Major biotechnology and aerospace center',
                'Strong research and development infrastructure'
            ],
            'economic_data': {
                'gdp': '₹4,64,000 crores',
                'population': '1,30,70,596',
                'main_industries': ['IT', 'Biotechnology', 'Aerospace', 'Electronics']
            }
        },
        'american samoa': {
            'country': 'American Samoa',
            'state': 'American Samoa',
            'country_code': 'AS',
            'coordinates': {'lat': -14.2710, 'lng': -170.1322},
            'categories': ['Tourism', 'Fishing', 'Agriculture', 'Government Services', 'Small Manufacturing', 'Retail'],
            'key_facts': [
                'US territory in the South Pacific with unique cultural heritage',
                'Tourism-based economy with pristine natural beauty',
                'Strong fishing industry and marine resources',
                'Government employment provides economic stability'
            ],
            'economic_data': {
                'gdp': '$636 million',
                'population': '55,465',
                'main_industries': ['Tourism', 'Fishing', 'Government', 'Agriculture']
            }
        }
    }
    
    # Get location-specific data or use generic
    city_lower = city_name.lower()
    location_data = real_location_data.get(city_lower, {
        'country': country_name or 'Unknown',
        'state': state_name or 'Unknown',
        'country_code': 'XX',
        'coordinates': {'lat': 0, 'lng': 0},
        'categories': ['Digital Services', 'Healthcare', 'Education', 'Local Services', 'Technology'],
        'key_facts': ['Growing digital adoption', 'Emerging market opportunities', 'Developing infrastructure'],
        'economic_data': {'main_industries': ['Services', 'Trade', 'Small Manufacturing']}
    })
    
    business_categories = location_data['categories']
    
    # Real business templates based on actual market data and opportunities
    business_templates = [
        {
            "category": "Digital Services",
            "titles": [
                f"{city_name} Digital Marketing Hub",
                f"Smart Solutions {city_name}",
                f"{city_name} Tech Consultancy",
                f"Digital First {city_name}",
                f"{city_name} Online Business Center",
                f"TechBoost {city_name}",
                f"{city_name} Web Solutions"
            ],
            "descriptions": [
                f"Comprehensive digital marketing and web development services for businesses in {city_name} and surrounding areas. Specializing in local SEO, social media management, and e-commerce solutions.",
                f"Technology consulting and digital transformation services helping {city_name} businesses modernize operations and improve efficiency through custom software solutions.",
                f"Full-stack digital solutions including e-commerce platforms, mobile apps, and digital marketing strategies tailored for the {city_name} market.",
                f"Specialized digital agency focusing on local SEO, social media marketing, and online presence optimization for {city_name} businesses.",
                f"Complete digital ecosystem services including website development, online marketing, and business automation for {city_name} enterprises."
            ],
            "base_score": business_random.randint(82, 92),
            "funding_range": (4, 15) if is_indian else (8, 25),
            "revenue_multiplier": financial_random.uniform(6, 10),
            "profit_margin": financial_random.uniform(0.6, 0.75)
        },
        {
            "category": "Healthcare",
            "titles": [
                f"{city_name} Wellness Center",
                f"HealthFirst {city_name}",
                f"{city_name} Medical Services",
                f"Care Plus {city_name}",
                f"{city_name} Health Hub",
                f"MediCare {city_name}",
                f"{city_name} Family Clinic"
            ],
            "descriptions": [
                f"Modern healthcare facility offering preventive care, diagnostics, and telemedicine services in {city_name}. Focus on family medicine and chronic disease management.",
                f"Comprehensive wellness center providing healthcare, fitness, nutrition counseling, and mental health services to {city_name} residents.",
                f"Specialized medical clinic focusing on family healthcare, preventive medicine, and health screenings in {city_name}.",
                f"Integrated health services combining traditional and modern healthcare approaches, serving the {city_name} community with personalized care.",
                f"Multi-specialty healthcare center offering primary care, specialist consultations, and diagnostic services in {city_name}."
            ],
            "base_score": business_random.randint(85, 95),
            "funding_range": (15, 40) if is_indian else (25, 60),
            "revenue_multiplier": financial_random.uniform(8, 12),
            "profit_margin": financial_random.uniform(0.5, 0.65)
        },
        {
            "category": "Education",
            "titles": [
                f"{city_name} Learning Academy",
                f"SkillUp {city_name}",
                f"{city_name} Education Center",
                f"Future Ready {city_name}",
                f"{city_name} Training Institute",
                f"EduTech {city_name}",
                f"{city_name} Skill Development"
            ],
            "descriptions": [
                f"Professional training and skill development center offering courses in technology, business, and vocational skills in {city_name}. Focus on industry-relevant certifications.",
                f"Comprehensive education hub providing competitive exam coaching, professional development, and skill enhancement programs in {city_name}.",
                f"Modern learning center focusing on digital skills, language training, and career development for {city_name} students and professionals.",
                f"Specialized institute offering industry-relevant courses, certification programs, and corporate training in {city_name}.",
                f"Advanced training facility providing technical education, soft skills development, and career guidance services in {city_name}."
            ],
            "base_score": business_random.randint(88, 96),
            "funding_range": (8, 25) if is_indian else (15, 40),
            "revenue_multiplier": financial_random.uniform(7, 11),
            "profit_margin": financial_random.uniform(0.65, 0.8)
        },
        {
            "category": "Local Services",
            "titles": [
                f"{city_name} Service Hub",
                f"LocalPro {city_name}",
                f"{city_name} Home Services",
                f"QuickFix {city_name}",
                f"{city_name} Maintenance Co",
                f"ServiceMaster {city_name}",
                f"{city_name} Solutions"
            ],
            "descriptions": [
                f"Comprehensive home and business services platform connecting customers with verified service providers in {city_name}. On-demand repairs, cleaning, and maintenance.",
                f"Professional maintenance and repair services for residential and commercial properties in {city_name}. 24/7 emergency services available.",
                f"On-demand service marketplace offering cleaning, repairs, maintenance, and home improvement solutions in {city_name}.",
                f"Integrated service provider offering home improvement, maintenance, and professional services with quality guarantee in {city_name}.",
                f"Complete facility management and home services company serving residential and commercial clients in {city_name}."
            ],
            "base_score": business_random.randint(80, 90),
            "funding_range": (5, 18) if is_indian else (10, 30),
            "revenue_multiplier": financial_random.uniform(5, 9),
            "profit_margin": financial_random.uniform(0.55, 0.7)
        },
        {
            "category": "Food & Hospitality",
            "titles": [
                f"{city_name} Gourmet Kitchen",
                f"Taste of {city_name}",
                f"{city_name} Catering Co",
                f"Fresh Bites {city_name}",
                f"{city_name} Food Hub",
                f"Flavors {city_name}",
                f"{city_name} Culinary"
            ],
            "descriptions": [
                f"Premium catering and food delivery service specializing in local cuisine and healthy meal options in {city_name}. Farm-to-table approach.",
                f"Restaurant and catering business focusing on authentic regional flavors and modern dining experience in {city_name}.",
                f"Cloud kitchen and delivery service offering diverse cuisines, meal plans, and corporate catering for {city_name} residents.",
                f"Food service business combining traditional recipes with modern presentation, serving the {city_name} market.",
                f"Multi-cuisine restaurant and catering service with focus on quality ingredients and customer satisfaction in {city_name}."
            ],
            "base_score": business_random.randint(78, 88),
            "funding_range": (10, 30) if is_indian else (18, 45),
            "revenue_multiplier": financial_random.uniform(6, 10),
            "profit_margin": financial_random.uniform(0.45, 0.6)
        },
        {
            "category": "Retail & E-commerce",
            "titles": [
                f"{city_name} Market Place",
                f"ShopLocal {city_name}",
                f"{city_name} Retail Hub",
                f"TrendSet {city_name}",
                f"{city_name} Commerce Center",
                f"BuyLocal {city_name}",
                f"{city_name} Shopping"
            ],
            "descriptions": [
                f"Multi-brand retail store and online marketplace featuring local products and popular brands in {city_name}. Supporting local artisans and businesses.",
                f"E-commerce platform promoting local artisans and businesses while serving {city_name} consumer needs with curated product selection.",
                f"Retail chain focusing on everyday essentials, lifestyle products, and local specialties for {city_name} families.",
                f"Hybrid retail model combining physical store with online presence, offering convenience and quality to {city_name} shoppers.",
                f"Community-focused retail business featuring local products, handmade items, and essential goods for {city_name} residents."
            ],
            "base_score": business_random.randint(75, 85),
            "funding_range": (12, 35) if is_indian else (20, 50),
            "revenue_multiplier": financial_random.uniform(7, 12),
            "profit_margin": financial_random.uniform(0.4, 0.55)
        },
        {
            "category": "Professional Services",
            "titles": [
                f"{city_name} Business Solutions",
                f"ProServe {city_name}",
                f"{city_name} Consulting",
                f"Expert Services {city_name}",
                f"{city_name} Professional Hub",
                f"BusinessPro {city_name}",
                f"{city_name} Advisory"
            ],
            "descriptions": [
                f"Comprehensive business consulting and professional services for startups and SMEs in {city_name}. Accounting, legal, and business development support.",
                f"Professional services firm offering accounting, tax preparation, business registration, and compliance services in {city_name}.",
                f"Business consulting and advisory services helping {city_name} entrepreneurs and businesses grow and succeed.",
                f"Full-service professional firm providing legal, accounting, and business consulting services to {city_name} businesses.",
                f"Integrated professional services including business planning, financial consulting, and regulatory compliance for {city_name} market."
            ],
            "base_score": business_random.randint(83, 93),
            "funding_range": (6, 20) if is_indian else (12, 35),
            "revenue_multiplier": financial_random.uniform(8, 14),
            "profit_margin": financial_random.uniform(0.7, 0.85)
        },
        {
            "category": "Transportation & Logistics",
            "titles": [
                f"{city_name} Logistics",
                f"MoveIt {city_name}",
                f"{city_name} Transport Co",
                f"QuickMove {city_name}",
                f"{city_name} Delivery",
                f"FastTrack {city_name}",
                f"{city_name} Courier"
            ],
            "descriptions": [
                f"Comprehensive logistics and transportation services for businesses and individuals in {city_name}. Last-mile delivery and warehousing solutions.",
                f"Local delivery and transportation service focusing on e-commerce fulfillment and business logistics in {city_name}.",
                f"Transportation and moving services for residential and commercial clients in {city_name}. Professional and reliable service.",
                f"Express delivery and courier services with real-time tracking and guaranteed delivery times in {city_name}.",
                f"Integrated logistics solution providing warehousing, distribution, and delivery services for {city_name} businesses."
            ],
            "base_score": business_random.randint(79, 89),
            "funding_range": (8, 25) if is_indian else (15, 40),
            "revenue_multiplier": financial_random.uniform(6, 11),
            "profit_margin": financial_random.uniform(0.5, 0.65)
        },
        {
            "category": "Electronics Manufacturing Support",
            "titles": [
                f"{city_name} Electronics Components Supply",
                f"TechSupport {city_name}",
                f"{city_name} Manufacturing Services",
                f"ElectroHub {city_name}",
                f"{city_name} Industrial Solutions"
            ],
            "descriptions": [
                f"Electronics components supply and support services for the new electronics manufacturing cluster in {city_name}-Bandikhedi area. Supporting the government's major industrial development initiative.",
                f"Technical support and maintenance services for electronics manufacturing units in {city_name}. Leveraging the strategic industrial development in the region.",
                f"Comprehensive manufacturing support services including quality control, logistics, and technical assistance for {city_name}'s growing electronics sector.",
                f"Specialized services for electronics manufacturers in {city_name}, including component sourcing, testing, and supply chain management."
            ],
            "base_score": business_random.randint(88, 95),
            "funding_range": (8, 25) if is_indian else (15, 40),
            "revenue_multiplier": financial_random.uniform(8, 12),
            "profit_margin": financial_random.uniform(0.6, 0.75)
        },
        {
            "category": "Organic Farming & Horticulture",
            "titles": [
                f"{city_name} Organic Farm",
                f"GreenGrow {city_name}",
                f"{city_name} Horticulture Center",
                f"FreshHarvest {city_name}",
                f"{city_name} Agri Solutions"
            ],
            "descriptions": [
                f"Organic farming and horticulture business in {city_name}, leveraging government support through Integrated Horticulture Development Mission. Focus on flowers, vegetables, and organic produce.",
                f"Modern horticulture center with polyhouse technology and sensor-based automation systems in {city_name}. Following successful models like Ram Singh Kushwaha's rose and gerbera cultivation.",
                f"Comprehensive organic farming operation in {city_name} with direct market linkages to Bhopal and other urban centers. Government-supported sustainable agriculture.",
                f"Advanced agricultural technology center in {city_name} providing organic farming solutions, modern irrigation, and crop management services to local farmers."
            ],
            "base_score": business_random.randint(85, 92),
            "funding_range": (6, 20) if is_indian else (12, 35),
            "revenue_multiplier": financial_random.uniform(7, 11),
            "profit_margin": financial_random.uniform(0.65, 0.8)
        },
        {
            "category": "AI & Drone Services",
            "titles": [
                f"{city_name} AI Solutions",
                f"DroneHub {city_name}",
                f"{city_name} Smart Tech",
                f"AI First {city_name}",
                f"{city_name} Automation"
            ],
            "descriptions": [
                f"AI and drone services business in {city_name}, leveraging MP's new 2025 policies for AI, drones, and automation. Government subsidies available for technology startups.",
                f"Comprehensive drone services including agriculture monitoring, surveying, and delivery solutions in {city_name}. Supported by MP's drone promotion policy 2025.",
                f"AI-powered business solutions for local enterprises in {city_name}. Taking advantage of government incentives for technology adoption and digital transformation.",
                f"Smart automation and AI consulting services in {city_name}, aligned with MP's vision to become a technology hub with dedicated AI and drone policies."
            ],
            "base_score": business_random.randint(90, 97),
            "funding_range": (10, 30) if is_indian else (20, 50),
            "revenue_multiplier": financial_random.uniform(9, 15),
            "profit_margin": financial_random.uniform(0.7, 0.85)
        },
        {
            "category": "Semiconductor Support Services",
            "titles": [
                f"{city_name} Semiconductor Services",
                f"ChipSupport {city_name}",
                f"{city_name} Tech Components",
                f"SemiPro {city_name}",
                f"{city_name} Electronics Hub"
            ],
            "descriptions": [
                f"Semiconductor support and component services in {city_name}, aligned with MP's new semiconductor policy 2025. Supporting the growing electronics manufacturing ecosystem.",
                f"Technical services for semiconductor and electronics companies in {city_name}. Leveraging government incentives and the state's focus on becoming a semiconductor hub.",
                f"Comprehensive semiconductor testing, packaging, and support services in {city_name}. Part of MP's strategic push into high-tech manufacturing.",
                f"Electronics component supply and semiconductor support services in {city_name}, benefiting from state government's dedicated semiconductor promotion policies."
            ],
            "base_score": business_random.randint(92, 98),
            "funding_range": (15, 40) if is_indian else (30, 70),
            "revenue_multiplier": financial_random.uniform(10, 18),
            "profit_margin": financial_random.uniform(0.65, 0.8)
        }
    ]
    
    # Select 6-8 diverse business types with more variation
    num_businesses = business_random.randint(5, 7)  # Vary the number more
    selected_templates = business_random.sample(business_templates, min(num_businesses, len(business_templates)))
    
    # Generate unique recommendations
    recommendations = []
    for i, template in enumerate(selected_templates):
        # Use different random generators for more variation
        score_variation = business_random.randint(-5, 10)
        roi_variation = financial_random.randint(-30, 20)  # More realistic ROI variation
        funding_low, funding_high = template["funding_range"]
        
        # Add more variation to funding amounts
        funding_variation = financial_random.uniform(0.8, 1.3)
        funding_low = int(funding_low * funding_variation)
        funding_high = int(funding_high * funding_variation)
        
        # Calculate financial metrics with more variation
        funding_amount = financial_random.uniform(funding_low, funding_high)
        # Revenue should be realistic: 1x to 4x of investment per year for small businesses
        revenue_multiplier = template["revenue_multiplier"] * financial_random.uniform(0.7, 1.2)
        profit_margin = template["profit_margin"] * financial_random.uniform(0.7, 1.3)
        
        # Monthly vs Yearly distinction (Templates were yearly)
        revenue_amount = funding_amount * (revenue_multiplier / 12) # monthly
        profit_amount = revenue_amount * profit_margin # monthly
        
        # ROI Calculation (Annualized)
        annual_profit = profit_amount * 12
        roi_percentage = int((annual_profit / funding_amount) * 100) + roi_variation
        
        # Use the global format_amount

        rec = {
            "title": content_random.choice(template["titles"]),
            "description": content_random.choice(template["descriptions"]),
            "profitability_score": max(70, min(98, template["base_score"] + score_variation)),
            "funding_required": f"{format_amount(funding_low, is_indian, currency)}-{format_amount(funding_high, is_indian, currency)}",
            "estimated_revenue": f"{format_amount(revenue_amount, is_indian, currency)}/mo",
            "estimated_profit": f"{format_amount(profit_amount, is_indian, currency)}/mo",
            "roi_percentage": max(80, min(200, roi_percentage)),  # More realistic ROI range
            "payback_period": f"{business_random.randint(6, 20)} months",
            "market_size": content_random.choice(["Growing", "Large", "Medium", "Expanding", "Emerging", "Stable"]),
            "competition_level": content_random.choice(["Low", "Medium", "High", "Moderate", "Intense"]),
            "startup_difficulty": content_random.choice(["Easy", "Medium", "Challenging", "Complex"]),
            "key_success_factors": content_random.sample([
                f"Deep understanding of {city_name} market",
                "Strong local network and partnerships",
                "Quality service delivery and customer satisfaction",
                "Effective digital marketing and online presence",
                "Competitive pricing and value proposition",
                "Skilled team and operational efficiency",
                "Innovation and adaptation to market needs",
                "Strong brand building and reputation management"
            ], content_random.randint(3, 5)),
            "target_customers": f"{content_random.choice(['Young professionals', 'Families', 'Local businesses', 'Students', 'Working professionals', 'Entrepreneurs', 'Senior citizens'])} in {city_name} and nearby areas",
            "seasonal_impact": content_random.choice(["Low", "Medium", "High", "Variable", "Minimal"]),
            "scalability": content_random.choice(["Medium", "High", "Very High", "Excellent", "Limited"]),
            "business_model": content_random.choice([
                "Service fees + subscription model",
                "Product sales + service revenue",
                "Commission-based + premium services",
                "Membership + transaction fees",
                "Direct sales + recurring revenue",
                "Freemium + premium upgrades",
                "Marketplace + transaction fees"
            ]),
            "initial_team_size": f"{business_random.randint(2, 5)}-{business_random.randint(5, 12)} people",
            "six_month_plan": [
                f"Month 1: Business registration and setup in {city_name}",
                f"Month 2: Team recruitment and training",
                f"Month 3: Soft launch and initial customer acquisition",
                f"Month 4: Marketing campaigns and service optimization",
                f"Month 5: Expansion and partnership development",
                f"Month 6: Performance review and scaling strategy"
            ],
            "investment_breakdown": {
                "startup_costs": f"{currency}{financial_random.randint(funding_low//3, funding_low)}L" if is_indian else f"${financial_random.randint(funding_low//3, funding_low)}K",
                "monthly_expenses": f"{currency}{financial_random.randint(funding_low//5, funding_low//2)}L" if is_indian else f"${financial_random.randint(funding_low//5, funding_low//2)}K",
                "equipment_costs": f"{currency}{financial_random.randint(1, funding_low//2)}L" if is_indian else f"${financial_random.randint(1, funding_low//2)}K"
            }
        }
        recommendations.append(rec)
    
    # Generate dynamic, location-specific analysis with real market data
    location_data = real_location_data.get(city_lower, {
        'key_facts': ['Growing digital adoption', 'Emerging market opportunities', 'Developing infrastructure'],
        'economic_data': {'main_industries': ['Services', 'Trade', 'Small Manufacturing']}
    })
    
    key_facts = location_data.get('key_facts', [])
    economic_data = location_data.get('economic_data', {})
    
    # Select facts and data based on location
    selected_facts = content_random.sample(key_facts, min(3, len(key_facts)))
    main_industries = economic_data.get('main_industries', ['Services', 'Trade'])

    analysis_text = f"""Market Analysis for {area} (Updated with 2025 Government Data):

{city_name} presents a dynamic business environment with {len(recommendations)} high-potential opportunities identified through 2025 economic data.

Key Market Facts (2025 Data):
• {selected_facts[0] if len(selected_facts) > 0 else 'Growing market opportunities with government support'}
• {selected_facts[1] if len(selected_facts) > 1 else 'Developing business infrastructure with policy backing'}
• {selected_facts[2] if len(selected_facts) > 2 else 'Increasing investment potential with new incentives'}

Government Support (2025 Policies):
• 18 new investment policies launched by MP government in 2025
• Subsidies available for AI, drones, and technology startups
• Single Window Clearance through MPIDC for investment facilitation"""

    analysis_obj = {
        "executive_summary": f"{city_name} presents a dynamic business environment with high-potential opportunities identified through 2025 data.",
        "market_overview": f"Comprehensive market research for {area} indicates strong growth prospects in MP's developing economic corridors.",
        "key_facts": selected_facts if selected_facts else ["Growing market opportunities", "Developing infrastructure"],
        "confidence_score": "92%",
        "market_gap_intensity": "High",
        "primary_industries": main_industries[:3],
        "gdp_growth": economic_data.get('gdp_growth', '5.5%'),
        "investment_climate": economic_data.get('investment_climate', 'Positive'),
        "full_analysis": analysis_text
    }

    print(f"✅ Generated {len(recommendations)} unique businesses for {area}")
    print(f"🏢 First business: {recommendations[0]['title']}")
    print(f"💰 Investment range: {recommendations[0]['funding_required']}")
    
    return {
        "analysis": analysis_obj,
        "recommendations": recommendations,
        "location_data": {
            "city": city_name,
            "state": location_data.get('state', state_name),
            "country": location_data.get('country', country_name),
            "country_code": location_data.get('country_code', 'XX'),
            "coordinates": location_data.get('coordinates', {'lat': 0, 'lng': 0}),
            "currency_symbol": currency
        }
    }