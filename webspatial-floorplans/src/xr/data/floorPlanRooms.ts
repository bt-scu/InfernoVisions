/**
 * Room type definitions and display constants for the floor plan.
 * Room data is fetched at runtime from the FastAPI /rooms endpoint
 * via roomsService.ts.
 */

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
