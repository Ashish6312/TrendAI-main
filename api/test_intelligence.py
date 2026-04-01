import asyncio
import json
import os
from dotenv import load_dotenv
from integrated_business_intelligence import IntegratedBusinessIntelligence, register_ws_pusher

# Mock WebSocket pusher for testing
async def mock_ws_pusher(data):
    print(f"📡 [WS-PUSH] {data.get('message')}")

async def run_test_analysis(area: str):
    load_dotenv()
    
    print(f"🚀 [TEST] Initializing Singularity Engine V6.4 for: {area}")
    register_ws_pusher(mock_ws_pusher)
    
    intel = IntegratedBusinessIntelligence()
    
    # Run the high-fidelity analysis pipeline
    result = await intel.generate_data_driven_recommendations(
        area=area,
        email="test@starterscope.com",
        language="English",
        phase="discovery"
    )
    
    if result.get("success"):
        print("\n" + "="*50)
        print(f"✅ ANALYSIS SUCCESSFUL FOR {area}")
        print(f"📊 SOURCE: {result.get('ai_source')}")
        print(f"🧠 FIDELITY: {result.get('intelligence_fidelity')}")
        print("="*50)
        
        analysis = result.get("analysis", {})
        print(f"\n📝 EXECUTIVE SUMMARY:\n{analysis.get('executive_summary', 'No summary available.')[:500]}...")
        
        recs = result.get("recommendations", [])
        print(f"\n💡 TOP 3 OPPORTUNITIES:")
        for i, rec in enumerate(recs[:3], 1):
            print(f"{i}. {rec.get('title')} ({rec.get('category')})")
            print(f"   Gap: {rec.get('market_gap')}")
            print(f"   ROI: {rec.get('roi_potential')} | BE: {rec.get('be_period')}")
            print("-" * 20)
    else:
        print(f"❌ ANALYSIS FAILED: {result.get('message')}")

if __name__ == "__main__":
    test_area = "Berasia, Madhya Pradesh, India"
    asyncio.run(run_test_analysis(test_area))
