/**
 * Room positions and sizes for floor-plan.png (960x720).
 * Data is sourced from rooms_corrected_schema.json and scaled
 * from the source image dimensions (1668x1251) to the display canvas.
 */

import buildingData from '../../../../fast-api-app/rooms_corrected_schema.json';

export const FLOOR_PLAN_WIDTH = 960;
export const FLOOR_PLAN_HEIGHT = 720;

const SRC_W = 1668;
const SRC_H = 1251;

export interface RoomDef {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseColor: string;
}

const floor1 = buildingData.floors.find(f => f.level === 1);

export const FLOOR_PLAN_ROOMS: RoomDef[] = (floor1?.rooms ?? []).map(r => ({
  id: r.room_number,
  label: r.room_number,
  x: Math.round(r.x_pos * FLOOR_PLAN_WIDTH / SRC_W),
  y: Math.round(r.y_pos * FLOOR_PLAN_HEIGHT / SRC_H),
  width: Math.round(r.width * FLOOR_PLAN_WIDTH / SRC_W),
  height: Math.round(r.height * FLOOR_PLAN_HEIGHT / SRC_H),
  baseColor: '#ffffff',
}));
