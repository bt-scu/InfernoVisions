from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def get_building_state(db: AsyncSession, building_name: str):
    # 1. Get the building
    result = await db.execute(
        text("SELECT id, name FROM buildings WHERE name = :name"),
        {"name": building_name}
    )
    building = result.mappings().fetchone()
    if not building:
        return None

    # 2. Get all floors for this building
    result = await db.execute(
        text("SELECT id, level_number FROM floors WHERE building_id = :building_id ORDER BY level_number"),
        {"building_id": building["id"]}
    )
    floors = result.mappings().fetchall()

    # 3. Build the response, getting rooms for each floor
    floors_out = []
    for floor in floors:
        result = await db.execute(
            text("""
                SELECT room_number, status, firefighter_name,
                       x_pos, y_pos, width, height, shape_type, updated_at
                FROM rooms
                WHERE floor_id = :floor_id AND building_id = :building_id
                ORDER BY room_number
            """),
            {"floor_id": floor["id"], "building_id": building["id"]}
        )
        rooms = [dict(r) for r in result.mappings().fetchall()]
        floors_out.append({
            "level": floor["level_number"],
            "rooms": rooms
        })

    return {
        "name": building["name"],
        "floors": floors_out
    }