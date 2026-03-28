import logging
from database import init_database, check_db_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("--- [STARTUP TEST] Starting DB Init ---")
if init_database():
    print("✅ DB Init SUCCESS")
    if check_db_connection():
         print("✅ DB Connection SUCCESS")
    else:
         print("❌ DB Connection FAILED")
else:
    print("❌ DB Init FAILED")
print("--- [STARTUP TEST] Finished ---")
