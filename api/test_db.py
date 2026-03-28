import os
import sys
import ssl
import pg8000.dbapi
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ No DATABASE_URL found in .env")
    sys.exit(1)

# Parsing the DATABASE_URL manually for pg8000
# Format: postgresql://user:password@host/dbname
print(f"URL: {DATABASE_URL}")
try:
    # Basic parsing for postgresql:// scheme
    url = DATABASE_URL
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "")
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "")
        
    user_pass, host_db = url.split("@")
    user, password = user_pass.split(":")
    
    # Split host and dbname, and also handle potential query params
    host_db_part = host_db.split("?")[0]
    if "/" in host_db_part:
        host, dbname = host_db_part.split("/", 1)
    else:
        host = host_db_part
        dbname = "postgres"

    print(f"Host: {host}")
    print(f"User: {user}")
    print(f"DB: {dbname}")

    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    print("🔌 Attempting connection (timeout=10s)...")
    conn = pg8000.dbapi.connect(
        user=user,
        password=password,
        host=host,
        database=dbname,
        ssl_context=ssl_ctx,
        timeout=10
    )
    print("✅ Connection SUCCESS!")
    conn.close()
except Exception as e:
    print(f"❌ Connection FAILED: {e}")
