import { useState, useEffect, useCallback } from 'react';
import { FLOOR_PLAN_2_ROOMS, FLOOR_PLAN_2_WIDTH, FLOOR_PLAN_2_HEIGHT } from '../data/floorPlanRooms2';

type RoomState = 'default' | 'green' | 'red';

const STORAGE_KEY = 'floor-plan-2-room-states';

const ROOM_COLORS: Record<RoomState, { fill: string; opacity: number }> = {
  default: { fill: '#ffffff', opacity: 0.35 },
  green:   { fill: '#22c55e', opacity: 0.5 },
  red:     { fill: '#ef4444', opacity: 0.5 },
};

const STATE_CYCLE: Record<RoomState, RoomState> = {
  default: 'green',
  green: 'red',
  red: 'default',
};

function loadRoomStates(): Record<string, RoomState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveRoomStates(states: Record<string, RoomState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch { /* ignore */ }
}

export function FloorPlan2() {
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>(loadRoomStates);

  useEffect(() => {
    saveRoomStates(roomStates);
  }, [roomStates]);

  const handleRoomClick = useCallback((roomId: string) => {
    setRoomStates(prev => {
      const current = prev[roomId] ?? 'default';
      const next = STATE_CYCLE[current];
      if (next === 'default') {
        const { [roomId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [roomId]: next };
    });
  }, []);

  return (
    <div className="floor-plan floor-plan-2">
      <svg
        viewBox={`0 0 ${FLOOR_PLAN_2_WIDTH} ${FLOOR_PLAN_2_HEIGHT}`}
        className="floor-plan-svg"
      >
        {FLOOR_PLAN_2_ROOMS.map(room => {
          const state = roomStates[room.id] ?? 'default';
          const { fill, opacity } = ROOM_COLORS[state];
          return (
            <g key={room.id} onClick={() => handleRoomClick(room.id)} className="floor-plan-room">
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill={fill}
                fillOpacity={opacity}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={1}
                rx={4}
                ry={4}
              />
              {state === 'default' && (
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
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
