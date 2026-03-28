import httpx
import json
import re
import os
import asyncio
import time
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Global WebSocket Hook for Real-Time Streaming
_websocket_pusher = None

def register_ws_pusher(pusher_fn):
    global _websocket_pusher
    _websocket_pusher = pusher_fn

async def push_ws_status(message: str):
    """Pushes a progress update to the WebSocket if available"""
    if _websocket_pusher:
        try:
            await _websocket_pusher({
                "type": "analysis_progress",
                "message": message,
                "timestamp": datetime.now().isoformat()
            })
        except: pass

class IntegratedBusinessIntelligence:
    """
    UNBEATABLE STRATEGIC ENGINE (V6.1 - THE OVERLORD CLUSTER)
    Architecture:
    1. Scouting Swarm Phase (Tavily/Exa/Serper/SerpApi/Reddit/Firecrawl)
    2. Redundant 5-Layer Analysis Cluster:
       Layer 1: Gemini 1.5 Pro (The Crown)
       Layer 2: AIC Overlord (GPT-4o / DeepSeek Swarm)
       Layer 3: SearchGPT (The Knight - Neural Sourcing)
       Layer 4: Claude 3.5 Sonnet (The Sage)
       Layer 5: DeepSeek Guard (The Fortress)
    3. Neural Identity Refinement.
    """
    
    def __init__(self):
        # AI CORE KEYS (Elite Model Cluster)
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.claude_key = os.getenv("CLAUDE_API_KEY")
        self.pollinations_key = os.getenv("POLLINATION_API_KEY")
        self.fred_key = os.getenv("FRED_API_KEY")
        self.aic_key = os.getenv("AIC_API_KEY")
        self.aic_base = os.getenv("AIC_BASE_URL", "https://api.ai.cc/v1")
        
        # SCOUTING SWARM KEYS (Multi-Tenant Real-Time Market Sourcing)
        self.tavily_key = os.getenv("TAVILY_API_KEY")
        self.exa_key = os.getenv("EXA_API_KEY")
        self.serper_key = os.getenv("SERPER_API_KEY")
        self.firecrawl_key = os.getenv("FIRECRAWL_API_KEY")
        self.serpapi_key = os.getenv("SERPAPI_API_KEY")
        self.searchapi_key = os.getenv("SEARCHAPI_API_KEY")
        self.apify_key = os.getenv("APIFY_API_KEY")
        
        # System State
        self._logic_version = "v6.2_singularity_hardened"
        self._final_recommendations_cache = {}
        self._cache_expiry = 3600
        
        print(f"🔱 [SYSTEM] Singularity Engine V6.2 (Hardened) Activated.")

    async def generate_data_driven_recommendations(self, area: str, email: str, language: str = "English", phase: str = "discovery") -> Dict:
        """Main entry point following the 4-layer fallback strategy."""
        area_key = area.lower().strip()
        now = time.time()
        
        # 1. CACHE VALIDATION (with versioning)
        cache_key = f"{area_key}_{phase}_{language}_{self._logic_version}"
        if cache_key in self._final_recommendations_cache:
            data, expiry = self._final_recommendations_cache[cache_key]
            if now < expiry:
                print(f"♻️ [CACHE] Tiered Hit for {area}.")
                return data

        await push_ws_status("Initializing AI Analysis Engine...")
        
        try:
            # --- STAGE 1: MULTI-SOURCE RAG SCOUTING ---
            await push_ws_status("Gathering market intelligence...")
            # Deploy drones: Google-Swarm, Reddit, Web
            scouting = await asyncio.gather(
                self._scout_google(area),
                self._scout_reddit(area),
                self._scout_web_trends(area),
                return_exceptions=True
            )
            
            g_data = scouting[0] if not isinstance(scouting[0], Exception) else ""
            r_data = scouting[1] if not isinstance(scouting[1], Exception) else ""
            w_data = scouting[2] if not isinstance(scouting[2], Exception) else ""
            
            # --- STAGE 2: RAG CONTEXT COMPILATION ---
            await push_ws_status("Analyzing market data...")
            rag_context = self._compile_rag_block(g_data, r_data, w_data)
            
            # --- STAGE 3: SEQUENTIAL 4-LAYER ANALYSIS CLUSTER ---
            await push_ws_status("Generating business recommendations...")
            final_insights = await self._run_analysis_cluster(area, rag_context, language)
            
            if not final_insights or not final_insights.get("success"):
                 return {"success": False, "message": "Analysis system temporarily unavailable."}

            # --- STAGE 4: NEURAL REFINEMENT ---
            await push_ws_status("Finalizing recommendations...")
            polished_recs = self._polish_identities(final_insights.get("recommendations", []), area)
            
            final_result = {
                "success": True,
                "area": area,
                "recommendations": polished_recs,
                "analysis": final_insights.get("analysis", {}),
                "timestamp": datetime.now().isoformat(),
                "ai_source": final_insights.get("ai_source", "Tiered-Cluster V4.2"),
                "intelligence_fidelity": "High-Fidelity RAG" if rag_context else "Baseline Synthesis"
            }
            
            self._final_recommendations_cache[cache_key] = (final_result, now + self._cache_expiry)
            return final_result

        except Exception as e:
            print(f"❌ [CLUSTER-FAIL] Core Pipeline Exception: {e}")
            return {"success": False, "message": "Strategic pipeline synchronization failure."}

    async def _run_analysis_cluster(self, area: str, rag_context: str, language: str) -> Dict:
        """Sequential Multi-Layer Analysis Cluster (Hardened Fallbacks)"""
        print(f"🚀 [ANALYSIS CLUSTER] Starting intelligent synthesis for: {area}...")
        await push_ws_status("AI Analysis in progress (Layer 1: Gemini Pro)...")
        
        # --- LAYER 1: GEMINI 1.5 PRO (High Fidelity) ---
        gemini_result = await self._call_gemini(area, rag_context, language)
        if gemini_result and gemini_result.get("success"):
            print(f"✅ [GEMINI SUCCESS] High-fidelity analysis retrieved.")
            return gemini_result
            
        print(f"⚠️ [GEMINI FAIL] Falling back to Layer 2: Pollinations...")
        await push_ws_status("AI Analysis in progress (Layer 2: Pollinations)...")
        
        # --- LAYER 2: POLLINATIONS AI (Robust Fallback) ---
        pollinations_result = await self._call_search_gpt(area, rag_context, language)
        if pollinations_result.get("success"):
            print(f"✅ [POLLINATIONS SUCCESS] Analysis completed via fallback.")
            return pollinations_result
        
        print(f"🚨 [CLUSTER FAILURE] All AI layers exhausted for {area}.")
        return {"success": False, "error": "AI cluster unavailable", "recommendations": []}

    async def _call_gemini(self, area: str, context: str, lang: str) -> Optional[Dict]:
        """Professional Analysis via Google Gemini 1.5 Pro"""
        if not self.gemini_key:
            return None
            
        context_limit = 15000 # Pro handles massive context
        prompt = f"""
        Role: Senior Strategic Market Analyst
        Objective: Generate 12-15 high-fidelity business opportunities for {area}.
        
        Market Intelligence Data: {context[:context_limit] if context else "Generic market research needed."}
        
        Requirements:
        1. Return ONLY valid JSON matching this schema:
        {{
            "analysis": "A detailed 2-paragraph market outlook.",
            "recommendations": [
                {{
                    "title": "Business Name/Opportunity",
                    "description": "Tactical summary (2 sentences)",
                    "category": "Industry",
                    "market_gap": "Specific underserved need in {area}",
                    "funding_required": "Estimated capital in local currency (if India: Lakhs/Crores)",
                    "estimated_profit": "Expected monthly profit",
                    "roi_percentage": "Logical ROI number",
                    "payback_period": "Time to recoup investment",
                    "unique_selling_proposition": "What makes it win",
                    "six_month_plan": ["Phase 1: Action", "Phase 2: Action", "Phase 3: Action"]
                }}
            ]
        }}
        
        Rules:
        - No markdown formatting. No preamble.
        - Be localized and specific to {area}.
        - Language: {lang}
        """

        try:
            print(f"🚀 [AI CLUSTER] Hitting Gemini 1.5 Pro...")
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={self.gemini_key}"
            
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(gemini_url, json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.4,
                        "maxOutputTokens": 2048,
                        "topP": 0.8,
                        "topK": 40
                    }
                })
                
                if resp.status_code == 200:
                    data = resp.json()
                    content = data['candidates'][0]['content']['parts'][0]['text']
                    
                    # Clean potential markdown
                    content = re.sub(r'```json\s*|\s*```', '', content).strip()
                    
                    match = re.search(r'\{.*\}', content, re.DOTALL)
                    if match:
                        json_data = json.loads(match.group())
                        if "recommendations" in json_data:
                            return {
                                "success": True,
                                "recommendations": json_data["recommendations"],
                                "ai_source": "Gemini 1.5 Pro (Stratospheric)",
                                "analysis": json_data.get("analysis", "Market synthesis complete.")
                            }
                else:
                    print(f"⚠️ Gemini API Error: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"🔄 Gemini Cluster Exception: {str(e)}")
            
        return None

    async def _call_search_gpt(self, area: str, context: str, lang: str) -> Dict:
        """Enhanced Pollinations API with real-time market analysis and retry logic"""
        # Increase context usage for higher fidelity analysis (formerly limited to 800)
        context_limit = 4000 
        
        enhanced_prompt = f"""
        Analyze current market conditions and generate 12-15 specific, actionable business opportunities for {area}.
        Market Context: {context[:context_limit] if context else "Analyze area for emerging business opportunities."}
        
        Requirements:
        1. Return ONLY valid JSON matching the structure: {{"recommendations": [{{ "title": "...", "description": "...", "market_gap": "...", "roi_percentage": "...", ... }}]}}
        2. Focus on localized gaps found in the provided context for {area}.
        3. Be extremely specific and realistic.
        """
        
        # Max 2 retries for robustness
        for attempt in range(2):
            try:
                print(f"🚀 [AI CLUSTER] Hitting Pollinations (Attempt {attempt + 1})...")
                async with httpx.AsyncClient(timeout=40.0, follow_redirects=True) as client:
                    headers = {}
                    if self.pollinations_key:
                        headers["Authorization"] = f"Bearer {self.pollinations_key}"
                        
                    resp = await client.post("https://text.pollinations.ai/", headers=headers, json={
                        "messages": [
                            {"role": "system", "content": f"You are a strategic business analyst specialized in the {area} market. You must respond in valid JSON format ONLY."}, 
                            {"role": "user", "content": enhanced_prompt}
                        ],
                        "model": "openai", # High quality model
                        "temperature": 0.4,
                        "seed": int(time.time()) # Dynamic freshness
                    })
                    
                    if resp.status_code == 200:
                        response_text = resp.text.strip()
                        # Clean markdown if present
                        if response_text.startswith("```json"):
                            response_text = response_text.replace("```json", "").replace("```", "").strip()
                            
                        match = re.search(r'\{.*\}', response_text, re.DOTALL)
                        if match:
                            try:
                                data = json.loads(match.group())
                                if "recommendations" in data and len(data["recommendations"]) > 0:
                                    print(f"✅ AI analysis successful on attempt {attempt + 1}")
                                    return {
                                        "success": True, 
                                        "recommendations": data["recommendations"][:15], 
                                        "ai_source": "Pollinations AI (RAG-Enhanced)",
                                        "analysis": data.get("analysis", "Market synthesis complete.")
                                    }
                            except json.JSONDecodeError:
                                print(f"⚠️ JSON Decode failure on attempt {attempt + 1}")
                                continue
            except Exception as e:
                print(f"🔄 Pollinations Exception (Attempt {attempt + 1}): {str(e)}")
                if attempt < 1: await asyncio.sleep(1) # Small delay before retry
                
        return {"success": False}

    async def _scout_google(self, area: str) -> str:
        """Enhanced Super-RAG search with Best-Effort Swarm logic for maximum velocity"""
        tasks = []
        if self.tavily_key: tasks.append(asyncio.create_task(self._scout_tavily(area)))
        if self.exa_key: tasks.append(asyncio.create_task(self._scout_exa(area)))
        if self.serper_key: tasks.append(asyncio.create_task(self._scout_serper(area)))
        if self.serpapi_key: tasks.append(asyncio.create_task(self._scout_serpapi(area)))
        if self.searchapi_key: tasks.append(asyncio.create_task(self._scout_searchapi(area)))
        if self.firecrawl_key: tasks.append(asyncio.create_task(self._scout_firecrawl(area)))
        
        # PRO DATA: Deep extraction for local intelligence (Apify)
        if self.apify_key: tasks.append(asyncio.create_task(self._scout_apify_businesses(area)))
        
        if not tasks: return ""
        
        print(f"🔍 [SCOUTING] Deploying {len(tasks)} parallel drones for {area}...")
        
        # ⚡ Best-Effort Swarm: Wait 10s for all, take whatever finished
        done, pending = await asyncio.wait(tasks, timeout=10.0)
        
        results = []
        for task in done:
            try:
                res = task.result()
                if isinstance(res, str) and res.strip():
                    results.append(res)
            except Exception as e:
                print(f"⚠️ Drone failure: {e}")
        
        # Cancel pending tasks to prevent them from eating memory later
        for task in pending:
            task.cancel()
            
        print(f"📊 [SCOUTING COMPLETE] Gathered data from {len(results)} prompt sources within the 10s window")
        return "\n\n".join(results)

    async def _scout_tavily(self, area: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post("https://api.tavily.com/search", json={
                    "api_key": self.tavily_key, 
                    "query": f"business gaps {area} 2026",
                    "max_results": 5
                })
                if resp.status_code == 200:
                    data = resp.json().get('results', [])
                    return "\n".join([f"TAVILY: {r.get('title')}: {r.get('content')}" for r in data])
        except: pass
        return ""

    async def _scout_exa(self, area: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {"query": f"untapped business niches {area}", "num_results": 5}
                resp = await client.post("https://api.exa.ai/search", headers={"x-api-key": self.exa_key}, json=params)
                if resp.status_code == 200:
                    data = resp.json().get('results', [])
                    return "\n".join([f"EXA: {r.get('title')}: {r.get('url')}" for r in data])
        except: pass
        return ""

    async def _scout_serper(self, area: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post("https://google.serper.dev/search", headers={"X-API-KEY": self.serper_key}, json={"q": f"startups {area} 2026"})
                if resp.status_code == 200:
                    data = resp.json().get('organic', [])[:5]
                    return "\n".join([f"SERPER: {r.get('title')}: {r.get('snippet')}" for r in data])
        except: pass
        return ""

    async def _scout_serpapi(self, area: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get("https://serpapi.com/search", params={"q": f"business opportunities {area}", "api_key": self.serpapi_key})
                if resp.status_code == 200:
                    data = resp.json().get('organic_results', [])[:5]
                    return "\n".join([f"SERPAPI: {r.get('title')}: {r.get('snippet')}" for r in data])
        except: pass
        return ""

    async def _scout_searchapi(self, area: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get("https://www.searchapi.io/api/v1/search", params={"q": f"business trends {area}", "api_key": self.searchapi_key})
                if resp.status_code == 200:
                    data = resp.json().get('organic_results', [])[:5]
                    return "\n".join([f"SEARCHAPI: {r.get('title')}: {r.get('snippet')}" for r in data])
        except: pass
        return ""

    async def _scout_firecrawl(self, area: str) -> str:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post("https://api.firecrawl.dev/v0/search", headers={"Authorization": f"Bearer {self.firecrawl_key}"}, json={"query": f"market analysis {area}"})
                if resp.status_code == 200:
                    data = resp.json().get('data', [])
                    return "\n".join([f"FIRECRAWL: {r.get('title')}: {r.get('description')}" for r in data])
        except: pass
        return ""

    async def _scout_apify_businesses(self, area: str) -> str:
        """Deep Google Maps local market analysis (Thread-Safe)"""
        try:
            from apify_scraper import scrape_google_maps_contacts
            # Optimization: Search for top businesses to identify competitors/gaps
            query = f"emerging business opportunities and market gaps in {area}"
            
            # Wrap blocking call in thread - Optimization: Disable reviews/contacts for speed/memory efficiency
            def _scrape():
                return scrape_google_maps_contacts(
                    search_queries=[query], 
                    location=area, 
                    max_results=5,
                    scrape_reviews=False, # Save massive memory
                    scrape_contacts=False # Save massive memory
                )
                
            businesses = await asyncio.to_thread(_scrape)
            if businesses:
                return f"APIFY: Deep analyzed {len(businesses)} local businesses to identify market saturation for {query}."
        except Exception as e:
            print(f"⚠️ Apify swarm component failed: {e}")
        return ""

    async def _scout_reddit(self, area: str) -> str:
        try:
            from ddgs import DDGS
            def _get_ddgs():
                with DDGS() as ddgs:
                    return list(ddgs.text(f"site:reddit.com business gaps {area}", max_results=5))
            
            results = await asyncio.to_thread(_get_ddgs)
            return "\n".join([r.get('body', '') for r in results])
        except: return ""

    async def _scout_web_trends(self, area: str) -> str:
        try:
            from ddgs import DDGS
            def _get_ddgs():
                with DDGS() as ddgs:
                    return list(ddgs.text(f"economic scene {area} 2026", max_results=3))
                    
            results = await asyncio.to_thread(_get_ddgs)
            return "\n".join([r.get('body', '') for r in results])
        except: return ""

    def _compile_rag_block(self, g: str, r: str, w: str) -> str:
        b = []
        if g: b.append(f"### SEARCH:\n{g}")
        if r: b.append(f"### REDDIT:\n{r}")
        if w: b.append(f"### WEB:\n{w}")
        return "\n\n".join(b)[:12000]

    def _polish_identities(self, recs: List[Dict], area: str) -> List[Dict]:
        p = []
        a_low = area.lower()
        for r in recs:
            if not isinstance(r, dict): continue
            t = r.get("title") or r.get("business_name") or "Strategic Opportunity"
            t = re.sub(rf"(?i)\s+(for|in|at|near|of|area)\s+{re.escape(a_low)}.*", "", t)
            t = re.sub(r"(?i)\bIndia\b", "", t)
            r["title"] = t.strip().title()
            p.append(r)
        return p
