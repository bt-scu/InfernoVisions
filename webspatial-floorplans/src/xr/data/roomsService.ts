import type { RoomDef } from './floorPlanRooms';
import { FLOOR_PLAN_WIDTH, FLOOR_PLAN_HEIGHT } from './floorPlanRooms';

const API_BASE = 'http://localhost:8000';

interface RawRoom {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  area_px: number;
}

interface RoomsResponse {
  meta: { image_size_px: [number, number] };
  rooms: RawRoom[];
}

let cached: RoomDef[] | null = null;

export async function fetchFloorPlanRooms(): Promise<RoomDef[]> {
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/rooms`);
  if (!res.ok) throw new Error(`Failed to fetch rooms: ${res.status}`);

  const data: RoomsResponse = await res.json();
  const [srcW, srcH] = data.meta.image_size_px;

  cached = data.rooms.map(r => ({
    id: String(r.id),
    label: `1${String(r.id).padStart(2, '0')}`,
    x: Math.round(r.x * FLOOR_PLAN_WIDTH / srcW),
    y: Math.round(r.y * FLOOR_PLAN_HEIGHT / srcH),
    width: Math.round(r.width * FLOOR_PLAN_WIDTH / srcW),
    height: Math.round(r.height * FLOOR_PLAN_HEIGHT / srcH),
    baseColor: '#ffffff',
  }));

  return cached;
}

export function invalidateRoomsCache() {
  cached = null;
}
