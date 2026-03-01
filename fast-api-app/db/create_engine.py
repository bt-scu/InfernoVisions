import asyncio
import os
import ssl
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# 1. Load the URL from your .env
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Setup SSL context for Supabase pooler
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# 3. Setup the Async Engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"ssl": ssl_context}
)

# async def run_test():
#     print("🚀 Starting Database Connection Test...")
#     try:
#         # 3. Try to establish a connection
#         async with engine.connect() as conn:
#             # 4. Run a simple query to ask the DB for its version
#             result = await conn.execute(text("SELECT version();"))
#             db_version = result.scalar()
            
#             print("\n" + "="*30)
#             print("✅ CONNECTION SUCCESSFUL!")
#             print(f"📡 DB Version: {db_version}")
#             print("="*30 + "\n")
            
#     except Exception as e:
#         print("\n" + "!"*30)
#         print("❌ CONNECTION FAILED")
#         print(f"Error Type: {type(e).__name__}")
#         print(f"Details: {e}")
#         print("!"*30 + "\n")
#     finally:
#         # 5. Clean up the engine pool
#         await engine.dispose()

# if __name__ == "__main__":
#     asyncio.run(run_test())