const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface ApiRoom {
  room_number: string;
  status: string;
  firefighters: string | null;
  x_pos: number;
  y_pos: number;
  width: number;
  height: number;
  shape_type: string;
  updated_at: string;
}

export interface ApiFloor {
  level: number;
  rooms: ApiRoom[];
}

export interface ApiBuilding {
  name: string;
  floors: ApiFloor[];
}

// Module-level cache — both FloorPlan and FloorPlan2 share one fetch
const cache = new Map<string, ApiBuilding>();

export async function fetchBuilding(buildingName: string): Promise<ApiBuilding> {
  if (cache.has(buildingName)) return cache.get(buildingName)!;

  const res = await fetch(`${API_URL}/building/${encodeURIComponent(buildingName)}`);
  if (!res.ok) throw new Error(`Failed to fetch building: ${res.status} ${res.statusText}`);

  const data: ApiBuilding = await res.json();
  cache.set(buildingName, data);
  return data;
}

export function invalidateBuildingCache(buildingName: string) {
  cache.delete(buildingName);
}

export async function patchRoomStatus(
  buildingName: string,
  level: number,
  roomNumber: string,
  status: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/building/${encodeURIComponent(buildingName)}/floor/${level}/room/${encodeURIComponent(roomNumber)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  );
  if (!res.ok) throw new Error(`Failed to update room: ${res.status} ${res.statusText}`);
}
