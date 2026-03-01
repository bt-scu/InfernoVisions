// api/rooms.ts

export enum RoomStatus {
  CLEAR = "CLEAR",
  SMOKE = "SMOKE",
  FIRE = "FIRE",
  UNKNOWN = "UNKNOWN",
}

// What your backend update_room_status expects
type UpdateRoomPayload = {
  name: string; // building name
  floors: Array<{
    level: number; // floor level_number
    rooms: Array<{
      room_number: string;
      status: RoomStatus | string;
      firefighter_name: string;
      x_pos: number;
      y_pos: number;
      width: number;
      height: number;
      shape_type: string;
    }>;
  }>;
};

export type RoomGeometry = {
  x_pos: number;
  y_pos: number;
  width: number;
  height: number;
  shape_type: string;
};

export type CurrentContext = {
  buildingName: string;
  floorLevel: number;
};

const API_BASE = "http://localhost:8000";
const CONTEXT_KEY = "inferno.currentContext";

// --- Context (current open building/floor) ---

export function setCurrentContext(ctx: CurrentContext) {
  localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
}

export function getCurrentContext(): CurrentContext {
  const raw = localStorage.getItem(CONTEXT_KEY);
  if (!raw) throw new Error("No current building/floor selected.");
  return JSON.parse(raw) as CurrentContext;
}

// --- HTTP helper ---

async function apiPostJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return (await res.text()) as unknown as T;
  return (await res.json()) as T;
}

export type UpdateRoomStatusResult = { updated_rooms: number };

// --- Core function: update ONE room using your backend payload shape ---

/**
 * Updates a single room using the backend update_room_status(data) format.
 *
 * IMPORTANT: Because the backend requires geometry fields, you must supply them.
 * If you don't have them in UI state, fetch the room first (recommended) and pass them in.
 */
export async function updateRoom(params: {
  roomNumber: string; // maps to room_number in DB
  status: RoomStatus;
  firefighterName?: string;
  geometry: RoomGeometry;
  endpointPath: string; // e.g. "/update-room-status" (whatever your FastAPI route is)
}): Promise<UpdateRoomStatusResult> {
  const ctx = getCurrentContext();

  const payload: UpdateRoomPayload = {
    name: ctx.buildingName,
    floors: [
      {
        level: ctx.floorLevel,
        rooms: [
          {
            room_number: params.roomNumber,
            status: params.status,
            firefighter_name: params.firefighterName ?? "",
            x_pos: params.geometry.x_pos,
            y_pos: params.geometry.y_pos,
            width: params.geometry.width,
            height: params.geometry.height,
            shape_type: params.geometry.shape_type,
          },
        ],
      },
    ],
  };

  return apiPostJSON<UpdateRoomStatusResult>(params.endpointPath, payload);
}

// --- Convenience: update MANY rooms on the current floor ---

export async function updateRoomsOnCurrentFloor(params: {
  rooms: Array<{
    roomNumber: string;
    status: RoomStatus;
    firefighterName?: string;
    geometry: RoomGeometry;
  }>;
  endpointPath: string;
}): Promise<UpdateRoomStatusResult> {
  const ctx = getCurrentContext();

  const payload: UpdateRoomPayload = {
    name: ctx.buildingName,
    floors: [
      {
        level: ctx.floorLevel,
        rooms: params.rooms.map((r) => ({
          room_number: r.roomNumber,
          status: r.status,
          firefighter_name: r.firefighterName ?? "",
          x_pos: r.geometry.x_pos,
          y_pos: r.geometry.y_pos,
          width: r.geometry.width,
          height: r.geometry.height,
          shape_type: r.geometry.shape_type,
        })),
      },
    ],
  };

  return apiPostJSON<UpdateRoomStatusResult>(params.endpointPath, payload);
}