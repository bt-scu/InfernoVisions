// Data model and state management for moodboard items

export type ItemKind = 'image' | 'room' | 'text' | 'swatch'; // 'swatch' = legacy, treated as room

export interface Item {
  id: string;
  kind: ItemKind;
  x: number;        // px position in board space
  y: number;
  z: number;        // depth in pt (0, 24, 48, 80)
  zIndex: number;   // same-plane ordering
  rot: number;      // rotateZ degrees
  scale: number;    // scale factor
  src?: string;     // for images
  text?: string;    // for text chips
  color?: string;   // for rooms
  width?: number;   // for rooms - custom width
  height?: number;  // for rooms - custom height
  tags: string[];
  // Enhanced layer properties
  name?: string;    // custom layer name
  visible: boolean; // visibility toggle
  locked: boolean;  // lock editing
  opacity: number;  // 0-1 opacity
}

export interface BoardState {
  items: Item[];
  selectedIds: string[];
}

// Valid depth steps in pt
export const DEPTH_STEPS = [0, 24, 48, 80];
export const FOCUS_LIFT = 6; // Temporary elevation on focus

// Default room dimensions (used when width/height not set)
export const DEFAULT_ROOM_WIDTH = 85;
export const DEFAULT_ROOM_HEIGHT = 95;

/** Get dimensions for a room/swatch item */
export function getRoomDimensions(item: Item): { width: number; height: number } {
  if (item.kind !== 'room' && item.kind !== 'swatch') {
    return { width: 180, height: 60 }; // text fallback
  }
  return {
    width: item.width ?? DEFAULT_ROOM_WIDTH,
    height: item.height ?? DEFAULT_ROOM_HEIGHT,
  };
}

// Helper to snap to nearest depth step
export function snapToDepthStep(z: number): number {
  return DEPTH_STEPS.reduce((prev, curr) =>
    Math.abs(curr - z) < Math.abs(prev - z) ? curr : prev
  );
}

// Helper to get next/previous depth step
export function getNextDepthStep(current: number, direction: 'up' | 'down'): number {
  const snapped = snapToDepthStep(current);
  const index = DEPTH_STEPS.indexOf(snapped);

  if (direction === 'up') {
    return DEPTH_STEPS[Math.min(index + 1, DEPTH_STEPS.length - 1)];
  } else {
    return DEPTH_STEPS[Math.max(index - 1, 0)];
  }
}

// Generate unique ID
export function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new item
export function createItem(
  kind: ItemKind,
  position: { x: number; y: number },
  data: Partial<Item> = {}
): Item {
  return {
    id: generateId(),
    kind,
    x: position.x,
    y: position.y,
    z: 24, // Default to middle depth
    zIndex: 0,
    rot: Math.random() * 6 - 3, // Random slight rotation -3 to 3 degrees
    scale: 1,
    tags: [],
    // Enhanced layer defaults
    visible: true,
    locked: false,
    opacity: 1,
    ...data,
  };
}

// State reducer actions
export type BoardAction =
  | { type: 'ADD_ITEM'; item: Item }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_ITEM'; id: string; updates: Partial<Item> }
  | { type: 'SELECT_ITEM'; id: string | undefined; multi?: boolean }
  | { type: 'SELECT_MULTIPLE'; ids: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'MOVE_ITEM'; id: string; x: number; y: number }
  | { type: 'SET_DEPTH'; id: string; z: number }
  | { type: 'BRING_TO_FRONT'; id: string }
  | { type: 'SEND_TO_BACK'; id: string }
  | { type: 'SET_ITEMS'; items: Item[] }
  | { type: 'CLEAR_ALL' }
  // Enhanced layer actions
  | { type: 'TOGGLE_VISIBILITY'; id: string }
  | { type: 'TOGGLE_LOCK'; id: string }
  | { type: 'RENAME_ITEM'; id: string; name: string }
  | { type: 'SET_OPACITY'; id: string; opacity: number }
  | { type: 'BULK_TOGGLE_VISIBILITY'; ids: string[] }
  | { type: 'BULK_TOGGLE_LOCK'; ids: string[] }
  | { type: 'BULK_DELETE'; ids: string[] }
  | { type: 'ALIGN_GRID_SMART' };

