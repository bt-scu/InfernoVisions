import { useState, useEffect, useCallback } from 'react';

type RoomState = 'default' | 'green' | 'red';

const FLOOR_PLAN_WIDTH = 960;
const FLOOR_PLAN_HEIGHT = 720;

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

  const _handleRoomClick = useCallback((roomId: string) => {
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
        viewBox={`0 0 ${FLOOR_PLAN_WIDTH} ${FLOOR_PLAN_HEIGHT}`}
        className="floor-plan-svg"
      >
        {/* Rooms will be populated once a rooms2.json is generated */}
      </svg>
    </div>
  );
}
