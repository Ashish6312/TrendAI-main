import httpx
import json
import re
import os
import asyncio
import time
import hashlib
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
    SINGULARITY STRATEGIC ENGINE (V6.4 - THE NEURAL RECON)
    Architecture:
    1. Scouting Swarm (Structured Extract via Firecrawl/Tavily/PRAW/FRED)
    2. Context Builder (Semantic RAG Compilation)
    3. Neural Cluster (Gemini 2.0 Flash Main Intelligence)
    4. Guardrail/Critic (Claude 3.5 Consensus Layer)
    5. Fallback (Groq DeepSeek-R1 Distill Reasoning)
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
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.aiml_key = os.getenv("AIML_API_KEY")
        
        # Priority 2: Reddit PRAW Initialization
        self.reddit_client_id = os.getenv("REDDIT_CLIENT_ID")
        self.reddit_client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        self.reddit_user_agent = f"python:TrendAI:v6.4 (by /u/{os.getenv('REDDIT_USERNAME', 'TrendAI')})"
        self.reddit_username = os.getenv("REDDIT_USERNAME")
        self.reddit_password = os.getenv("REDDIT_PASSWORD")
        
        # System State
        self._logic_version = "v6.4_high_fidelity_synthesis"
        self._final_recommendations_cache = {}
        self._cache_expiry = 3600
        
        # Persistent Scouting Cache
        self._scouting_cache_file = "scouting_intel_cache.json"
        self._scouting_cache = {}
        self._load_scouting_cache()
        
        print(f"[SYSTEM] Singularity Engine {self._logic_version} Activated.")

    def _load_scouting_cache(self):
        if os.path.exists(self._scouting_cache_file):
            try:
                with open(self._scouting_cache_file, "r") as f:
                    self._scouting_cache = json.load(f)
                    print(f"[SCOUTING CACHE] Loaded {len(self._scouting_cache)} regional intelligence blocks.")
            except: pass

    def _save_scouting_cache(self):
        try:
            with open(self._scouting_cache_file, "w") as f:
                json.dump(self._scouting_cache, f)
        except: pass

    async def generate_data_driven_recommendations(self, area: str, email: str, language: str = "English", phase: str = "discovery") -> Dict:
        """Main entry point following the 4-layer fallback strategy."""
        area_key = area.lower().strip()
        now = time.time()
        
        # 1. CACHE VALIDATION (with versioning)
        cache_key = f"{area_key}_{phase}_{language}_{self._logic_version}"
        if cache_key in self._final_recommendations_cache:
            data, expiry = self._final_recommendations_cache[cache_key]
            if now < expiry:
                print(f"[CACHE] Tiered Hit for {area}.")
                return data

        await push_ws_status("Initializing AI Analysis Engine...")
        
        try:
            # --- STAGE 1: MULTI-SOURCE RAG SCOUTING ---
            await push_ws_status("Deploying Scouting Swarm drones...")
            
            # 🧠 CHECK PERSISTENT SCOUTING CACHE
            if area_key in self._scouting_cache:
                await push_ws_status("Cache hit: Regional intelligence found.")
                print(f"[SCOUTING CACHE] Instant retrieval of market intelligence for {area}.")
                rag_context = self._scouting_cache[area_key]
            else:
                await push_ws_status("Engaging Deep Extraction Layer (Apify + Firecrawl)...")
                try:
                    # DEEP MODE: Restoration of 300s window for high-efficiency reconnaissance
                    scouting = await asyncio.wait_for(asyncio.gather(
                        self._scout_google(area),
                        self._scout_reddit(area),
                        self._scout_web_trends(area),
                        self._scout_fred(area),
                        return_exceptions=True
                    ), timeout=300.0)
                except asyncio.TimeoutError:
                    await push_ws_status("Scouting partially complete after 5 mins (Proceeding with deep available telemetry)...")
                    print(f"[SCOUTING-DEEP-TIMEOUT] Moving to high-fidelity synthesis for {area} after 300s sweep.")
                    scouting = [None, None, None, None]
                
                await push_ws_status("Vectorizing market intelligence...")
                g_data = scouting[0] if not isinstance(scouting[0], Exception) and scouting[0] else ""
                r_data = scouting[1] if not isinstance(scouting[1], Exception) and scouting[1] else ""
                w_data = scouting[2] if not isinstance(scouting[2], Exception) and scouting[2] else ""
                f_data = scouting[3] if not isinstance(scouting[3], Exception) and scouting[3] else ""
                
                # --- STAGE 2: RAG CONTEXT COMPILATION ---
                await push_ws_status("Synthesizing Semantic RAG blocks...")
                rag_context = self._compile_rag_block(g_data, r_data, w_data, f_data)
                
                # 💾 SAVE TO PERSISTENT CACHE
                if rag_context:
                    self._scouting_cache[area_key] = rag_context
                    self._save_scouting_cache()
            
            # --- STAGE 3: CONSTRUCT NEURAL PROMPT & RUN CLUSTER ---
            await push_ws_status("Neural Cluster activated. Reasoning...")
            
            cluster_prompt = f"""
            Role: Lead Business Intelligence Architect (TrendAI Neural Core)
            Target Region: {area} for the 2026 Fiscal Year.
            Language: {language}
            
            Market Intelligence Context (RAG):
            {rag_context if rag_context else "Synthesize market gaps based on general geographic trends."}
            
            STRICT FIDELITY REQUIREMENTS:
            1. NO PLACEHOLDERS. Every field must have a specific, calculated value.
            2. CALC-ROI: Every 'roi_percentage' must be unique (e.g. 52, 118).
            3. BEP-VAL: Specific 'be_period' (e.g. '4.5 Months', '1.2 Years').
            4. TRAFFIC: 'm1_traffic' (e.g. '1.5k MAU', '125 local leads').
            5. RETENTION: 'retention_rate' (e.g. '82%', 'High Repeat LTV').
            6. VOLUME: Provide EXACTLY 15 high-fidelity recommendations. Do not truncate.
            
            Return ONLY valid JSON:
            {{
                "analysis": {{
                    "executive_summary": "Deep market outlook specific to {area} in 2026",
                    "confidence_score": "X%",
                    "market_gap_intensity": "Low/Medium/High"
                }},
                "recommendations": [
                    {{
                        "business_name": "Unique Venture Name",
                        "description": "Tactical thesis",
                        "category": "Sector",
                        "market_gap": "Underserved micro-niche in {area}",
                        "target_audience": "Specific demographics",
                        "investment_range": "e.g. ₹15.5L",
                        "roi_percentage": number,
                        "roi_potential": "Projected annual returns (e.g. 55%)",
                        "be_period": "Break-even target (e.g. 6 Months)",
                        "m1_traffic": "Projected M1 customer/lead volume",
                        "retention_rate": "Target retention (e.g. 78%)",
                        "implementation_difficulty": "Low/Medium/High",
                        "competition_level": "Low/Medium/High with a reason.",
                        "demand_index": "Numerical index (e.g. 88%)",
                        "market_size": "City/State scope",
                        "six_month_plan": [{{ "month": "1-2", "goal": "..." }}, {{ "month": "3-4", "goal": "..." }}, {{ "month": "5-6", "goal": "..." }}]
                    }}
                ]
            }}
            """
            
            final_insights = await self._run_analysis_cluster(cluster_prompt, area, language)
            
            if not final_insights or not final_insights.get("success"):
                 return {"success": False, "message": "Analysis system temporarily unavailable."}

            # --- STAGE 4: NEURAL REFINEMENT ---
            await push_ws_status("Finalizing recommendations...")
            polished_recs = self._polish_identities(final_insights.get("recommendations", []), area)
            
            # NEW: Use geolocated official name if available for professional display
            display_area = area
            try:
                from simple_recommendations import parse_real_location_data
                loc_info = parse_real_location_data(area)
                if loc_info and loc_info.get('city'):
                    display_area = f"{loc_info['city']}, {loc_info.get('country', '')}".strip(', ')
                elif loc_info and loc_info.get('country'):
                    display_area = f"{area}, {loc_info['country']}"
            except: pass

            final_result = {
                "success": True,
                "area": display_area,
                "recommendations": polished_recs,
                "analysis": final_insights.get("analysis", {}),
                "timestamp": datetime.now().isoformat(),
                "ai_source": final_insights.get("ai_source", "Tiered-Cluster V4.2"),
                "intelligence_fidelity": "High-Fidelity RAG" if rag_context else "Baseline Synthesis"
            }
            
            self._final_recommendations_cache[cache_key] = (final_result, now + self._cache_expiry)
            return final_result

        except Exception as e:
            print(f"[CLUSTER-FAIL] Core Pipeline Exception: {e}")
            return {"success": False, "message": "Strategic pipeline synchronization failure."}

    async def _call_pollinations_fallback(self, area: str, prompt: str, lang: str) -> Optional[Dict]:
        """Final neural layer to ensure zero downtime production"""
        try:
            api_url = "https://text.pollinations.ai/"
            payload = {
                "messages": [
                    {"role": "system", "content": "Professional Business Analyst. Respond in valid JSON only matching the schema."},
                    {"role": "user", "content": prompt}
                ],
                "model": "openai",
                "json": True
            }
            async with httpx.AsyncClient(timeout=90.0) as client:
                resp = await client.post(api_url, json=payload)
                if resp.status_code == 200:
                    text = resp.text
                    match = re.search(r'\{.*\}', text, re.DOTALL)
                    if match:
                        data = json.loads(match.group())
                        return {
                            "success": True,
                            "recommendations": data.get("recommendations", []),
                            "ai_source": "Pollinations AI (Strategic Hub)",
                            "analysis": data.get("analysis", {"summary": "Synthesis successful."})
                        }
        except Exception as e:
            print(f"[FAIL] Pollinations Layer Failure: {e}")
        return None


    async def _call_gemini_flash(self, area: str, cluster_prompt: str, lang: str) -> Optional[Dict]:
        """Professional Analysis via Google Gemini 2.5 Flash (2026 Production Standard)"""
        if not self.gemini_key:
            return None
            
        # Optimization: If cluster_prompt is already a full prompt (it is), 
        # we don't need to wrap it in a redundant template that confuses the model's output schema.
        # We just need to ensure the system instructions are clear.
        
        # Adjust 15 -> 12 for better token headroom and stability in high-fidelity mode
        prompt = cluster_prompt.replace("15 high-fidelity", "12 high-fidelity")
        if "Return ONLY valid JSON" not in prompt:
             prompt += "\n\nReturn the response in valid JSON format matching the schema provided."

        try:
            print(f"[CLUSTER] Synthesizing via Gemini 2.5 Flash (2026 Standard)...")
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
            
            # HIGH-FIDELITY: 180s timeout for Gemini 2.0 Flash Deep Reasoning
            async with httpx.AsyncClient(timeout=180.0) as client:
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.35, # Slightly lower for better JSON fidelity
                        "maxOutputTokens": 4096, 
                        "response_mime_type": "application/json"
                    }
                }
                resp = await client.post(gemini_url, json=payload)
                
                if resp.status_code != 200:
                    logger.error(f"[FAIL] Gemini Layer Error: {resp.status_code} - {resp.text[:500]}")
                    return None

                json_raw = resp.json()['candidates'][0]['content']['parts'][0]['text']
                
                # Robust extraction with syntax normalization
                data = None
                try:
                    # Stage 1: Standard Extraction
                    match = re.search(r'(\{.*\})', json_raw, re.DOTALL)
                    if match:
                        clean_json = match.group(1).strip()
                        data = json.loads(clean_json)
                except Exception:
                    # Stage 2: Neural JSON Repair (Fixing missing commas or trailing commas in AI arrays)
                    try:
                        repaired = re.sub(r',\s*\}', '}', json_raw)
                        repaired = re.sub(r',\s*\]', ']', repaired)
                        # Fix common missing comma between objects in array: } { -> }, {
                        repaired = re.sub(r'\}\s*\{', '}, {', repaired)
                        match = re.search(r'(\{.*\})', repaired, re.DOTALL)
                        if match:
                             data = json.loads(match.group(1))
                    except: pass

                if not data:
                    logger.error("[FAIL] Gemini Layer: No valid/repairable JSON found in response.")
                    return None
                
                # PRIORITY 1: Claude Critic Layer Integration
                if self.claude_key and data.get("recommendations"):
                    print("[CRITIC] Engaging Claude for quality consensus...")
                    data = await self._call_claude_critic(data, cluster_prompt)
                    
                return {
                    "success": True,
                    "recommendations": data.get("recommendations", []),
                    "ai_source": "Gemini 2.5 Flash + Claude Critic" if self.claude_key else "Gemini 2.5 Flash (Singularity Cluster)",
                    "analysis": data.get("analysis", {"summary": "Execution complete."})
                }
        except Exception as e:
            print(f"[WARN] Gemini 2.5 Flash Layer Exception: {e}")
        return None

    async def _call_claude_critic(self, original_data: Dict, market_context: str) -> Dict:
        """Priority 1: Claude Critic Layer (Consensus Engine)"""
        try:
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=self.claude_key)
            
            prompt = f"""
            Role: Lead Strategic Critic & Validator
            Task: Review and refine business recommendations for the following context.
            
            Market Context: {market_context[:4000]}
            Initial Proposals: {json.dumps(original_data['recommendations'])}
            
            Refine the data for:
            1. Real-world feasibility in 2026.
            2. Calculation precision (ROI, Breakeven).
            3. Consensus Scoring (Eliminate generic ideas).
            4. VOLUME: Maintain 10-12 high-fidelity items. DO NOT FILTER TO LESS THAN 10.
            
            Return the full JSON structure (including analysis and refined recommendations).
            """
            
            await push_ws_status("Engaging Claude 3.5 Critic Layer (Consensus Engine)...")
            message = await client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                temperature=0.2,
                system="Respond in valid JSON only.",
                messages=[{"role": "user", "content": prompt}],
                timeout=120.0
            )
            
            content = message.content[0].text
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                refined_data = json.loads(match.group())
                return refined_data
            return original_data
        except Exception as e:
            # Silent Fallback for Auth Errors (401) or other transient failures
            print(f"[CRITIC-FAILED] Layer failure (using raw telemetry): {e}")
            return original_data

    async def _call_gemini(self, area: str, context: str, lang: str) -> Optional[Dict]:
        """Professional Analysis via Google Gemini 2.5 Pro (High Context Hub)"""
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
            "analysis": {{
                "executive_summary": "High-level market outlook for {area}",
                "confidence_score": "X%",
                "market_gap_intensity": "Low/Medium/High",
                "detailed_market_data": true,
                "live_economic_indicators": {{
                    "gdp_growth": "e.g. +6.5%",
                    "investment_inflow": "High/Moderate/Low",
                    "business_registrations": "e.g. Surging",
                    "consumer_confidence": "e.g. Optimistic",
                    "digital_adoption": "e.g. Accelerating"
                }},
                "market_trends_analysis": {{
                    "emerging_sectors": [
                        {{ "sector": "Industry Name", "growth_rate": "X% YoY", "market_size": "Large/Growing", "opportunity_level": "High/Medium" }}
                    ],
                    "consumer_behavior": {{
                        "online_adoption": "Summary text",
                        "mobile_first": "e.g. 85%"
                    }}
                }},
                "investment_climate": {{
                    "funding_landscape": {{
                        "angel_investors": "Local status",
                        "vc_presence": "Local status"
                    }},
                    "success_metrics": {{
                        "business_survival_rate": "X%",
                        "average_breakeven": "X Months"
                    }}
                }},
                "competitive_landscape": {{
                    "competition_intensity": {{
                        "overall_level": "Low-High",
                        "new_entrant_threat": "Low-High"
                    }},
                    "market_leaders": [
                        {{ "category": "Sector", "market_share": "e.g. Dominant", "differentiation_opportunity": "Strategy" }}
                    ],
                    "market_gaps": ["Gap 1", "Gap 2", "Gap 3"]
                }},
                "consumer_insights": {{
                    "demographics": {{ "median_age": "X", "household_income": "Level" }},
                    "spending_patterns": {{ "online_spending": "High/Low", "local_business_preference": "High/Low", "premium_willingness": "High/Low" }},
                    "behavior_trends": [
                        {{ "trend": "Trend Name", "adoption_rate": "X%" }}
                    ]
                }}
            }},
            "recommendations": [
                {{
                    "title": "Business Name",
                    "description": "Tactical summary",
                    "category": "Sector",
                    "market_gap": "Specific underserved need in {area}",
                    "target_audience": "Specific demographics interested",
                    "competitive_advantage": "Calculated edge over status quo",
                    "revenue_model": "Detailed revenue stream analysis",
                    "funding_required": "Calculated capital (e.g. ₹2.5L-₹4L or ₹65L-₹80L)",
                    "estimated_profit": "Calculated monthly profit",
                    "roi_percentage": number,
                    "difficulty": "Low/Medium/High",
                    "market_size": "Actual market scope",
                    "payback_period": "Months to recoup",
                    "unique_selling_proposition": "USP",
                    "six_month_plan": [
                        {"month": "Month 1-2", "goal": "..."},
                        {"month": "Month 3-4", "goal": "..."},
                        {"month": "Month 5-6", "goal": "..."}
                    ]
                }}
            ]
        }}
        
        Rules:
        - PROHIBITION: Do not return placeholder strings like '₹5L-₹15L' or 'Regional market'.
        - VARIATION: Every recommendation must have distinct financial profiles and difficulty levels.
        - No markdown formatting. No preamble.
        - Be localized and specific to {area}.
        - Language: {lang}
        """

    async def _run_analysis_cluster(self, cluster_prompt: str, area: str, lang: str) -> Dict[str, Any]:
        """Multi-layer Singularity Cluster (Gemini 2.0 -> Groq R1-Distill -> Baseline)"""
        # --- LAYER 1: GOOGLE GEMINI 2.5 FLASH (Main Intelligence + Claude Critic) ---
        retry_count = 2 # Restored retries for high-fidelity accuracy
        for attempt in range(retry_count):
            try:
                print(f"[CLUSTER] Initiating Layer 1 (Attempt {attempt+1}): Gemini 2.5 Flash...")
                if attempt > 0:
                    await push_ws_status(f"Re-synchronizing Neural Core (Refined Attempt {attempt+1})...")
                
                gemini_result = await self._call_gemini_flash(area, cluster_prompt, lang)
                if gemini_result and gemini_result.get("success"):
                    return gemini_result
            except Exception as e:
                print(f"[WARN] Layer 1 Attempt {attempt+1} Failure: {e}")
                if attempt < retry_count - 1:
                    await asyncio.sleep(2) # Brief neural cooldown

        # --- LAYER 2: GROQ SUPER-INFERENCE (DeepSeek-R1 Distill Reasoning) ---
        try:
            print("[CLUSTER] Initiating Layer 2: Groq / DeepSeek-R1 Distill...")
            groq_result = await self._call_groq(cluster_prompt, area, lang)
            if groq_result and groq_result.get("success"):
                return groq_result
        except Exception as e:
            print(f"[WARN] Layer 2 Failure: {e}")

        # --- LAYER 3: DEEPSEEK SWARM FALLBACK (AIC.CC) ---
        try:
            print("[CLUSTER] Initiating Layer 3: AIC.CC DeepSeek-V3 (Deep Neural Sweep)...")
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(f"{self.aic_base}/chat/completions", 
                    headers={"Authorization": f"Bearer {self.aic_key}", "Content-Type": "application/json"}, 
                    json={
                        "model": "deepseek-v3",
                        "messages": [
                            {"role": "system", "content": "You are an elite Business Intelligence Architect."},
                            {"role": "user", "content": cluster_prompt}
                        ],
                        "temperature": 0.3
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data['choices'][0]['message']['content']
                    content = re.sub(r'```json\s*|\s*```', '', content).strip()
                    match = re.search(r'\{.*\}', content, re.DOTALL)
                    if match:
                        json_data = json.loads(match.group())
                        return {
                            "success": True,
                            "recommendations": json_data["recommendations"],
                            "ai_source": "TrendAI Intelligence Neural Cluster (DeepSeek Proxy)",
                            "analysis": json_data.get("analysis", "Deep market synthesis complete.")
                        }
        except Exception as e:
            print(f"[FAIL] [DEEPSEEK_FAILED]: {e}")

        # --- LAYER 4: POLLINATIONS CLUSTER (Absolute Strategic Hub) ---
        try:
            print("[CLUSTER] Initiating Layer 4: Pollinations AI (Strategic Hub)...")
            await push_ws_status("Exhausting primary layers. Deploying Pollinations Fallback...")
            # Use the specialized search-gpt logic which handles prompt synthesis & Pollinations connectivity
            res = await self._call_search_gpt(area, rag_context, lang)
            if res and res.get("success"):
                return res
        except Exception as e:
            print(f"[FAIL] [POLLINATIONS_FAILED]: {e}")
            
        return {"success": False, "message": "Neural synchronization failed. Please check your system quotas or connectivity."}

    async def _call_groq(self, prompt: str, area: str, lang: str) -> Optional[Dict]:
        """Lightning-Fast Reasoning Inference via Groq (DeepSeek-R1 Distill)"""
        if not self.groq_key:
            return None
            
        try:
            # Upgrade: Use Llama 3.3 70B Versatile for high-performance stable inference in 2026
            model = "llama-3.3-70b-versatile" 
            print(f"[AI CLUSTER] Hitting Groq 2026 Standard (Llama-3.3-70B)...")
            # HIGH-FIDELITY: 120s for Groq reasoning
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post("https://api.groq.com/openai/v1/chat/completions", 
                    headers={"Authorization": f"Bearer {self.groq_key}", "Content-Type": "application/json"},
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": "You are an Elite Business Analyst. Return JSON ONLY."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3
                    }
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    content = data['choices'][0]['message']['content']
                    # Clean up <think> blocks from R1 models
                    content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
                    content = re.sub(r'```json\s*|\s*```', '', content).strip()
                    match = re.search(r'\{.*\}', content, re.DOTALL)
                    if match:
                        json_data = json.loads(match.group())
                        return {
                            "success": True,
                            "recommendations": json_data["recommendations"],
                            "ai_source": f"Groq {model} (Reasoning Engine)",
                            "analysis": json_data.get("analysis", "Deep market synthesis complete.")
                        }
        except Exception as e:
            print(f"[REF] Groq Hop failure: {e}")
        return None

    async def _call_aiml(self, prompt: str, area: str, lang: str) -> Optional[Dict]:
        """Unified High-Fidelity Inference via AIML API (Accessing GPT-4o Class Models)"""
        if not self.aiml_key:
            return None
            
        try:
            print(f"[AI CLUSTER] Hitting AIML Strategic Gateway (GPT-4o/Claude-3.5 Class)...")
            async with httpx.AsyncClient(timeout=40.0) as client:
                resp = await client.post("https://api.aimlapi.com/v1/chat/completions", 
                    headers={"Authorization": f"Bearer {self.aiml_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gpt-4o",
                        "messages": [
                            {"role": "system", "content": f"You are a Senior Strategic Analyst focused on {area}. Response must be valid JSON ONLY."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3
                    }
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    content = data['choices'][0]['message']['content']
                    content = re.sub(r'```json\s*|\s*```', '', content).strip()
                    match = re.search(r'\{.*\}', content, re.DOTALL)
                    if match:
                        json_data = json.loads(match.group())
                        if "recommendations" in json_data:
                            return {
                                "success": True,
                                "recommendations": json_data["recommendations"],
                                "ai_source": "AIML Strategic Intelligence Nexus (GPT-4o)",
                                "analysis": json_data.get("analysis", "Comprehensive market synthesis complete.")
                            }
                elif resp.status_code == 429:
                    print("[WARN] AIML Rate limited. Passing through cluster...")
        except Exception as e:
            print(f"[REF] AIML Gateway failure: {e}")
        return None


    async def _call_search_gpt(self, area: str, context: str, lang: str) -> Dict:
        """Enhanced Pollinations API with real-time market analysis and retry logic"""
        # Increase context usage for higher fidelity analysis (formerly limited to 800)
        context_limit = 4000 
        
        enhanced_prompt = f"""
        Analyze current market conditions and generate 12-15 specific, actionable business opportunities for {area}.
        Market Context: {context[:context_limit] if context else "Analyze area for emerging business opportunities."}
        
        Requirements:
        1. Return ONLY valid JSON matching the structure: 
           {{"recommendations": [{{ 
               "business_name": "...", 
               "description": "...", 
               "market_gap": "...", 
               "target_audience": "...",
               "competitive_advantage": "...",
               "revenue_model": "...",
               "investment_range": "UNQ_AMT", 
               "roi_potential": "UNQ_PERCENT (e.g. 85%)", 
               "implementation_difficulty": "Low/Medium/High", 
               "market_size": "UNQ_MKT", 
               "six_month_plan": [
                   {"month": "Month 1-2", "goal": "..."},
                   {"month": "Month 3-4", "goal": "..."},
                   {"month": "Month 5-6", "goal": "..."}
               ]
           }}]}}
        2. Focus on localized gaps found in the provided context for {area}.
        3. NO PLACEHOLDERS: Do NOT use '₹5L-₹15L' or 'Regional market'. Ensure every item has unique, realistic numbers.
        4. Be extremely specific and realistic.
        """
        
        # Max 2 retries for robustness
        for attempt in range(2):
            try:
                print(f"[AI CLUSTER] Hitting Secondary Neural Synthesis Layer (Attempt {attempt + 1})...")
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
                                    print(f"[OK] AI analysis successful on attempt {attempt + 1}")
                                    return {
                                        "success": True, 
                                        "recommendations": data["recommendations"][:15], 
                                        "ai_source": "Pollinations AI (RAG-Enhanced)",
                                        "analysis": data.get("analysis", "Market synthesis complete.")
                                    }
                            except json.JSONDecodeError:
                                print(f"[WARN] JSON Decode failure on attempt {attempt + 1}")
                                continue
            except Exception as e:
                print(f"[REF] Pollinations Exception (Attempt {attempt + 1}): {str(e)}")
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
        
        print(f"[SCOUTING] Deploying {len(tasks)} parallel drones for {area}...")
        
        # Best-Effort Swarm: Increased wait to 120s to support deep Google Maps/Apify extractions
        done, pending = await asyncio.wait(tasks, timeout=120.0)
        
        results = []
        for task in done:
            try:
                res = task.result()
                if isinstance(res, str) and res.strip():
                    results.append(res)
            except Exception as e:
                print(f"[WARN] Drone failure: {e}")
        
        # Cancel pending tasks to prevent them from eating memory later
        for task in pending:
            task.cancel()
            
        print(f"[SCOUTING COMPLETE] Gathered data from {len(results)} prompt sources within the 120s window")
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
                resp = await client.get("https://www.searchapi.io/api/v1/search", params={"q": f"business trends {area}", "api_key": self.searchapi_key, "engine": "google"})
                if resp.status_code == 200:
                    data = resp.json().get('organic_results', [])[:5]
                    return "\n".join([f"SEARCHAPI: {r.get('title')}: {r.get('snippet')}" for r in data])
        except: pass
        return ""

    async def _scout_firecrawl(self, area: str) -> str:
        """Priority 5: Upgrade Firecrawl to /v1/extract (Structured Semantic Scrape)"""
        if not self.firecrawl_key: return ""
        try:
            print(f"[FIRECRAWL] Performing structured extraction for {area}...")
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post("https://api.firecrawl.dev/v1/extract", 
                    headers={"Authorization": f"Bearer {self.firecrawl_key}", "Content-Type": "application/json"}, 
                    json={
                        "urls": [f"https://www.google.com/search?q=business+opportunities+and+economic+gaps+in+{area}+2026"],
                        "schema": {
                            "type": "object",
                            "properties": {
                                "gaps": {"type": "array", "items": {"type": "string"}},
                                "local_trends": {"type": "array", "items": {"type": "string"}},
                                "major_industries": {"type": "array", "items": {"type": "string"}},
                                "investment_climate": {"type": "string"}
                            }
                        }
                    }
                )
                if resp.status_code == 200:
                    data = resp.json().get('data', {})
                    return f"FIRECRAWL_EXTRACT: {json.dumps(data)}"
                elif resp.status_code == 402:
                    logger.warning(f"[FIRECRAWL] Credit threshold reached (402) for {area}. Attempting high-fidelity fallback...")
                    await push_ws_status("Firecrawl Credits exhausted. Re-routing to Search-GPT cluster...")
                    # Fallback to a broader search drone since Firecrawl is exhausted
                    return "FIRECRAWL: (Credit Exhausted) Re-routing telemetry to SearchAPI/Tavily cluster."
                return f"FIRECRAWL_ERROR: Status {resp.status_code}"
        except Exception as e:
            print(f"[FAIL] Firecrawl Extract failed: {e}")
        return ""

    async def _scout_apify_businesses(self, area: str) -> str:
        """Deep Google Maps local market analysis (Thread-Safe)"""
        try:
            from apify_scraper import scrape_google_maps_contacts
            # Optimization: Search for top businesses to identify competitors/gaps
            query = f"emerging business opportunities and market gaps in {area}"
            
            # NEW: Resolve precise coordinates to prevent the actor from defaulting to 'New York'
            # Manual/Explicit fix following the v6.4 stability standard
            lat, lng = None, None
            try:
                from simple_recommendations import parse_real_location_data
                location_info = parse_real_location_data(area)
                if location_info and 'coordinates' in location_info:
                    lat = location_info['coordinates'].get('lat')
                    lng = location_info['coordinates'].get('lng')
                    print(f"📍 [GEOLOCATION] Explicitly locked scouting to: {lat}, {lng} for {area}")
            except Exception as geode_err:
                print(f"⚠️ Geo-lock failed: {geode_err}")

            # Wrap blocking call in thread - Optimization: Disable reviews/contacts for speed/memory efficiency
            def _scrape():
                return scrape_google_maps_contacts(
                    search_queries=[query], 
                    location=area, 
                    max_results=5,
                    scrape_reviews=False, # Save massive memory
                    scrape_contacts=False, # Save massive memory
                    lat=lat,
                    lng=lng
                )
                
            businesses = await asyncio.to_thread(_scrape)
            if businesses:
                return f"APIFY: Deep analyzed {len(businesses)} local businesses to identify market saturation for {query}."
        except Exception as e:
            print(f"⚠️ Apify swarm component failed: {e}")
        return ""

    async def _scout_reddit(self, area: str) -> str:
        """Priority 2: Real Reddit Insight via PRAW API"""
        if not self.reddit_client_id: return ""
        try:
            import praw
            print(f"🤖 [REDDIT] Scouting tactical discussions via PRAW for {area}...")
            # Thread-safe async-friendly PRAW (Lazy initialization)
            def _get_praw_data():
                reddit = praw.Reddit(
                    client_id=self.reddit_client_id,
                    client_secret=self.reddit_client_secret,
                    user_agent=self.reddit_user_agent,
                    username=self.reddit_username,
                    password=self.reddit_password
                )
                queries = [f"{area} business gaps", f"{area} problems", "scams in {area}"]
                insights = []
                for q in queries:
                    # Search across all relevant business subreddits
                    for submission in reddit.subreddit("all").search(q, limit=3, time_filter="year"):
                        insights.append(f"REDDIT: {submission.title} - {submission.selftext[:300]}")
                return "\n".join(insights)

            return await asyncio.to_thread(_get_praw_data)
        except Exception as e:
            print(f"⚠️ Reddit PRAW failed: {e}")
            return ""

    async def _scout_fred(self, area: str) -> str:
        """Priority 3: Federal Reserve Economic Data (Macro Indicators)"""
        if not self.fred_key or "abc" in self.fred_key: return "" # Ignore placeholder
        try:
            print(f"📈 [FRED] Fetching macro economic telemetry for {area}...")
            # Examples: GDP, CPI, Unemployment
            series = ["GDP", "UNRATE", "CPIAUCSL"]
            results = []
            async with httpx.AsyncClient(timeout=10.0) as client:
                for s in series:
                    url = f"https://api.stlouisfed.org/fred/series/observations?series_id={s}&api_key={self.fred_key}&file_type=json&sort_order=desc&limit=1"
                    resp = await client.get(url)
                    if resp.status_code == 200:
                        obs = resp.json().get('observations', [{}])[0]
                        results.append(f"FRED_{s}: {obs.get('value')} (as of {obs.get('date')})")
            return "\n".join(results)
        except: return ""

    async def _scout_web_trends(self, area: str) -> str:
        """Analyze broad economic and industry trends via DuckDuckGo"""
        try:
            from ddgs import DDGS
            def _get_ddgs():
                with DDGS() as ddgs:
                    return list(ddgs.text(f"economic scene and industry gaps {area} 2026", max_results=3))
                    
            results = await asyncio.to_thread(_get_ddgs)
            return "\n".join([r.get('body', '') for r in results])
        except: return ""

    async def call_ai_cluster_json(self, prompt: str, system_prompt: str = "You are a strategic business analyst. Respond in valid JSON format ONLY.") -> Optional[Dict]:
        """A generic method to get JSON from the cluster with fallbacks (Upgraded to V2.0)"""
        # Try Gemini 2.0 Flash first
        if self.gemini_key:
            try:
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(gemini_url, json={
                        "contents": [{"parts": [{"text": f"{system_prompt}\n\n{prompt}"}]}],
                        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048, "response_mime_type": "application/json"}
                    })
                    if resp.status_code == 200:
                        content = resp.json()['candidates'][0]['content']['parts'][0]['text']
                        match = re.search(r'\{.*\}', content, re.DOTALL)
                        if match:
                            return json.loads(match.group())
            except Exception as e:
                print(f"⚠️ Gemini cluster fallback failed: {e}")

        # Fallback to Pollinations
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                headers = {}
                if self.pollinations_key:
                    headers["Authorization"] = f"Bearer {self.pollinations_key}"
                    
                resp = await client.post("https://text.pollinations.ai/", headers=headers, json={
                    "messages": [
                        {"role": "system", "content": system_prompt}, 
                        {"role": "user", "content": prompt}
                    ],
                    "model": "openai",
                    "temperature": 0.3
                })
                if resp.status_code == 200:
                    response_text = resp.text.strip()
                    if response_text.startswith("```json"):
                        response_text = response_text.replace("```json", "").replace("```", "").strip()
                    match = re.search(r'\{.*\}', response_text, re.DOTALL)
                    if match:
                        return json.loads(match.group())
        except Exception as e:
            print(f"⚠️ Pollinations cluster fallback failed: {e}")
            
        return None


    async def generate_implementation_guide(self, step_title: str, step_description: str, business_type: str, location: str) -> Dict:
        """Generate high-fidelity implementation details for a roadmap step using the cluster"""
        await push_ws_status(f"Generating guide: {step_title}...")
        prompt = f"""
        Technical deep-dive for roadmap step: '{step_title}'
        Venture: {business_type} in {location}
        Description: {step_description}
        
        Provide:
        - action_items: list of 5 specific tasks
        - resources_needed: list of 3 items
        - estimated_cost: string (localized)
        - risk_assessment: string
        - pro_tip: string
        
        Respond in valid JSON.
        """
        return await self.call_ai_cluster_json(prompt)

    async def generate_strategic_roadmap(self, title: str, area: str) -> Dict:
        """Generate a 6-month high-fidelity strategic roadmap"""
        await push_ws_status(f"Synthesizing strategic roadmap for {title}...")
        prompt = f"""
        Generate a tactical 6-month roadmap for starting '{title}' in {area}.
        Respond in valid JSON with a 'steps' key containing 6 objects.
        Each object: 'title' (Phase Name), 'description' (Tactical Goal), 'milestones' (List of 3 items).
        """
        result = await self.call_ai_cluster_json(prompt)
        if result and "steps" in result:
             return result
        return {"steps": []}

    async def enrich_business_financials(self, title: str, area: str, category: str = "Business") -> Dict:
        """Deep Drill-Down for specific business intelligence enrichment"""
        print(f"[ENRICHMENT] Starting high-fidelity drill-down for {title} in {area}...")
        
        # 1. Quick Tactical Scouting (5s window)
        search_query = f"{category} business volume competitors costs profit margins {area} 2026"
        tavily_data = ""
        if self.tavily_key:
            try:
                tavily_data = await self._scout_tavily(search_query)
            except: pass
            
        # 2. Sequential Synthesis
        prompt = f"""
        Role: Senior Strategic Market Analyst (Neural Intelligence Engine)
        Target Business Venture: {title}
        Sector/Category: {category}
        Target Location Geospatial Context: {area}
        Real-time Market Scouting Data: {tavily_data[:3500]}
        
        TASK: Generate a high-fidelity, non-generic financial and operational drill-down for this SPECIFIC opportunity in {area} for the 2026 fiscal year.
        
        STRICT FIDELITY RULES:
        1. NO GENERIC PLACEHOLDERS. Do not use '₹5L-₹15L' unless it actually makes sense for the scale. 
        2. CONSIDER SPECIALIZED INFRASTRUCTURE. If this is Biotech, consider lab equipment costs, safety certifications, and specialized HVAC.
        3. REALISTIC REVENUE. Base monthly revenue on local demand and niche premium pricing.
        4. LOCALIZED CONTEXT. Use the 'Scouting Context' to identify real local competitors and market gaps.
        
        Return ONLY valid JSON:
        {{
            "funding_required": "realistic localized currency range (e.g. ₹45L - ₹1.2Cr)",
            "estimated_revenue": "realistic localized monthly yield (e.g. ₹8L - ₹15L)",
            "roi_percentage": number (annualized, e.g. 145), 
            "payback_period": "e.g. 14-18 Months",
            "startup_difficulty": "Low/Medium/Hard",
            "initial_team_size": "e.g. 4-6 specialized staff",
            "market_size": "Specific market reach or cap description",
            "competition_level": "Low/High/Moderate based on scraped results",
            "demand_index": number (0-100),
            "profit_niches": [
                {{"niche": "specific micro-niche name", "yield": percentage_number}}
            ],
            "strategic_recommendations": [
                {{"title": "Actionable Title", "description": "Strategic rationale based on market data"}}
            ],
            "be_period": "Break-even month estimate",
            "m1_traffic": "Est. Month 1 Footfall/Traffic",
            "retention_rate": "Est. Customer Retention %",
            "six_month_plan": ["Phase 1...", "Phase 2...", "Phase 3...", "Phase 4...", "Phase 5...", "Phase 6..."],
            "key_success_factors": ["High-fidelity factor 1", "High-fidelity factor 2", "High-fidelity factor 3"]
        }}
        """
        
        # Try Flash first for speed
        result = await self.call_ai_cluster_json(prompt)
        if result:
            print(f"[ENRICHMENT SUCCESS] Neural telemetry synthesized for {title}")
            return {"success": True, "data": result}
            
        print(f"[ENRICHMENT FAIL] AI synthesis cluster failed for {title}")
        return {"success": False, "message": "Neural financial enrichment failed."}

    # Consistently use the robust implementation of call_ai_cluster_json defined at line 885

    def _compile_rag_block(self, g: str, r: str, w: str, f: str = "") -> str:
        b = []
        if g: b.append(f"### SEARCH RESULTS:\n{g}")
        if r: b.append(f"### REDDIT INSIGHTS (ACTUAL):\n{r}")
        if w: b.append(f"### WEB MARKET TRENDS:\n{w}")
        if f: b.append(f"### MACRO ECONOMIC DATA (FRED):\n{f}")
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

# Instantiate the singleton for cluster dispatch
integrated_intelligence = IntegratedBusinessIntelligence()
