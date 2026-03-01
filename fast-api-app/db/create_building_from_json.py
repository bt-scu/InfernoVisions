from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def create_building_from_json(db: AsyncSession, data: dict):
    # 1. Insert the building (Changed "building_name" to "name")
    result = await db.execute(
        text("INSERT INTO buildings (name) VALUES (:name) RETURNING id, name"),
        {"name": data["name"]} 
    )
    building = result.mappings().fetchone()
    building_id = building["id"]

    for floor_data in data["floors"]:
        # 2. Insert the floor
        result = await db.execute(
            text("INSERT INTO floors (level_number, building_id) VALUES (:level_number, :building_id) RETURNING id"),
            {"level_number": floor_data["level"], "building_id": building_id}
        )
        floor_id = result.scalar()

        # 3. Insert the rooms with ALL required metadata
        for room in floor_data["rooms"]:
            await db.execute(
                text("""
                    INSERT INTO rooms (
                        room_number, status, firefighter_name, 
                        x_pos, y_pos, width, height, 
                        shape_type, floor_id, building_id
                    ) VALUES (
                        :room_number, :status, :firefighter_name, 
                        :x_pos, :y_pos, :width, :height, 
                        :shape_type, :floor_id, :building_id
                    )
                """),
                {
                    "room_number": room["room_number"],
                    "status": room["status"],
                    "firefighter_name": room["firefighter_name"],
                    "x_pos": room["x_pos"],
                    "y_pos": room["y_pos"],
                    "width": room["width"],
                    "height": room["height"],
                    "shape_type": room["shape_type"],
                    "floor_id": floor_id,
                    "building_id": building_id
                }
            )

    await db.commit()
    return building