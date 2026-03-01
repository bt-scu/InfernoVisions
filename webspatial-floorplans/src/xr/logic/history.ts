// History management for undo/redo functionality

import type { BoardState, BoardAction } from './items';

// Extended state with history
export interface HistoryState {
  past: BoardState[];      // Array of previous states
  present: BoardState;     // Current state
  future: BoardState[];    // Array of future states (for redo)
}

// New action types for undo/redo
export type HistoryAction =
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'HISTORY_PUSH'; action: BoardAction };

// Actions that should NOT trigger history tracking
// (Selection changes don't need undo)
const NON_UNDOABLE_ACTIONS = new Set([
  'SELECT_ITEM',
  'SELECT_MULTIPLE',
  'CLEAR_SELECTION'
]);

// Maximum history size (prevent memory issues)
const MAX_HISTORY_SIZE = 50;

// Helper to check if action is undoable
export function isUndoableAction(action: BoardAction): boolean {
  return !NON_UNDOABLE_ACTIONS.has(action.type);
}

// Create initial history state
export function createInitialHistoryState(initialState: BoardState): HistoryState {
  return {
    past: [],
    present: initialState,
    future: []
  };
}

// Higher-order reducer that adds undo/redo capability
export function withHistory(
  reducer: (state: BoardState, action: BoardAction) => BoardState
) {
  return (historyState: HistoryState, action: HistoryAction | BoardAction): HistoryState => {

    // Handle undo
    if (action.type === 'UNDO') {
      if (historyState.past.length === 0) {
        return historyState; // Nothing to undo
      }

      const previous = historyState.past[historyState.past.length - 1];
      const newPast = historyState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [historyState.present, ...historyState.future]
      };
    }

    // Handle redo
    if (action.type === 'REDO') {
      if (historyState.future.length === 0) {
        return historyState; // Nothing to redo
      }

      const next = historyState.future[0];
      const newFuture = historyState.future.slice(1);

      return {
        past: [...historyState.past, historyState.present],
        present: next,
        future: newFuture
      };
    }

    // Handle regular actions
    const boardAction = action as BoardAction;
    const newPresent = reducer(historyState.present, boardAction);

    // If state didn't change or action is non-undoable, don't add to history
    if (newPresent === historyState.present || !isUndoableAction(boardAction)) {
      return {
        ...historyState,
        present: newPresent
      };
    }

    // Add to history
    const newPast = [...historyState.past, historyState.present];

    // Limit history size (remove oldest if exceeds max)
    const trimmedPast = newPast.length > MAX_HISTORY_SIZE
      ? newPast.slice(newPast.length - MAX_HISTORY_SIZE)
      : newPast;

    return {
      past: trimmedPast,
      present: newPresent,
      future: [] // Clear future on new action
    };
  };
}

// Helper to check if undo is available
export function canUndo(historyState: HistoryState): boolean {
  return historyState.past.length > 0;
}

// Helper to check if redo is available
export function canRedo(historyState: HistoryState): boolean {
  return historyState.future.length > 0;
}
