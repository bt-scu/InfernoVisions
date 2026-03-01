import { useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { Board } from '../components/Board';
import { Toolbar } from '../components/Toolbar';
import { CommandPalette } from '../components/CommandPalette';
import { ContextMenu } from '../components/ContextMenu';
import { boardReducer, createItem, createDemoBoard, DEFAULT_ROOM_WIDTH, DEFAULT_ROOM_HEIGHT } from '../logic/items';
import { saveBoard, loadBoard } from '../logic/storage';
import { createChannel, closeChannel } from '../logic/channel';
import type { ChannelMessage } from '../logic/channel';
import type { BoardState } from '../logic/items';
import { withHistory, createInitialHistoryState, canUndo, canRedo } from '../logic/history';
import type { HistoryState } from '../logic/history';
import '../styles/xr.css';

const WINDOW_LAYOUTS = {
  layers: { width: 220, height: 600, left: 96, top: 120 },
  controls: { width: 320, height: 640, left: 1280, top: 120 },
  palette: { width: 240, height: 460, left: 880, top: 40 },
  help: { width: 380, height: 600, left: 760, top: 60 },
  export: { width: 500, height: 520, left: 500, top: 200 },
  import: { width: 500, height: 520, left: 500, top: 200 },
  welcome: { width: 600, height: 700, left: 450, top: 150 },
  clear: { width: 400, height: 320, left: 550, top: 280 },
  'grid-align': { width: 400, height: 350, left: 550, top: 280 },
} as const;

// Declare initScene for WebSpatial
declare const initScene: (name: string, config: (cfg: any) => any) => void;

export function BoardScene() {
  // Initialize board state with history
  const [historyState, dispatch] = useReducer(
    withHistory(boardReducer),
    null,
    (): HistoryState => {
      // Try to load from localStorage
      const saved = loadBoard();
      const initialBoardState: BoardState = saved && saved.length > 0
        ? { items: saved, selectedIds: [] }
        : { items: createDemoBoard(), selectedIds: [] };
      return createInitialHistoryState(initialBoardState);
    }
  );

  // Extract current state for convenience
  const state = historyState.present;

  // Present mode state
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [activeClusterTag, setActiveClusterTag] = useState<string | undefined>();
  const [activeGroupIds, setActiveGroupIds] = useState<string[]>([]);  // For random grouping

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);

  // Placement mode state - for click-to-place new items
  const [placementMode, setPlacementMode] = useState<{
    type: 'text' | 'room' | 'image';
    data?: { color?: string; src?: string };
  } | null>(null);

  const auxiliaryWindowsRef = useRef<Set<Window>>(new Set());

  // Presentation mode interval ref
  const presentationIntervalRef = useRef<number | null>(null);
  // Store original depths for presentation mode animation
  const originalDepthsRef = useRef<Map<string, number>>(new Map());
  // Track animation timeouts for cleanup
  const animationTimeoutsRef = useRef<number[]>([]);
  // State ref for accessing current state in interval callbacks (avoids stale closure)
  const stateRef = useRef(state);
  stateRef.current = state;

  const registerAuxWindow = useCallback((win: Window | null | undefined) => {
    if (!win) return;
    auxiliaryWindowsRef.current.add(win);

    const handleClose = () => {
      auxiliaryWindowsRef.current.delete(win);
      win.removeEventListener('beforeunload', handleClose);
    };

    win.addEventListener('beforeunload', handleClose);
  }, []);

  const openAuxiliaryWindow = useCallback((
    scene: keyof typeof WINDOW_LAYOUTS,
    windowName: string
  ) => {
    const bounds = WINDOW_LAYOUTS[scene];
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?scene=${scene}`;
    const features = [`width=${bounds.width}`, `height=${bounds.height}`].join(',');

    try {
      const win = window.open(url, windowName, features);
      registerAuxWindow(win);

      if (!win) {
        throw new Error('Window could not be opened');
      }

      const applyBounds = () => {
        try {
          if (typeof win.moveTo === 'function' && bounds.left !== undefined && bounds.top !== undefined) {
            win.moveTo(bounds.left, bounds.top);
          }
          if (typeof win.resizeTo === 'function') {
            win.resizeTo(bounds.width, bounds.height);
          }
        } catch (error) {
          console.error(`Failed to apply bounds for ${windowName}:`, error);
        }
      };

      // Apply immediately and after a short delay to accommodate window initialization
      applyBounds();
      setTimeout(applyBounds, 150);
      setTimeout(applyBounds, 400);

      return win;
    } catch (error) {
      console.error(`Failed to open ${scene} window:`, error);
      return null;
    }
  }, [registerAuxWindow]);

  const closeAuxiliaryWindows = useCallback(() => {
    auxiliaryWindowsRef.current.forEach(win => {
      try {
        if (!win.closed) {
          win.close();
        }
      } catch (error) {
        console.error('Failed to close auxiliary window:', error);
      }
    });
    auxiliaryWindowsRef.current.clear();
  }, []);

  useEffect(() => {
    // Only close auxiliary windows on actual page unload, not visibility changes
    // (visibility changes happen when windows overlap in visionOS)
    window.addEventListener('beforeunload', closeAuxiliaryWindows);
    window.addEventListener('pagehide', closeAuxiliaryWindows);

    return () => {
      window.removeEventListener('beforeunload', closeAuxiliaryWindows);
      window.removeEventListener('pagehide', closeAuxiliaryWindows);
      closeAuxiliaryWindows();
    };
  }, [closeAuxiliaryWindows]);

  // Auto-save to localStorage when items change (debounced)
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      saveBoard(state.items);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state.items]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  // Keyboard shortcuts (Cmd/Ctrl + K, Cmd/Ctrl + Z, Cmd/Ctrl + Shift + Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Undo
      else if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo(historyState)) {
          handleUndo();
        }
      }
      // Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
      else if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key === 'y')
      ) {
        e.preventDefault();
        if (canRedo(historyState)) {
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, historyState]);


  // BroadcastChannel setup - bidirectional communication
  useEffect(() => {
    const channel = createChannel((message: ChannelMessage) => {
      if (message.type === 'applyColor' && state.selectedIds.length > 0) {
        // Apply color to all selected items
        state.selectedIds.forEach(id => {
          dispatch({
            type: 'UPDATE_ITEM',
            id,
            updates: { color: message.color },
          });
        });
      } else if (message.type === 'boardAction') {
        // Handle actions from other scenes
        dispatch(message.action);
      } else if (message.type === 'selectItem') {
        // Handle selection from other scenes
        dispatch({ type: 'SELECT_ITEM', id: message.id });
      } else if (message.type === 'requestState') {
        // Send current state to requesting scene
        channel.postMessage({
          type: 'itemsUpdate',
          items: state.items,
        });
        channel.postMessage({
          type: 'selectionUpdate',
          selectedId: state.selectedIds[0],
          selectedIds: state.selectedIds,
        });
      } else if (message.type === 'importItems') {
        // Import items from import scene
        dispatch({ type: 'SET_ITEMS', items: message.items });
      } else if (message.type === 'openExport') {
        // Open export window (triggered by clear scene's "Save & Clear")
        openAuxiliaryWindow('export', 'export');
        // Send items to export window after it opens
        setTimeout(() => {
          channel.postMessage({ type: 'itemsUpdate', items: state.items });
        }, 500);
      }
    });

    return () => closeChannel(channel);
  }, [state.selectedIds, state.items, openAuxiliaryWindow]);

  // Broadcast state updates to other scenes (debounced)
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const channel = new BroadcastChannel('moodboard');
      channel.postMessage({ type: 'itemsUpdate', items: state.items });
      channel.close();
    }, 200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state.items]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const channel = new BroadcastChannel('moodboard');
      channel.postMessage({
        type: 'selectionUpdate',
        selectedId: state.selectedIds[0],
        selectedIds: state.selectedIds,
      });
      channel.close();
    }, 150);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [state.selectedIds]);

  // Initialize all secondary scenes
  useEffect(() => {
    try {
      if (typeof initScene !== 'undefined') {
        // Palette scene - narrower
        initScene('palette', cfg => ({
          ...cfg,
          defaultSize: { width: 260, height: 520 }
        }));

        // Layers scene - narrower
        initScene('layers', cfg => ({
          ...cfg,
          defaultSize: { width: 240, height: 620 }
        }));

        // Controls scene (Properties + Minimap + Depth) - smaller
        initScene('controls', cfg => ({
          ...cfg,
          defaultSize: { width: 320, height: 640 }
        }));

        // Help scene
        initScene('help', cfg => ({
          ...cfg,
          defaultSize: { width: 480, height: 680 }
        }));

        // Export scene
        initScene('export', cfg => ({
          ...cfg,
          defaultSize: { width: 500, height: 520 }
        }));

        // Import scene
        initScene('import', cfg => ({
          ...cfg,
          defaultSize: { width: 500, height: 560 }
        }));

        // Welcome scene
        initScene('welcome', cfg => ({
          ...cfg,
          defaultSize: { width: 600, height: 700 }
        }));

        // Clear confirmation scene
        initScene('clear', cfg => ({
          ...cfg,
          defaultSize: { width: 400, height: 320 }
        }));

        // Grid align confirmation scene
        initScene('grid-align', cfg => ({
          ...cfg,
          defaultSize: { width: 400, height: 350 }
        }));
      }
    } catch (error) {
      console.error('Failed to initialize scenes:', error);
    }
  }, []);


  // Toolbar handlers - enter placement mode instead of creating at fixed position
  const handleAddText = useCallback(() => {
    setPlacementMode({ type: 'text' });
  }, []);

  const handleAddRoom = useCallback((color: string) => {
    setPlacementMode({ type: 'room', data: { color } });
  }, []);

  const handleAddImage = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setPlacementMode({ type: 'image', data: { src } });
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle placement click on board
  const handlePlacementClick = useCallback((x: number, y: number) => {
    if (!placementMode) return;

    let item;
    if (placementMode.type === 'text') {
      item = createItem('text', { x, y }, { text: 'New text box' });
    } else if (placementMode.type === 'room') {
      item = createItem('room', { x, y }, {
        color: placementMode.data?.color,
        width: DEFAULT_ROOM_WIDTH,
        height: DEFAULT_ROOM_HEIGHT,
      });
    } else if (placementMode.type === 'image') {
      item = createItem('image', { x, y }, { src: placementMode.data?.src });
    }

    if (item) {
      dispatch({ type: 'ADD_ITEM', item });
    }
    setPlacementMode(null);
  }, [placementMode]);

  // Cancel placement mode
  const handleCancelPlacement = useCallback(() => {
    setPlacementMode(null);
  }, []);

  const handleAlignGrid = useCallback(() => {
    openAuxiliaryWindow('grid-align', 'gridAlignWindow');
  }, [openAuxiliaryWindow]);

  const handleTogglePresent = useCallback(() => {
    // Helper to clear all animation timeouts
    const clearAnimationTimeouts = () => {
      animationTimeoutsRef.current.forEach(id => clearTimeout(id));
      animationTimeoutsRef.current = [];
    };

    if (isPresentMode) {
      // Stop presentation mode
      setIsPresentMode(false);
      setActiveClusterTag(undefined);
      setActiveGroupIds([]);

      // Clear the interval immediately
      if (presentationIntervalRef.current !== null) {
        clearInterval(presentationIntervalRef.current);
        presentationIntervalRef.current = null;
      }

      // Clear any pending animation timeouts
      clearAnimationTimeouts();

      // Restore all items to their original depths
      originalDepthsRef.current.forEach((originalZ, itemId) => {
        dispatch({ type: 'SET_DEPTH', id: itemId, z: originalZ });
      });

      // Clear stored original depths
      originalDepthsRef.current.clear();
    } else {
      // Early return if no items
      if (state.items.length === 0) {
        console.warn('Presentation mode: No items to present');
        return;
      }

      // Start presentation mode
      setIsPresentMode(true);

      // Store all original depths before we start animating
      originalDepthsRef.current.clear();
      state.items.forEach(item => {
        originalDepthsRef.current.set(item.id, item.z);
      });

      // Helper function for animation
      const animateGroup = (itemIds: string[]) => {
        itemIds.forEach(itemId => {
          const originalZ = originalDepthsRef.current.get(itemId);
          if (originalZ !== undefined) {
            // Lift up
            dispatch({ type: 'SET_DEPTH', id: itemId, z: originalZ + 20 });
            // Return to original after 200ms
            const timeoutId = window.setTimeout(() => {
              const original = originalDepthsRef.current.get(itemId);
              if (original !== undefined) {
                dispatch({ type: 'SET_DEPTH', id: itemId, z: original });
              }
            }, 200);
            animationTimeoutsRef.current.push(timeoutId);
          }
        });
      };

      // Always use random grouping for ALL items
      // Shuffle items randomly
      const shuffled = [...state.items].sort(() => Math.random() - 0.5);

      // Create groups of 2-4 items each
      const groups: string[][] = [];
      let i = 0;
      while (i < shuffled.length) {
        const groupSize = Math.min(
          2 + Math.floor(Math.random() * 3), // 2-4 items
          shuffled.length - i
        );
        groups.push(shuffled.slice(i, i + groupSize).map(item => item.id));
        i += groupSize;
      }

      // If only one item, make a single group
      if (groups.length === 0 && shuffled.length > 0) {
        groups.push(shuffled.map(item => item.id));
      }

      let groupIndex = 0;
      const currentGroup = groups[groupIndex];
      setActiveGroupIds(currentGroup);

      // Animate the first group immediately
      animateGroup(currentGroup);

      // Step through groups every 3 seconds
      const interval = window.setInterval(() => {
        groupIndex = (groupIndex + 1) % groups.length;
        const nextGroup = groups[groupIndex];
        setActiveGroupIds(nextGroup);
        animateGroup(nextGroup);
      }, 3000);

      presentationIntervalRef.current = interval;
    }
  }, [isPresentMode, state.items, dispatch]);

  // Cleanup present mode interval and timeouts on component unmount
  useEffect(() => {
    return () => {
      if (presentationIntervalRef.current !== null) {
        clearInterval(presentationIntervalRef.current);
        presentationIntervalRef.current = null;
      }
      // Clear any pending animation timeouts
      animationTimeoutsRef.current.forEach(id => clearTimeout(id));
      animationTimeoutsRef.current = [];
    };
  }, []);

  const handleExport = useCallback(() => {
    const win = openAuxiliaryWindow('export', 'export');
    if (win) {
      // Send items to export window after a short delay to let it initialize
      setTimeout(() => {
        const channel = new BroadcastChannel('moodboard');
        channel.postMessage({ type: 'itemsUpdate', items: state.items });
        channel.close();
      }, 500);
    } else {
      alert('Failed to open export window');
    }
  }, [openAuxiliaryWindow, state.items]);

  const handleImport = useCallback(() => {
    const win = openAuxiliaryWindow('import', 'import');
    if (!win) {
      alert('Failed to open import window');
    }
  }, [openAuxiliaryWindow]);

  const handleOpenPalette = useCallback(() => {
    const win = openAuxiliaryWindow('palette', 'palette');
    if (!win) {
      alert('Failed to open palette window');
    }
  }, [openAuxiliaryWindow]);

  const handleBringToFront = useCallback(() => {
    if (state.selectedIds.length > 0) {
      state.selectedIds.forEach(id => {
        dispatch({ type: 'BRING_TO_FRONT', id });
      });
    }
  }, [state.selectedIds]);

  const handleSendBackward = useCallback(() => {
    if (state.selectedIds.length > 0) {
      state.selectedIds.forEach(id => {
        dispatch({ type: 'SEND_TO_BACK', id });
      });
    }
  }, [state.selectedIds]);

  const handleContextMenu = useCallback((itemId: string, x: number, y: number) => {
    setContextMenu({ x, y, itemId });
  }, []);

  const handleDuplicateItem = useCallback((itemId: string) => {
    const item = state.items.find(i => i.id === itemId);
    if (item) {
      // Find a unique offset by checking existing item positions
      let offset = 20;
      const maxOffset = 200;
      while (offset < maxOffset) {
        const targetX = item.x + offset;
        const targetY = item.y + offset;
        const overlap = state.items.some(
          i => Math.abs(i.x - targetX) < 10 && Math.abs(i.y - targetY) < 10
        );
        if (!overlap) break;
        offset += 20;
      }

      const newItem = {
        ...item,
        id: crypto.randomUUID(),
        x: item.x + offset,
        y: item.y + offset,
      };
      dispatch({ type: 'ADD_ITEM', item: newItem });
    }
  }, [state.items]);

  const handleOpenLayers = useCallback(() => {
    const win = openAuxiliaryWindow('layers', 'layers');
    if (!win) {
      console.error('Failed to open layers window');
    }
  }, [openAuxiliaryWindow]);

  const handleOpenControls = useCallback(() => {
    const win = openAuxiliaryWindow('controls', 'controls');
    if (!win) {
      console.error('Failed to open controls window');
    }
  }, [openAuxiliaryWindow]);

  const handleOpenHelp = useCallback(() => {
    const win = openAuxiliaryWindow('help', 'help');
    if (!win) {
      console.error('Failed to open help window');
    }
  }, [openAuxiliaryWindow]);

  // Clear canvas handler - opens clear confirmation scene
  const handleClearCanvas = useCallback(() => {
    openAuxiliaryWindow('clear', 'clear');
  }, [openAuxiliaryWindow]);


  return (
    <div className="board-scene-container">
      {/* Main Canvas - Full Screen */}
      <Board
        items={state.items}
        selectedIds={state.selectedIds}
        dispatch={dispatch}
        isPresentMode={isPresentMode}
        activeClusterTag={activeClusterTag}
        activeGroupIds={activeGroupIds}
        onContextMenu={handleContextMenu}
        placementMode={placementMode}
        onPlacementClick={handlePlacementClick}
        onCancelPlacement={handleCancelPlacement}
      />

      {/* Toolbar with window opener buttons */}
      <Toolbar
        onAddText={handleAddText}
        onAddRoom={handleAddRoom}
        onAddImage={handleAddImage}
        onAlignGrid={handleAlignGrid}
        onTogglePresent={handleTogglePresent}
        onExport={handleExport}
        onImport={handleImport}
        onOpenPalette={handleOpenPalette}
        onBringToFront={handleBringToFront}
        onSendBackward={handleSendBackward}
        isPresentMode={isPresentMode}
        hasSelection={state.selectedIds.length > 0}
        onOpenLayers={handleOpenLayers}
        onOpenControls={handleOpenControls}
        onOpenHelp={handleOpenHelp}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo(historyState)}
        canRedo={canRedo(historyState)}
        onClearCanvas={handleClearCanvas}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        dispatch={dispatch}
        onAddText={handleAddText}
        onAddRoom={handleAddRoom}
        onAlignGrid={handleAlignGrid}
        onTogglePresent={handleTogglePresent}
        onExport={handleExport}
        onImport={handleImport}
        onOpenPalette={handleOpenPalette}
        hasSelection={state.selectedIds.length > 0}
      />

      {/* Context Menu */}
      {contextMenu && (() => {
        const item = state.items.find(i => i.id === contextMenu.itemId);
        if (!item) return null;

        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            items={[
              {
                id: 'duplicate',
                label: 'Duplicate',
                icon: '⧉',
                action: () => handleDuplicateItem(contextMenu.itemId),
                disabled: item.locked,
              },
              {
                id: 'bring-to-front',
                label: 'Bring to Front',
                icon: '↑',
                action: () => dispatch({ type: 'BRING_TO_FRONT', id: contextMenu.itemId }),
              },
              {
                id: 'separator-1',
                label: '',
                icon: '',
                action: () => {},
                separator: true,
              },
              {
                id: 'copy-id',
                label: 'Copy ID',
                icon: '📋',
                action: () => {
                  navigator.clipboard.writeText(contextMenu.itemId);
                },
              },
              {
                id: 'separator-2',
                label: '',
                icon: '',
                action: () => {},
                separator: true,
              },
              {
                id: 'delete',
                label: 'Delete',
                icon: '×',
                action: () => dispatch({ type: 'REMOVE_ITEM', id: contextMenu.itemId }),
                disabled: item.locked,
              },
            ]}
          />
        );
      })()}
    </div>
  );
}
