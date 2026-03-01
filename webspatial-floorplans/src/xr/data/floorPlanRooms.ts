/**
 * Room positions and sizes for floor-plan.png (960x720).
 * Coordinates map 1:1 to image pixels. Adjust x, y, width, height
 * to align rooms with the floor plan - use an image editor to
 * measure pixel positions from the floor plan.
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

// Room definitions traced from Heafey floor plan layout
export const FLOOR_PLAN_ROOMS: RoomDef[] = [
  // Left column - 101 (large), 102-106 (stacked)
  { id: '101', label: '101', x: 452, y: 50, width: 67, height: 157, baseColor: '#ffffff' },
  // { id: '102', label: '102', x: 48, y: 168, width: 125, height: 88, baseColor: '#ffffff' },
  // { id: '103', label: '103', x: 48, y: 262, width: 125, height: 88, baseColor: '#ffffff' },
  // { id: '104', label: '104', x: 48, y: 356, width: 125, height: 88, baseColor: '#ffffff' },
  // { id: '105', label: '105', x: 48, y: 450, width: 125, height: 88, baseColor: '#ffffff' },
  // { id: '106', label: '106', x: 48, y: 544, width: 125, height: 88, baseColor: '#ffffff' },
  // Top center - 107 (large), 108, 109
  // { id: '107', label: '107', x: 192, y: 32, width: 185, height: 160, baseColor: '#ffffff' },
  // { id: '108', label: '108', x: 392, y: 32, width: 105, height: 88, baseColor: '#ffffff' },
  // { id: '109', label: '109', x: 392, y: 126, width: 105, height: 88, baseColor: '#ffffff' },
  // // Right top - 110, 111, 112, 113, 114 (corridor), 115
  // { id: '110', label: '110', x: 512, y: 32, width: 105, height: 88, baseColor: '#ffffff' },
  // { id: '111', label: '111', x: 512, y: 126, width: 105, height: 88, baseColor: '#ffffff' },
  // { id: '112', label: '112', x: 512, y: 220, width: 105, height: 88, baseColor: '#ffffff' },
  // { id: '113', label: '113', x: 512, y: 314, width: 105, height: 88, baseColor: '#ffffff' },
  // { id: '114', label: '114', x: 392, y: 220, width: 105, height: 90, baseColor: '#e5e7eb' },
  // { id: '115', label: '115', x: 392, y: 316, width: 105, height: 88, baseColor: '#ffffff' },
  // // Vertical corridor (left of center)
  // { id: 'corridor-1', label: 'Corridor', x: 178, y: 198, width: 45, height: 280, baseColor: '#e5e7eb' },
  // // Open area (large central light blue)
  // { id: 'open', label: 'Open', x: 228, y: 198, width: 285, height: 310, baseColor: '#bae6fd' },
  // // Left of open - 116 (top), 117, 118, 119 (bottom) - vertical stack along left edge
  // { id: '116', label: '116', x: 48, y: 430, width: 120, height: 88, baseColor: '#ffffff' },
  // { id: '117', label: '117', x: 48, y: 524, width: 120, height: 88, baseColor: '#ffffff' },
  // { id: '118', label: '118', x: 48, y: 618, width: 120, height: 88, baseColor: '#ffffff' },
  // { id: '119', label: '119', x: 173, y: 524, width: 100, height: 95, baseColor: '#ffffff' },
  // // Bottom - 120, 121
  // { id: '120', label: '120', x: 228, y: 628, width: 110, height: 84, baseColor: '#ffffff' },
  // { id: '121', label: '121', x: 343, y: 628, width: 110, height: 84, baseColor: '#ffffff' },
  // // 122 - larger, near 123 stack
  // { id: '122', label: '122', x: 458, y: 514, width: 150, height: 198, baseColor: '#ffffff' },
  // // Right corridor
  // { id: 'corridor-2', label: 'Corridor', x: 518, y: 408, width: 50, height: 250, baseColor: '#e5e7eb' },
  // // Far right - 123-129
  // { id: '123', label: '123', x: 573, y: 408, width: 95, height: 72, baseColor: '#ffffff' },
  // { id: '124', label: '124', x: 573, y: 486, width: 95, height: 72, baseColor: '#ffffff' },
  // { id: '125', label: '125', x: 573, y: 564, width: 95, height: 72, baseColor: '#ffffff' },
  // { id: '126', label: '126', x: 673, y: 408, width: 95, height: 72, baseColor: '#ffffff' },
  // { id: '127', label: '127', x: 673, y: 486, width: 95, height: 72, baseColor: '#ffffff' },
  { id: '128', label: '128', x: 620, y: 413, width: 54, height: 26, baseColor: '#ffffff' },
  { id: '129', label: '129', x: 620, y: 387, width: 54, height: 26, baseColor: '#ffffff' },
];
