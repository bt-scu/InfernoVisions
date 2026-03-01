/**
 * Room positions and sizes for floor-plan.png (431x672).
 * Data is sourced from rooms.json (detected room geometry) and
 * scaled from the source image dimensions to the display canvas.
 */

import roomsData from '../../../../fast-api-app/rooms.json';

export const FLOOR_PLAN_WIDTH = 431;
export const FLOOR_PLAN_HEIGHT = 672;

export interface RoomDef {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseColor: string;
}

const [srcW, srcH] = roomsData.meta.image_size_px;

export const FLOOR_PLAN_ROOMS: RoomDef[] = roomsData.rooms.map(r => ({
  id: String(r.id),
  label: `1${String(r.id).padStart(2, '0')}`,
  x: Math.round(r.x * FLOOR_PLAN_WIDTH / srcW),
  y: Math.round(r.y * FLOOR_PLAN_HEIGHT / srcH),
  width: Math.round(r.width * FLOOR_PLAN_WIDTH / srcW),
  height: Math.round(r.height * FLOOR_PLAN_HEIGHT / srcH),
  baseColor: '#ffffff',
}));