// State reducer
export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.item],
      };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.id),
        selectedIds: state.selectedIds.filter(id => id !== action.id),
      };

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id ? { ...item, ...action.updates } : item
        ),
      };

    case 'SELECT_ITEM':
      if (action.id === undefined) {
        return { ...state, selectedIds: [] };
      }

      if (action.multi) {
        // Toggle selection with ctrl/cmd
        const isSelected = state.selectedIds.includes(action.id);
        return {
          ...state,
          selectedIds: isSelected
            ? state.selectedIds.filter(id => id !== action.id)
            : [...state.selectedIds, action.id],
        };
      }

      return {
        ...state,
        selectedIds: [action.id],
      };

    case 'SELECT_MULTIPLE':
      return {
        ...state,
        selectedIds: action.ids,
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedIds: [],
      };

    case 'MOVE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id
            ? { ...item, x: action.x, y: action.y }
            : item
        ),
      };

    case 'SET_DEPTH': {
      const snappedZ = snapToDepthStep(action.z);
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id
            ? { ...item, z: snappedZ }
            : item
        ),
      };
    }

    case 'BRING_TO_FRONT': {
      const item = state.items.find(i => i.id === action.id);
      if (!item) return state;

      // Ensure item is at a valid depth step, snap to nearest if not
      const snappedZ = snapToDepthStep(item.z);

      // Find items at same depth
      const sameDepthItems = state.items.filter(i => i.z === snappedZ && i.id !== action.id);
      const maxZIndex = sameDepthItems.reduce((max, i) => Math.max(max, i.zIndex), -Infinity);

      // If already at front (or alone), move to next depth layer
      if (sameDepthItems.length === 0 || item.zIndex >= maxZIndex) {
        const currentIndex = DEPTH_STEPS.indexOf(snappedZ);
        // Only move to higher depth if we're below max depth
        if (currentIndex >= 0 && currentIndex < DEPTH_STEPS.length - 1) {
          const nextDepth = DEPTH_STEPS[currentIndex + 1];
          // Find min zIndex at new depth to place behind all items there
          const newDepthItems = state.items.filter(i => i.z === nextDepth);
          const minZIndexAtNewDepth = newDepthItems.reduce((min, i) => Math.min(min, i.zIndex), 0);
          return {
            ...state,
            items: state.items.map(i =>
              i.id === action.id ? { ...i, z: nextDepth, zIndex: minZIndexAtNewDepth - 1 } : i
            ),
          };
        }
        // Already at maximum depth (80) - don't go higher
        return state;
      }

      // Otherwise, bring to front within current depth
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, zIndex: maxZIndex + 1 } : i
        ),
      };
    }

    case 'SEND_TO_BACK': {
      const item = state.items.find(i => i.id === action.id);
      if (!item) return state;

      // Ensure item is at a valid depth step, snap to nearest if not
      const snappedZ = snapToDepthStep(item.z);

      // Find items at same depth
      const sameDepthItems = state.items.filter(i => i.z === snappedZ && i.id !== action.id);
      const minZIndex = sameDepthItems.reduce((min, i) => Math.min(min, i.zIndex), Infinity);

      // If already at back (or alone), move to previous depth layer
      if (sameDepthItems.length === 0 || item.zIndex <= minZIndex) {
        const currentIndex = DEPTH_STEPS.indexOf(snappedZ);
        // Only move to lower depth if we're above depth 0
        if (currentIndex > 0) {
          const prevDepth = DEPTH_STEPS[currentIndex - 1];
          // Find max zIndex at new depth to place in front of all items there
          const newDepthItems = state.items.filter(i => i.z === prevDepth);
          const maxZIndexAtNewDepth = newDepthItems.reduce((max, i) => Math.max(max, i.zIndex), 0);
          return {
            ...state,
            items: state.items.map(i =>
              i.id === action.id ? { ...i, z: prevDepth, zIndex: maxZIndexAtNewDepth + 1 } : i
            ),
          };
        }
        // Already at minimum depth (0) - don't go lower
        return state;
      }

      // Otherwise, send to back within current depth
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, zIndex: minZIndex - 1 } : i
        ),
      };
    }

    case 'SET_ITEMS':
      return {
        ...state,
        items: action.items,
      };

    case 'CLEAR_ALL':
      return {
        items: [],
        selectedIds: [],
      };

    // Enhanced layer actions
    case 'TOGGLE_VISIBILITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id ? { ...item, visible: !item.visible } : item
        ),
      };

    case 'TOGGLE_LOCK':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id ? { ...item, locked: !item.locked } : item
        ),
      };

    case 'RENAME_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id ? { ...item, name: action.name } : item
        ),
      };

    case 'SET_OPACITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.id
            ? { ...item, opacity: Math.max(0, Math.min(1, action.opacity)) }
            : item
        ),
      };

    case 'BULK_TOGGLE_VISIBILITY': {
      const visibleCount = state.items.filter(item =>
        action.ids.includes(item.id) && item.visible
      ).length;
      const shouldHide = visibleCount > 0;

      return {
        ...state,
        items: state.items.map(item =>
          action.ids.includes(item.id) ? { ...item, visible: !shouldHide } : item
        ),
      };
    }

    case 'BULK_TOGGLE_LOCK': {
      const lockedCount = state.items.filter(item =>
        action.ids.includes(item.id) && item.locked
      ).length;
      const shouldLock = lockedCount === 0;

      return {
        ...state,
        items: state.items.map(item =>
          action.ids.includes(item.id) ? { ...item, locked: shouldLock } : item
        ),
      };
    }

    case 'BULK_DELETE':
      return {
        ...state,
        items: state.items.filter(item => !action.ids.includes(item.id)),
        selectedIds: state.selectedIds.filter(id => !action.ids.includes(id)),
      };

    case 'ALIGN_GRID_SMART': {
      const padding = 40;
      const gap = 20;
      const maxWidth = 1100; // Board width minus padding

      // Calculate actual item sizes based on type
      const itemSizes = state.items.map(item => {
        const dims = (item.kind === 'room' || item.kind === 'swatch')
          ? getRoomDimensions(item)
          : item.kind === 'image'
            ? { width: 200, height: 150 }
            : { width: 180, height: 60 };
        return { item, width: dims.width, height: dims.height };
      });

      // Row-based packing algorithm
      let x = padding;
      let y = padding;
      let rowHeight = 0;

      const newItems = itemSizes.map(({ item, width, height }) => {
        // If item doesn't fit in current row, move to next row
        if (x + width > maxWidth) {
          x = padding;
          y += rowHeight + gap;
          rowHeight = 0;
        }

        const newX = x;
        const newY = y;

        x += width + gap;
        rowHeight = Math.max(rowHeight, height);

        return { ...item, x: newX, y: newY, rot: 0 };
      });

      return { ...state, items: newItems };
    }

    default:
      return state;
  }
}

import { FLOOR_PLAN_ROOMS, FLOOR_PLAN_WIDTH, FLOOR_PLAN_HEIGHT } from '../data/floorPlanRooms';

export function createDemoBoard(): Item[] {
  return FLOOR_PLAN_ROOMS.map(def =>
    createItem('room', { x: def.x, y: def.y }, {
      color: def.baseColor,
      name: def.label,
      tags: ['room'],
      rot: 0,
      width: def.width,
      height: def.height,
    })
  );
}

export { FLOOR_PLAN_WIDTH, FLOOR_PLAN_HEIGHT };
