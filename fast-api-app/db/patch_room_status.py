from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def patch_room_status(
    db: AsyncSession,
    building_name: str,
    level: int,
    room_number: str,
    status: str,
):
    result = await db.execute(
        text("SELECT id FROM buildings WHERE name = :name"),
        {"name": building_name},
    )
    building_id = result.scalar()
    if not building_id:
        raise ValueError(f"Building '{building_name}' not found")

    result = await db.execute(
        text(
            "SELECT id FROM floors WHERE building_id = :building_id AND level_number = :level"
        ),
        {"building_id": building_id, "level": level},
    )
    floor_id = result.scalar()
    if not floor_id:
        raise ValueError(f"Floor {level} not found in building '{building_name}'")

    result = await db.execute(
        text("""
            UPDATE rooms
            SET status = :status, updated_at = NOW()
            WHERE room_number = :room_number
              AND floor_id = :floor_id
              AND building_id = :building_id
        """),
        {
            "status": status,
            "room_number": room_number,
            "floor_id": floor_id,
            "building_id": building_id,
        },
    )
    await db.commit()

    if result.rowcount == 0:
        raise ValueError(f"Room '{room_number}' not found on floor {level}")

    return {"updated_rooms": result.rowcount}
