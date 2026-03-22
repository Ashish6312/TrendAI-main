import sys
import os
from sqlalchemy import text
from database import engine, SessionLocal, init_database
import models

def reset_db():
    """Wipe all data for a fresh start"""
    print("\n⚠️  WARNING: Resetting database. This will delete ALL records!")
    try:
        from models import Base
        print("🗑️  Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("🏗️  Re-creating tables from scratch...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database reset complete. All previous records deleted.")
        return True
    except Exception as e:
        print(f"❌ Reset failed: {e}")
        return False

def run_migration():
    print("--- TrendAI Database Management Tool (v2.2) ---")
    
    # Check for reset flag in args
    import sys
    do_reset = "--reset" in sys.argv
    
    try:
        if do_reset:
            success = reset_db()
            if not success: sys.exit(1)
        else:
            # Standard migration
            print("🔍 Checking existing schema and creating missing tables...")
            init_database()
            print("✅ Core table synchronization complete.")

        # Verify connection
        db = SessionLocal()
        print("📡 Verifying database connectivity...")
        db.execute(text("SELECT 1"))
        print("✅ Connectivity verified.")

        if not do_reset:
            print("🛠️  Performing specialized column migrations...")
            try:
                # Ensure currency defaults to INR
                db.execute(text("ALTER TABLE payment_history ALTER COLUMN currency SET DEFAULT 'INR'"))
                db.execute(text("UPDATE payment_history SET currency = 'INR' WHERE currency IS NULL OR currency = 'USD'"))
                db.execute(text("ALTER TABLE user_subscriptions ALTER COLUMN currency SET DEFAULT 'INR'"))
                db.execute(text("UPDATE user_subscriptions SET currency = 'INR' WHERE currency IS NULL OR currency = 'USD'"))
                db.commit()
                print("✅ Currency migration complete.")
            except Exception as e:
                db.rollback()
                print(f"ℹ️  Column migration skipped: {e}")

        db.close()
        print("\n🚀 Operation successful. The system is ready for the new journey.")
        
    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
