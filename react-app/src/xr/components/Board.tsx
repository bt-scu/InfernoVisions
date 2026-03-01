import { useRef, useEffect, useCallback } from 'react';
import { Item as ItemComponent } from './Item';
import type { Item as ItemType, BoardAction } from '../logic/items';
import { createItem, getNextDepthStep } from '../logic/items';

// Ghost dimensions by type (larger for better visibility)
const GHOST_DIMENSIONS: Record<string, { width: number; height: number }> = {
  text: { width: 180, height: 70 },
  swatch: { width: 100, height: 100 },
  image: { width: 200, height: 150 },
};

interface BoardProps {
  items: ItemType[];
  selectedIds: string[];
  dispatch: React.Dispatch<BoardAction>;
  isPresentMode: boolean;
  activeClusterTag?: string;
  activeGroupIds?: string[];  // For random grouping when no tags exist
  onContextMenu?: (itemId: string, x: number, y: number) => void;
  placementMode?: { type: 'text' | 'swatch' | 'image'; data?: any } | null;
  onPlacementClick?: (x: number, y: number) => void;
  onCancelPlacement?: () => void;
}

export function Board({ items, selectedIds, dispatch, isPresentMode, activeClusterTag, activeGroupIds, onContextMenu, placementMode, onPlacementClick, onCancelPlacement }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  // Ghost position ref for draggable placement (using ref instead of state for performance)
  const placementGhostRef = useRef<HTMLDivElement | null>(null);
  const ghostPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const ghostDragState = useRef<{
    startX: number;
    startY: number;
    initialGhostX: number;
    initialGhostY: number;
    currentX?: number;
    currentY?: number;
    rafId?: number;
  } | null>(null);

  const dragState = useRef<{
    itemId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    element: HTMLElement;
    currentX?: number;
    currentY?: number;
    rafId?: number;
  } | null>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape cancels placement mode
      if (e.key === 'Escape' && placementMode && onCancelPlacement) {
        e.preventDefault();
        onCancelPlacement();
        return;
      }

      if (selectedIds.length === 0) return;

      // Depth adjustment with [ and ]
      if (e.key === '[') {
        e.preventDefault();
        selectedIds.forEach(id => {
          const item = items.find(i => i.id === id);
          if (item) {
            const newZ = getNextDepthStep(item.z, 'down');
            dispatch({ type: 'SET_DEPTH', id, z: newZ });
          }
        });
      } else if (e.key === ']') {
        e.preventDefault();
        selectedIds.forEach(id => {
          const item = items.find(i => i.id === id);
          if (item) {
            const newZ = getNextDepthStep(item.z, 'up');
            dispatch({ type: 'SET_DEPTH', id, z: newZ });
          }
        });
      }
      // Delete with Backspace or Delete
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        selectedIds.forEach(id => {
          const item = items.find(i => i.id === id);
          if (item?.locked) return; // Skip locked items
          dispatch({ type: 'REMOVE_ITEM', id });
        });
      }
      // Select all with Cmd/Ctrl + A
      else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        dispatch({ type: 'SELECT_MULTIPLE', ids: items.map(i => i.id) });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, items, dispatch, placementMode, onCancelPlacement]);

  // DOM-based ghost pointer handlers (defined before useEffect that uses them)
  const handleGhostPointerDownDOM = useCallback((e: PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    ghostDragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialGhostX: ghostPositionRef.current?.x ?? 0,
      initialGhostY: ghostPositionRef.current?.y ?? 0,
    };
  }, []);

  const handleGhostPointerMoveDOM = useCallback((e: PointerEvent) => {
    if (!ghostDragState.current || !placementGhostRef.current || !boardRef.current) return;

    ghostDragState.current.currentX = e.clientX;
    ghostDragState.current.currentY = e.clientY;

    if (ghostDragState.current.rafId) return;

    ghostDragState.current.rafId = requestAnimationFrame(() => {
      if (!ghostDragState.current || !placementGhostRef.current || !boardRef.current) return;

      const dx = (ghostDragState.current.currentX ?? 0) - ghostDragState.current.startX;
      const dy = (ghostDragState.current.currentY ?? 0) - ghostDragState.current.startY;
      const newX = ghostDragState.current.initialGhostX + dx;
      const newY = ghostDragState.current.initialGhostY + dy;

      // Direct DOM update only - NO state update for smooth performance
      placementGhostRef.current.style.left = `${newX}px`;
      placementGhostRef.current.style.top = `${newY}px`;

      // Update ref (not state) for final position
      ghostPositionRef.current = { x: newX, y: newY };

      ghostDragState.current.rafId = undefined;
    });
  }, []);

  const handleGhostPointerUpDOM = useCallback((e: PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    if (ghostDragState.current?.rafId) {
      cancelAnimationFrame(ghostDragState.current.rafId);
    }
    ghostDragState.current = null;
  }, []);

  // Double-tap handler for the ghost element
  const handleGhostClickDOM = useCallback((e: MouseEvent) => {
    if (!ghostPositionRef.current || !placementMode || !onPlacementClick) return;
    e.stopPropagation();

    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      // Double-tap detected - place item at ghost position
      onPlacementClick(ghostPositionRef.current.x, ghostPositionRef.current.y);
      lastClickTimeRef.current = 0;
    } else {
      // First tap - record time
      lastClickTimeRef.current = now;
    }
  }, [placementMode, onPlacementClick]);

  // Create placement ghost via DOM (like item drag ghost) for smooth performance
  useEffect(() => {
    if (placementMode && boardRef.current) {
      const ghost = document.createElement('div');
      const dims = GHOST_DIMENSIONS[placementMode.type] || { width: 120, height: 80 };

      // Initial position near toolbar (top-right area)
      const boardRect = boardRef.current.getBoundingClientRect();
      const initialX = Math.max(100, boardRect.width - 300);
      const initialY = 150;

      ghost.style.position = 'absolute';
      ghost.style.left = `${initialX}px`;
      ghost.style.top = `${initialY}px`;
      ghost.style.width = `${dims.width}px`;
      ghost.style.height = `${dims.height}px`;
      ghost.style.border = '4px dashed #6366f1';
      ghost.style.backgroundColor = 'rgba(99, 102, 241, 0.25)';
      ghost.style.borderRadius = '16px';
      ghost.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.5), inset 0 0 20px rgba(99, 102, 241, 0.1)';
      ghost.style.zIndex = '10000';
      ghost.style.cursor = 'grab';
      ghost.style.touchAction = 'none';
      ghost.setAttribute('enable-xr', '');

      // Add icon inside ghost to show item type
      const icon = document.createElement('div');
      icon.style.position = 'absolute';
      icon.style.top = '50%';
      icon.style.left = '50%';
      icon.style.transform = 'translate(-50%, -50%)';
      icon.style.fontSize = '32px';
      icon.style.opacity = '0.7';
      icon.style.pointerEvents = 'none';
      icon.textContent = placementMode.type === 'text' ? '📝'
                       : placementMode.type === 'swatch' ? '🎨'
                       : '🖼';
      ghost.appendChild(icon);

      // Add hint label below ghost
      const hint = document.createElement('div');
      hint.style.position = 'absolute';
      hint.style.top = '100%';
      hint.style.left = '50%';
      hint.style.transform = 'translateX(-50%)';
      hint.style.marginTop = '12px';
      hint.style.whiteSpace = 'nowrap';
      hint.style.fontSize = '14px';
      hint.style.fontWeight = '600';
      hint.style.color = 'white';
      hint.style.backgroundColor = 'rgba(99, 102, 241, 0.9)';
      hint.style.padding = '6px 12px';
      hint.style.borderRadius = '8px';
      hint.style.pointerEvents = 'none';
      hint.textContent = 'Double-tap to place';
      hint.setAttribute('enable-xr', '');
      ghost.appendChild(hint);

      boardRef.current.appendChild(ghost);
      placementGhostRef.current = ghost;
      ghostPositionRef.current = { x: initialX, y: initialY };

      // Attach pointer handlers directly to ghost
      ghost.addEventListener('pointerdown', handleGhostPointerDownDOM);
      ghost.addEventListener('pointermove', handleGhostPointerMoveDOM);
      ghost.addEventListener('pointerup', handleGhostPointerUpDOM);
      ghost.addEventListener('click', handleGhostClickDOM);

      return () => {
        ghost.removeEventListener('pointerdown', handleGhostPointerDownDOM);
        ghost.removeEventListener('pointermove', handleGhostPointerMoveDOM);
        ghost.removeEventListener('pointerup', handleGhostPointerUpDOM);
        ghost.removeEventListener('click', handleGhostClickDOM);
        ghost.remove();
        placementGhostRef.current = null;
        ghostPositionRef.current = null;
      };
    } else if (!placementMode) {
      ghostDragState.current = null;
    }
  }, [placementMode, handleGhostPointerDownDOM, handleGhostPointerMoveDOM, handleGhostPointerUpDOM, handleGhostClickDOM]);

  // Handle paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();

      // Check for files (images)
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const src = event.target?.result as string;
                const newItem = createItem('image', { x: 200, y: 200 }, { src });
                dispatch({ type: 'ADD_ITEM', item: newItem });
              };
              reader.readAsDataURL(file);
            }
            return;
          }
        }
      }

      // Check for text
      const text = e.clipboardData?.getData('text');
      if (text) {
        const newItem = createItem('text', { x: 200, y: 200 }, { text });
        dispatch({ type: 'ADD_ITEM', item: newItem });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [dispatch]);

  // Handle drag and drop files
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const rect = board.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const src = event.target?.result as string;
            const newItem = createItem('image', {
              x: x + i * 20,
              y: y + i * 20
            }, { src });
            dispatch({ type: 'ADD_ITEM', item: newItem });
          };
          reader.readAsDataURL(file);
        }
      }
    };

    board.addEventListener('dragover', handleDragOver);
    board.addEventListener('drop', handleDrop);

    return () => {
      board.removeEventListener('dragover', handleDragOver);
      board.removeEventListener('drop', handleDrop);
    };
  }, [dispatch]);

  // Pointer event handlers - use ghost element for smooth drag
  const handlePointerDown = (itemId: string, e: React.PointerEvent) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    if (item.locked) return; // Prevent dragging locked items

    const element = document.querySelector(`[data-item-id="${itemId}"]`) as HTMLElement;
    if (!element) return;

    // Create a simple visual placeholder instead of cloning
    const ghost = document.createElement('div');
    const rect = element.getBoundingClientRect();

    ghost.style.position = 'absolute';
    ghost.style.left = `${item.x}px`;
    ghost.style.top = `${item.y}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.transform = `rotate(${item.rot}deg) scale(${item.scale})`;
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '10000';
    ghost.style.border = '4px dashed #6366f1';
    ghost.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
    ghost.style.borderRadius = '16px';
    ghost.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.4)';
    ghost.classList.add('drag-ghost');
    ghost.setAttribute('enable-xr', '');  // Required for visionOS spatial rendering

    // Add ghost to board
    boardRef.current?.appendChild(ghost);
    dragGhostRef.current = ghost;

    dragState.current = {
      itemId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y,
      element,
    };

    // Make original element semi-transparent while dragging
    element.style.opacity = '0.3';

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Placement ghost is now fixed at center via CSS - no pointer tracking needed

    if (!dragState.current || !dragGhostRef.current) return;

    // Store the latest pointer position
    dragState.current.currentX = e.clientX;
    dragState.current.currentY = e.clientY;

    // If we already have a pending animation frame, don't schedule another
    if (dragState.current.rafId) return;

    // Schedule update for next frame - this throttles updates to display refresh rate
    dragState.current.rafId = requestAnimationFrame(() => {
      if (!dragState.current || !dragGhostRef.current) return;

      const dx = (dragState.current.currentX ?? dragState.current.startX) - dragState.current.startX;
      const dy = (dragState.current.currentY ?? dragState.current.startY) - dragState.current.startY;

      // Move the ghost element using simple positioning (no transform on original)
      const newX = dragState.current.initialX + dx;
      const newY = dragState.current.initialY + dy;

      dragGhostRef.current.style.left = `${newX}px`;
      dragGhostRef.current.style.top = `${newY}px`;

      // Clear the RAF ID so we can schedule another frame
      if (dragState.current) {
        dragState.current.rafId = undefined;
      }
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState.current) return;

    // Cancel any pending animation frame
    if (dragState.current.rafId) {
      cancelAnimationFrame(dragState.current.rafId);
    }

    // Use the latest stored position (or pointer up position as fallback)
    const finalClientX = dragState.current.currentX ?? e.clientX;
    const finalClientY = dragState.current.currentY ?? e.clientY;

    const dx = finalClientX - dragState.current.startX;
    const dy = finalClientY - dragState.current.startY;
    const finalX = dragState.current.initialX + dx;
    const finalY = dragState.current.initialY + dy;
    const itemId = dragState.current.itemId;
    const { element } = dragState.current;

    // Remove ghost element
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }

    // Restore original element opacity
    element.style.opacity = '';

    dragState.current = null;

    // Commit final position to the real element
    dispatch({
      type: 'MOVE_ITEM',
      id: itemId,
      x: finalX,
      y: finalY,
    });
  };

  const handleItemClick = (id: string, e?: React.MouseEvent) => {
    const multi = e?.ctrlKey || e?.metaKey;
    dispatch({ type: 'SELECT_ITEM', id, multi });
  };

  const handleBoardClick = (_e: React.MouseEvent) => {
    // If in placement mode, use double-tap to place at ghost position
    if (placementMode && onPlacementClick && ghostPositionRef.current) {
      const now = Date.now();
      if (now - lastClickTimeRef.current < 500) {
        // Double-tap detected - place item at ghost position
        onPlacementClick(ghostPositionRef.current.x, ghostPositionRef.current.y);
        lastClickTimeRef.current = 0;
      } else {
        // First tap - record time
        lastClickTimeRef.current = now;
      }
      return;
    }
    dispatch({ type: 'CLEAR_SELECTION' });
  };

  const handleRotate = (id: string, rotation: number) => {
    dispatch({ type: 'UPDATE_ITEM', id, updates: { rot: rotation } });
  };

  const handleScale = (id: string, scale: number) => {
    const clampedScale = Math.max(0.3, Math.min(3, scale));
    dispatch({ type: 'UPDATE_ITEM', id, updates: { scale: clampedScale } });
  };

  const handleDelete = useCallback((id: string) => {
    // Check if item is locked
    const item = items.find(i => i.id === id);
    if (item?.locked) return; // Prevent deleting locked items

    // Direct delete without confirmation for Vision Pro compatibility
    // window.confirm() doesn't work in visionOS/WebSpatial
    dispatch({ type: 'REMOVE_ITEM', id });
  }, [dispatch, items]);

  const handleEditText = useCallback((id: string, text: string) => {
    dispatch({ type: 'UPDATE_ITEM', id, updates: { text } });
  }, [dispatch]);

  // Filter and classify items for present mode
  const getItemClass = (item: ItemType): string => {
    if (!isPresentMode) return '';
    // Check tag-based grouping first
    if (activeClusterTag && item.tags.includes(activeClusterTag)) {
      return 'active';
    }
    // Check ID-based grouping (for random groups when no tags)
    if (activeGroupIds && activeGroupIds.includes(item.id)) {
      return 'active';
    }
    return 'dimmed';
  };

  return (
    <div
      ref={boardRef}
      className={`board ${isPresentMode ? 'present-mode-active' : ''} ${placementMode ? 'placement-mode' : ''}`}
      enable-xr-monitor
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleBoardClick}
    >
      {items
        .filter(item => item.visible !== false) // Only render visible items (undefined = visible)
        .map(item => {
          const itemClass = getItemClass(item);
          return (
            <ItemComponent
              key={item.id}
              item={item}
              isSelected={selectedIds.includes(item.id)}
              onPointerDown={handlePointerDown}
              onClick={handleItemClick}
              onRotate={handleRotate}
              onScale={handleScale}
              onContextMenu={onContextMenu}
              onDelete={handleDelete}
              onEditText={handleEditText}
              className={itemClass}
            />
          );
        })}

      {/* Placement ghost with integrated hint is created via DOM for smooth performance */}
    </div>
  );
}
