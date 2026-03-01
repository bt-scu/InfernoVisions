import { useState, useEffect, useCallback } from 'react';
import { FLOOR_PLAN_WIDTH, FLOOR_PLAN_HEIGHT } from '../data/floorPlanRooms';
import type { RoomDef } from '../data/floorPlanRooms';
import { fetchFloorPlanRooms } from '../data/roomsService';

const STORAGE_KEY = 'floor-plan-toggled-rooms';

function loadToggledRooms(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveToggledRooms(toggled: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toggled));
  } catch { /* ignore */ }
}

export function FloorPlan() {
  const [rooms, setRooms] = useState<RoomDef[]>([]);
  const [toggled, setToggled] = useState<Record<string, boolean>>(loadToggledRooms);

  useEffect(() => {
    fetchFloorPlanRooms().then(setRooms).catch(console.error);
  }, []);

  useEffect(() => {
    saveToggledRooms(toggled);
  }, [toggled]);

  const handleRoomClick = useCallback((roomId: string) => {
    setToggled(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  }, []);

  return (
    <div className="floor-plan">
      <svg
        viewBox={`0 0 ${FLOOR_PLAN_WIDTH} ${FLOOR_PLAN_HEIGHT}`}
        className="floor-plan-svg"
      >
        {rooms.map(room => {
          const isToggled = !!toggled[room.id];
          return (
            <g key={room.id} onClick={() => handleRoomClick(room.id)} className="floor-plan-room">
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill={isToggled ? '#22c55e' : '#ffffff'}
                fillOpacity={isToggled ? 0.5 : 0.35}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={1}
                rx={4}
                ry={4}
              />
              <text
                x={room.x + room.width / 2}
                y={room.y + room.height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                className="floor-plan-label"
                fontSize={room.width < 60 || room.height < 50 ? 10 : 13}
              >
                {room.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
