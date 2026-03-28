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

        print(f"🚀 [WORKFLOW] Executing Sequential 4-Layer RAG Pipeline for {area}...")
        await push_ws_status(f"Phase 1: Multi-Source Scouting (Google/Reddit/Web) in {area}...")
        
        try:
            # --- STAGE 1: MULTI-SOURCE RAG SCOUTING ---
            # Parallel gathering for speed
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
            await push_ws_status("Phase 2: Compiling unified RAG context block...")
            rag_context = self._compile_rag_block(g_data, r_data, w_data)
            
            # --- STAGE 3: SEQUENTIAL 4-LAYER ANALYSIS CLUSTER ---
            await push_ws_status("Phase 3: Deploying Sequential Analysis Cluster (Gemini -> Pollinations -> Claude -> Fred)...")
            final_insights = await self._run_analysis_cluster(area, rag_context, language)
            
            if not final_insights or not final_insights.get("success"):
                 return {"success": False, "message": "Critical Analysis Failover: Multi-layer AI cluster exhausted."}

            # --- STAGE 4: NEURAL REFINEMENT ---
            await push_ws_status("Phase 4: Refining strategic identifiers and stripping location leaks...")
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

    # --- TIERED ANALYSIS CLUSTER ---
    
    async def _run_analysis_cluster(self, area: str, rag_context: str, language: str) -> Dict:
        """Executes the Hyper-Fidelity 5-Layer Cluster: (V6.3 Quantum Race)."""
        
        # 🎯 QUANTUM RACE: Launch Gemini and AIC Overlord simultaneously (Parallel Layer 1 & 2)
        print(f"💎 [QUANTUM RACE] Deploying Gemini & AIC Overlord Parallel Swarm...")
        await push_ws_status("Quantum Search Active: Parallel Intelligence Swarm...")
        
        try:
            # We use wait with FIRST_COMPLETED to beat the Render 30s timeout
            tasks = [
                self._call_gemini_pro(area, rag_context, language),
                self._call_aic_overlord(area, rag_context, language)
            ]
            
            done, pending = await asyncio.wait(
                [asyncio.create_task(t) for t in tasks], 
                return_when=asyncio.FIRST_COMPLETED,
                timeout=25.0 # Max wait for the primary swarm
            )
            
            for task in done:
                res = task.result()
                if res.get("success"):
                    # Cancel pending tasks to save resources
                    for p in pending: p.cancel()
                    return res
            
            # Cancel anything still running
            for p in pending: p.cancel()
        except Exception as e:
            print(f"⚠️ Quantum Race Exception: {e}")

        # 3. LAYER 3: SEARCH-GPT (The Knight - Neural Sourcing)
        await push_ws_status("Secondary Swarm Active: SearchGPT...")
        print(f"🚀 [LAYER 3] Deploying Pollinations SearchGPT...")
        res = await self._call_search_gpt(area, rag_context, language)
        if res.get("success"): return res

        # 4. LAYER 4: CLAUDE 3.5 SONNET (The Sage - Deep Reasoning)
        await push_ws_status("Fourth Tier Analysis Engaged: Claude 3.5 Sonnet...")
        print(f"🦉 [LAYER 4] Deploying Claude 3.5 Sonnet Logic...")
        res = await self._call_claude_sonnet(area, rag_context, language)
        if res.get("success"): return res
        
        # 5. LAYER 5: DEEPSEEK GUARD (The Fortress - Final Safe Haven)
        await push_ws_status("Final Safety Layer Active: DeepSeek Fortress...")
        print(f"💂 [LAYER 5] Deploying DeepSeek Guard Safety Logic...")
        res = await self._call_fred_guard(area, rag_context, language)
        if res.get("success"): return res

        return {"success": False}

    # --- AI ADAPTERS ---

    async def _call_gemini_pro(self, area: str, context: str, lang: str) -> Dict:
        if not self.gemini_key: return {"success": False}
        prompt = self._build_prompt(area, context, lang)
        
        # Unbeatable Model Switcher: Exhaustively find the working Gemini configuration for this key
        models_to_try = [
            "v1beta/models/gemini-1.5-pro",
            "v1beta/models/gemini-1.5-flash",
            "v1/models/gemini-pro",
            "v1/models/gemini-1.5-flash"
        ]
        
        for model_path in models_to_try:
            try:
                async with httpx.AsyncClient(timeout=22.0) as client:
                    url = f"https://generativelanguage.googleapis.com/{model_path}:generateContent?key={self.gemini_key}"
                    resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
                    if resp.status_code == 200:
                        data = self._clean_json(resp.json()['candidates'][0]['content']['parts'][0]['text'])
                        if data:
                            data["success"] = True
                            data["ai_source"] = f"Gemini ({model_path.split('/')[-1]}) Primary"
                            return data
                    else:
                        print(f"🔄 Gemini Switcher: {model_path} returned {resp.status_code}")
            except: pass
            
        return {"success": False}

    async def _call_aic_overlord(self, area: str, context: str, lang: str) -> Dict:
        """AIC Overlay Adapter: Executes ultra-deep reasoning via GPT-4o proxy cluster"""
        if not self.aic_key: return {"success": False}
        prompt = self._build_prompt(area, context, lang)
        try:
            async with httpx.AsyncClient(timeout=22.0) as client:
                url = f"{self.aic_base}/chat/completions"
                headers = {"Authorization": f"Bearer {self.aic_key}", "Content-Type": "application/json"}
                resp = await client.post(url, headers=headers, json={
                    "model": "gpt-4o", # Using the most advanced modal in the AIC suite
                    "messages": [
                        {"role": "system", "content": "You are the STRATEGIC OVERLORD. Output PURE JSON. Ground in RAG context."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"}
                })
                if resp.status_code == 200:
                    data = self._clean_json(resp.json()['choices'][0]['message']['content'])
                    if data:
                        data["success"] = True
                        data["ai_source"] = "AIC Overlord Sovereignty (Layer 2)"
                        return data
        except Exception as e:
            print(f"⚠️ AIC Overlord failed: {str(e)}")
        return {"success": False}

    async def _call_search_gpt(self, area: str, context: str, lang: str) -> Dict:
        """Custom Adapter for Ultra-Neural SearchGPT (The Knight)"""
        prompt = self._build_prompt(area, context, lang)
        try:
            async with httpx.AsyncClient(timeout=22.0) as client:
                resp = await client.post("https://gen.pollinations.ai/", json={
                    "messages": [{"role": "system", "content": "ULTRA-NEURAL SEARCH GPT: Analysis gaps in RAG context. PURE JSON."}, 
                                 {"role": "user", "content": prompt}],
                    "model": "searchgpt"
                })
                if resp.status_code == 200:
                    data = self._clean_json(resp.text)
                    if data:
                        data["success"] = True
                        data["ai_source"] = "SearchGPT (Layer 2 Swarm)"
                        return data
        except: pass
        return {"success": False}

    async def _call_pollinations_rescue(self, area: str, context: str, lang: str) -> Dict:
        # Legacy placeholder - mapped to SearchGPT for V6.0 quality
        return await self._call_search_gpt(area, context, lang)

    async def _call_claude_sonnet(self, area: str, context: str, lang: str) -> Dict:
        if not self.claude_key: return {"success": False}
        prompt = self._build_prompt(area, context, lang)
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                url = "https://api.anthropic.com/v1/messages"
                headers = {"x-api-key": self.claude_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
                resp = await client.post(url, headers=headers, json={
                    "model": "claude-3-5-sonnet-20240620", "max_tokens": 4096, "messages": [{"role": "user", "content": prompt}]
                })
                if resp.status_code == 200:
                    data = self._clean_json(resp.json()['content'][0]['text'])
                    if data:
                        data["success"] = True
                        data["ai_source"] = "Claude 3.5 Sonnet (Layer 3 Ridge)"
                        return data
        except: pass
        return {"success": False}

    async def _call_fred_guard(self, area: str, context: str, lang: str) -> Dict:
        """DeepSeek Security Guard Adapter (The Fortress)"""
        prompt = self._build_prompt(area, context, lang)
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post("https://gen.pollinations.ai/", json={
                    "messages": [{"role": "system", "content": "DEEPSEEK GUARD: Return final strategic opportunities. JSON only."}, 
                                 {"role": "user", "content": prompt}],
                    "model": "deepseek"
                })
                if resp.status_code == 200:
                    data = self._clean_json(resp.text)
                    if data:
                        data["success"] = True
                        data["ai_source"] = "DeepSeek Guard (Layer 4 Fortress)"
                        return data
        except: pass
        return {"success": False}

    # --- HELPERS ---

    def _build_prompt(self, area: str, context: str, lang: str) -> str:
        return f"""
        CORE MISSION: IDENTIFY EXACTLY 10 UNYIELDING VENTURE OPPORTUNITIES FOR {area} (2026).
        
        RAG CONTEXT (GROUND TRUTH):
        {context if context else "Scouting swarm busy. Rely on deep economic reasoning for " + area}

        STRICT IDENTITY PROTOCOL (UNBREAKABLE):
        1. DATA EXTRACTION: Extract local gaps from RAG signals.
        2. VENTURE MAPPING: Map gaps to exactly 10 professional business roadmaps.
        3. BRANDING DESIGN (RULE OF ZERO):
           - RULE 1 [CRITICAL]: ABSOLUTELY NO mention of '{area}', city, ZIP, state, or 'India' in any business title.
           - RULE 2: FORBID generic 'Local Digital Solutions' or 'Kolkata Logistics' templates.
           - RULE 3: Every title MUST be a standalone professional brand (e.g., 'Astra-Logistics', 'Greenshop-SaaS', 'UrbanFlow').
           - RULE 4: No repetitions of the word '{area}' in the description if possible.

        OUTPUT JSON:
        {{
            "analysis": {{
                "executive_summary": "Deep reasoning on {area} 2026 economic readiness.",
                "market_gap_intensity": "Critical/High/Standard",
                "confidence_score": "95%",
                "primary_drivers": ["Driver 1", "Driver 2"],
                "live_economic_indicators": {{"gdp": "%", "investment": "Trend", "digital": "High"}}
            }},
            "recommendations": [
                {{
                    "title": "Unique Name (NOT '{area}')",
                    "description": "2-sentence definition: (1) Local gap (2) Solution (3) Edge.",
                    "category": "Segment",
                    "funding_required": "Investment (e.g. ₹5L - ₹8L)",
                    "estimated_revenue": "Revenue",
                    "estimated_profit": "Profit",
                    "roi_percentage": 150,
                    "target_customers": "Persona in {area}"
                }}
            ]
        }}
        """

    async def _scout_google(self, area: str) -> str:
        """Performs Super-RAG parallel search across elite providers (Tavily/Exa/Serper/SerpApi)"""
        res = []
        
        # 1. TAVILY (Primary AI Search)
        if self.tavily_key:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post("https://api.tavily.com/search", json={
                        "api_key": self.tavily_key, "query": f"business gaps and high-growth opportunities in {area} 2026",
                        "search_depth": "advanced", "max_results": 5
                    })
                    if resp.status_code == 200:
                        res.append("\n".join([f"TAVILY: {r.get('title')}: {r.get('content')}" for r in resp.json().get('results', [])]))
            except: pass

        # 2. EXA (Neural Search)
        if self.exa_key:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post("https://api.exa.ai/search", headers={"x-api-key": self.exa_key}, json={
                        "query": f"best untapped unique business niches in {area} 2026", "use_autoprompt": True, "num_results": 5
                    })
                    if resp.status_code == 200:
                        res.append("\n".join([f"EXA: {r.get('title')}: {r.get('url')}" for r in resp.json().get('results', [])]))
            except: pass

        # 3. SERPER/SERPAPI (Legacy Google Backup)
        if self.serper_key:
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post("https://google.serper.dev/search", headers={"X-API-KEY": self.serper_key}, json={
                        "q": f"local market trends {area} startups 2026"
                    })
                    if resp.status_code == 200:
                        res.append("\n".join([f"SERPER: {r.get('title')}: {r.get('snippet')}" for r in resp.json().get('organic', [])[:5]]))
            except: pass
            
        return "\n\n".join(res)

    async def _scout_reddit(self, area: str) -> str:
        """Neural scraping of community sentiment for gaps"""
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                return "\n".join([r.get('body', '') for r in ddgs.text(f"site:reddit.com local business gaps {area} 2025 help needed", max_results=5)])
        except: return ""

    async def _scout_web_trends(self, area: str) -> str:
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                return "\n".join([r.get('body', '') for r in ddgs.text(f"current economic startups scene {area} 2026", max_results=3)])
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
            t = r.get("title", "Strategic Opportunity")
            t = re.sub(rf"(?i)\s+(for|in|at|near|of|area)\s+{re.escape(a_low)}.*", "", t)
            t = re.sub(r"\d{5,6}", "", t)
            t = re.sub(r"(?i)\bIndia\b", "", t)
            r["title"] = t.strip().title()
            p.append(r)
        return p

    def _clean_json(self, text: str) -> Optional[Dict]:
        try:
            match = re.search(r'\{.*\}', text, re.DOTALL)
            return json.loads(match.group(0)) if match else json.loads(text)
        except: return None
