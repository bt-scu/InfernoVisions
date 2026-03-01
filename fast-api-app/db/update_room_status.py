from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def update_room_status(db: AsyncSession, data: dict):
    # 1. Look up the building by name
    result = await db.execute(
        text("SELECT id FROM buildings WHERE name = :name"),
        {"name": data["name"]}
    )
    building_id = result.scalar()
    if not building_id:
        raise ValueError(f"Building '{data['name']}' not found")

    updated_count = 0

    for floor_data in data["floors"]:
        # 2. Look up the floor
        result = await db.execute(
            text("SELECT id FROM floors WHERE building_id = :building_id AND level_number = :level_number"),
            {"building_id": building_id, "level_number": floor_data["level"]}
        )
        floor_id = result.scalar()
        if not floor_id:
            continue

        # 3. Update each room on this floor
        for room in floor_data["rooms"]:
            result = await db.execute(
                text("""
                    UPDATE rooms SET
                        status = :status,
                        firefighters = :firefighters,
                        x_pos = :x_pos,
                        y_pos = :y_pos,
                        width = :width,
                        height = :height,
                        shape_type = :shape_type,
                        updated_at = NOW()
                    WHERE room_number = :room_number
                      AND floor_id = :floor_id
                      AND building_id = :building_id
                """),
                {
                    "status": room["status"],
                    "firefighters": room["firefighters"],
                    "x_pos": room["x_pos"],
                    "y_pos": room["y_pos"],
                    "width": room["width"],
                    "height": room["height"],
                    "shape_type": room["shape_type"],
                    "room_number": room["room_number"],
                    "floor_id": floor_id,
                    "building_id": building_id,
                }
            )
            updated_count += result.rowcount

    await db.commit()
    return {"updated_rooms": updated_count}