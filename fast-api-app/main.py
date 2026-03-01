from pathlib import Path
import json

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from db.create_engine import engine
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from db.create_building_from_json import create_building_from_json
from db.get_building_state import get_building_state
from db.update_room_status import update_room_status
from db.patch_room_status import patch_room_status
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOMS_JSON_PATH = Path(__file__).resolve().parent / "rooms.json"


@app.get("/")
def read_root():
    return {"message": "Hello World"}


@app.get("/rooms")
def get_rooms():
    try:
        data = json.loads(ROOMS_JSON_PATH.read_text())
        return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="rooms.json not found")


@app.get("/db-connect-test")
async def db_test():
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            row = result.scalar()
            return {"status": "connected", "result": row}
    except Exception as e:
        return {"status": "error", "detail": str(e)}


AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 2. Define the Dependency (The Worker)
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@app.post("/db-insert-test")
async def test_insert_building(data: dict, db: AsyncSession = Depends(get_db)):
    try:
        building = await create_building_from_json(db, data)
        return {
            "status": "success",
            "message": f"Building '{building['name']}' created with ID {building['id']}"
        }
    except Exception as e:
        traceback.print_exc()  # <-- this prints file+line in container logs
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/building/{building_name}")
async def test_get_building(building_name: str, db: AsyncSession = Depends(get_db)):
    result = await get_building_state(db, building_name)
    if not result:
        raise HTTPException(status_code=404, detail=f"Building '{building_name}' not found")
    return result


@app.patch("/building/{building_name}/floor/{level}/room/{room_number}")
async def patch_single_room_status(
    building_name: str,
    level: int,
    room_number: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await patch_room_status(db, building_name, level, room_number, body["status"])
        return {"status": "success", **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except KeyError:
        raise HTTPException(status_code=400, detail="Request body must include 'status'")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/update-rooms")
async def test_update_rooms(data: dict, db: AsyncSession = Depends(get_db)):
    try:
        result = await update_room_status(db, data)
        return {"status": "success", **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
