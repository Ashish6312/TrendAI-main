#!/usr/bin/env python3
"""
Test script to check all imports and identify the source of 500 errors
"""

print("Testing imports...")

try:
    print("1. Testing basic imports...")
    from fastapi import FastAPI
    print("✅ FastAPI imported successfully")
    
    from sqlalchemy.orm import Session
    print("✅ SQLAlchemy imported successfully")
    
    from pydantic import BaseModel
    print("✅ Pydantic imported successfully")
    
    print("\n2. Testing database imports...")
    from database import get_db, init_database, check_db_connection
    print("✅ Database imports successful")
    
    print("\n3. Testing models...")
    import models
    print("✅ Models imported successfully")
    
    print("\n4. Testing simple_recommendations...")
    from simple_recommendations import generate_ai_business_plan, generate_ai_roadmap
    print("✅ Simple recommendations imported successfully")
    
    print("\n5. Testing integrated_business_intelligence...")
    from integrated_business_intelligence import integrated_intelligence
    print("✅ Integrated business intelligence imported successfully")
    
    print("\n6. Testing DuckDuckGo search...")
    from duckduckgo_search import DDGS
    print("✅ DuckDuckGo search imported successfully")
    
    print("\n7. Testing database connection...")
    db_status = check_db_connection()
    print(f"✅ Database connection: {'SUCCESS' if db_status else 'FAILED'}")
    
    print("\n8. Testing database initialization...")
    init_status = init_database()
    print(f"✅ Database initialization: {'SUCCESS' if init_status else 'FAILED'}")
    
    print("\n✅ ALL IMPORTS SUCCESSFUL!")
    
except Exception as e:
    print(f"❌ IMPORT ERROR: {e}")
    import traceback
    traceback.print_exc()