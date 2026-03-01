/**
 * Room positions and sizes for floor-plan-2.png (960x720).
 * Data is sourced from rooms_corrected_schema_floor2.json and scaled
 * from the source image dimensions (1668x1251) to the display canvas.
 */

import buildingData from '../../../../fast-api-app/rooms_corrected_schema_floor2.json';

export const FLOOR_PLAN_2_WIDTH = 960;
export const FLOOR_PLAN_2_HEIGHT = 720;

const SRC_W = 1668;
const SRC_H = 1251;

export interface RoomDef2 {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseColor: string;
}

const floor2 = buildingData.floors.find(f => f.level === 2);

export const FLOOR_PLAN_2_ROOMS: RoomDef2[] = (floor2?.rooms ?? []).map(r => ({
  id: r.room_number,
  label: r.room_number,
  x: Math.round(r.x_pos * FLOOR_PLAN_2_WIDTH / SRC_W),
  y: Math.round(r.y_pos * FLOOR_PLAN_2_HEIGHT / SRC_H),
  width: Math.round(r.width * FLOOR_PLAN_2_WIDTH / SRC_W),
  height: Math.round(r.height * FLOOR_PLAN_2_HEIGHT / SRC_H),
  baseColor: '#ffffff',
}));
