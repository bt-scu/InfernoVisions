import { useState, useEffect, useCallback } from 'react';
import { fetchBuilding, patchRoomStatus, invalidateBuildingCache } from '../api/buildingApi';
import type { RoomDef } from '../data/floorPlanRooms';

export type RoomState = 'default' | 'green' | 'red';

// DB status string → UI RoomState
const STATUS_TO_STATE: Record<string, RoomState> = {
  clear:   'default',
  cleared: 'green',
  hazard:  'red',
};

// UI RoomState → DB status string
const STATE_TO_STATUS: Record<RoomState, string> = {
  default: 'clear',
  green:   'cleared',
  red:     'hazard',
};

const STATE_CYCLE: Record<RoomState, RoomState> = {
  default: 'green',
  green:   'red',
  red:     'default',
};

const SRC_W = 1668;
const SRC_H = 1251;
const CANVAS_W = 960;
const CANVAS_H = 720;

function mapToRoomDef(r: { room_number: string; x_pos: number; y_pos: number; width: number; height: number }): RoomDef {
  return {
    id: r.room_number,
    label: r.room_number,
    x: Math.round(r.x_pos * CANVAS_W / SRC_W),
    y: Math.round(r.y_pos * CANVAS_H / SRC_H),
    width: Math.round(r.width * CANVAS_W / SRC_W),
    height: Math.round(r.height * CANVAS_H / SRC_H),
    baseColor: '#ffffff',
  };
}

export function useBuildingFloor(buildingName: string, floorLevel: number) {
  const [rooms, setRooms] = useState<RoomDef[]>([]);
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchBuilding(buildingName)
      .then(building => {
        if (cancelled) return;
        const floor = building.floors.find(f => f.level === floorLevel);
        if (!floor) {
          setError(`Floor ${floorLevel} not found in building '${buildingName}'`);
          setLoading(false);
          return;
        }

        const mappedRooms = floor.rooms.map(mapToRoomDef);
        const initialStates: Record<string, RoomState> = {};
        for (const r of floor.rooms) {
          initialStates[r.room_number] = STATUS_TO_STATE[r.status] ?? 'default';
        }

        setRooms(mappedRooms);
        setRoomStates(initialStates);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [buildingName, floorLevel]);

  const handleRoomClick = useCallback((roomId: string) => {
    setRoomStates(prev => {
      const current = prev[roomId] ?? 'default';
      const next = STATE_CYCLE[current];

      // Optimistic update
      const updated = { ...prev, [roomId]: next };

      // Fire-and-forget PATCH — rollback on failure
      patchRoomStatus(buildingName, floorLevel, roomId, STATE_TO_STATUS[next])
        .catch(() => {
          // Rollback to previous state on failure
          setRoomStates(latest => ({ ...latest, [roomId]: current }));
          invalidateBuildingCache(buildingName);
        });

      return updated;
    });
  }, [buildingName, floorLevel]);

  return { rooms, roomStates, handleRoomClick, loading, error };
}
