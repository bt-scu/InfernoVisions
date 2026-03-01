export const FLOOR_PLAN_WIDTH = 960;
export const FLOOR_PLAN_HEIGHT = 720;

export interface RoomDef {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseColor: string;
}

// Empty — rooms are now loaded from the API at runtime
export const FLOOR_PLAN_ROOMS: RoomDef[] = [];
