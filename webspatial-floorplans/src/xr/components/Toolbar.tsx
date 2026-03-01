import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { CSSProperties } from 'react';

interface ToolbarProps {
  onAddText: () => void;
  onAddRoom: (color: string) => void;
  onAddImage: (file: File) => void;
  onAlignGrid: () => void;
  onTogglePresent: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenPalette: () => void;
  onBringToFront: () => void;
  onSendBackward?: () => void;
  isPresentMode: boolean;
  hasSelection: boolean;
  onOpenLayers?: () => void;
  onOpenControls?: () => void;
  onOpenHelp?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onClearCanvas?: () => void;
  style?: CSSProperties;
}

export interface ToolbarRef {
  getElement: () => HTMLDivElement | null;
}

export const Toolbar = forwardRef<ToolbarRef, ToolbarProps>(function Toolbar({
  onAddText,
  onAddRoom,
  onAddImage,
  onAlignGrid,
  onTogglePresent,
  onExport,
  onImport,
  onOpenPalette,
  onBringToFront,
  isPresentMode,
  hasSelection,
  onOpenLayers,
  onOpenControls,
  onOpenHelp,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSendBackward,
  onClearCanvas,
  style,
}, ref) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  // Expose toolbar element to parent via ref
  useImperativeHandle(ref, () => ({
    getElement: () => toolbarRef.current,
  }), []);

  // Dragging state
  const [position, setPosition] = useState({ x: 1040, y: 40 }); // Top-right initial position
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    elemX: number;
    elemY: number;
    currentX?: number;
    currentY?: number;
    rafId?: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onAddImage(file);
      e.target.value = ''; // Reset so same file can be selected again
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);

    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    // Create a ghost element
    const rect = toolbar.getBoundingClientRect();
    const ghost = document.createElement('div');

    ghost.style.position = 'fixed';
    ghost.style.left = `${position.x}px`;
    ghost.style.top = `${position.y}px`;
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '10000';
    ghost.style.border = '4px dashed #6366f1';
    ghost.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
    ghost.style.borderRadius = '16px';
    ghost.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.4)';
    ghost.classList.add('toolbar-drag-ghost');

    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;

    // Make original toolbar semi-transparent
    toolbar.style.opacity = '0.3';

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elemX: position.x,
      elemY: position.y,
    };

    dragHandleRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !dragGhostRef.current) return;

    // Store the latest pointer position
    dragStartRef.current.currentX = e.clientX;
    dragStartRef.current.currentY = e.clientY;

    // If we already have a pending animation frame, don't schedule another
    if (dragStartRef.current.rafId) return;

    // Schedule update for next frame
    dragStartRef.current.rafId = requestAnimationFrame(() => {
      if (!dragStartRef.current || !dragGhostRef.current) return;

      const dx = (dragStartRef.current.currentX ?? dragStartRef.current.x) - dragStartRef.current.x;
      const dy = (dragStartRef.current.currentY ?? dragStartRef.current.y) - dragStartRef.current.y;

      const newX = dragStartRef.current.elemX + dx;
      const newY = dragStartRef.current.elemY + dy;

      dragGhostRef.current.style.left = `${newX}px`;
      dragGhostRef.current.style.top = `${newY}px`;

      // Clear the RAF ID
      if (dragStartRef.current) {
        dragStartRef.current.rafId = undefined;
      }
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;

    // Cancel any pending animation frame
    if (dragStartRef.current.rafId) {
      cancelAnimationFrame(dragStartRef.current.rafId);
    }

    // Use the latest stored position
    const finalClientX = dragStartRef.current.currentX ?? e.clientX;
    const finalClientY = dragStartRef.current.currentY ?? e.clientY;

    const dx = finalClientX - dragStartRef.current.x;
    const dy = finalClientY - dragStartRef.current.y;
    const finalX = dragStartRef.current.elemX + dx;
    const finalY = dragStartRef.current.elemY + dy;

    // Remove ghost element
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }

    // Restore toolbar opacity
    if (toolbarRef.current) {
      toolbarRef.current.style.opacity = '';
    }

    // Apply final position
    setPosition({ x: finalX, y: finalY });

    dragHandleRef.current?.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const toolbarStyle: CSSProperties = {
    ...style,
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  return (
    <div
      ref={toolbarRef}
      className="toolbar"
      enable-xr
      style={toolbarStyle}
    >
      {/* GROUP 1: CREATE ITEMS */}
      <div className="toolbar-group">
        <button
          className="toolbar-button toolbar-button-primary"
          onClick={(e) => { e.currentTarget.blur(); fileInputRef.current?.click(); }}
          title="Add image"
        >
          <span className="toolbar-icon">🖼</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="toolbar-input"
          onChange={handleFileChange}
        />

        <button
          className="toolbar-button toolbar-button-primary"
          onClick={(e) => { e.currentTarget.blur(); onAddText?.(); }}
          title="Add text"
        >
          <span className="toolbar-icon">📝</span>
        </button>

        <button
          className="toolbar-button toolbar-button-primary"
          onClick={(e) => { e.currentTarget.blur(); onAddRoom?.('#6366f1'); }}
          title="Add room"
        >
          <span className="toolbar-icon">🎨</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* GROUP 2: HISTORY */}
      {(onUndo || onRedo) && (
        <>
          <div className="toolbar-group">
            {onUndo && (
              <button
                className="toolbar-button"
                onClick={(e) => { e.currentTarget.blur(); onUndo(); }}
                disabled={!canUndo}
                title="Undo (Cmd+Z)"
                style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
              >
                <span className="toolbar-icon">↶</span>
              </button>
            )}

            {onRedo && (
              <button
                className="toolbar-button"
                onClick={(e) => { e.currentTarget.blur(); onRedo(); }}
                disabled={!canRedo}
                title="Redo (Cmd+Shift+Z)"
                style={{ opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed' }}
              >
                <span className="toolbar-icon">↷</span>
              </button>
            )}
          </div>

          <div className="toolbar-separator" />
        </>
      )}

      {/* GROUP 3: ARRANGE */}
      <div className="toolbar-group">
        <button
          className="toolbar-button"
          onClick={(e) => { e.currentTarget.blur(); onBringToFront?.(); }}
          disabled={!hasSelection}
          title="Bring to front"
          style={{ opacity: hasSelection ? 1 : 0.4, cursor: hasSelection ? 'pointer' : 'not-allowed' }}
        >
          <span className="toolbar-icon">↑</span>
        </button>
        {onSendBackward && (
          <button
            className="toolbar-button"
            onClick={(e) => { e.currentTarget.blur(); onSendBackward(); }}
            disabled={!hasSelection}
            title="Send backward"
            style={{ opacity: hasSelection ? 1 : 0.4, cursor: hasSelection ? 'pointer' : 'not-allowed' }}
          >
            <span className="toolbar-icon">↓</span>
          </button>
        )}

        <button
          className="toolbar-button"
          onClick={(e) => { e.currentTarget.blur(); onAlignGrid?.(); }}
          title="Align to grid"
        >
          <span className="toolbar-icon">⊞</span>
        </button>

        <button
          className={`toolbar-button ${isPresentMode ? 'toolbar-button-danger' : ''}`}
          onClick={(e) => { e.currentTarget.blur(); onTogglePresent?.(); }}
          title={isPresentMode ? 'Stop presentation' : 'Start presentation'}
        >
          <span className="toolbar-icon">{isPresentMode ? '■' : '▶'}</span>
        </button>
      </div>

      <div className="toolbar-separator" />

      {/* GROUP 4: PANELS */}
      <div className="toolbar-group">
        {onOpenLayers && (
          <button
            className="toolbar-button"
            onClick={(e) => { e.currentTarget.blur(); onOpenLayers(); }}
            title="Layers"
          >
            <span className="toolbar-icon">☰</span>
          </button>
        )}

        {onOpenControls && (
          <button
            className="toolbar-button"
            onClick={(e) => { e.currentTarget.blur(); onOpenControls(); }}
            title="Controls"
          >
            <span className="toolbar-icon">⚙</span>
          </button>
        )}

        {onOpenPalette && (
          <button
            className="toolbar-button"
            onClick={(e) => { e.currentTarget.blur(); onOpenPalette(); }}
            title="Palette"
          >
            <span className="toolbar-icon">🪣</span>
          </button>
        )}
      </div>

      <div className="toolbar-separator" />

      {/* GROUP 5: FILE */}
      <div className="toolbar-group">
        <button
          className="toolbar-button toolbar-button-secondary"
          onClick={(e) => { e.currentTarget.blur(); onExport?.(); }}
          title="Export"
        >
          <span className="toolbar-icon">💾</span>
        </button>

        <button
          className="toolbar-button toolbar-button-secondary"
          onClick={(e) => { e.currentTarget.blur(); onImport?.(); }}
          title="Import"
        >
          <span className="toolbar-icon">📂</span>
        </button>

        {onClearCanvas && (
          <button
            className="toolbar-button toolbar-button-secondary"
            onClick={(e) => { e.currentTarget.blur(); onClearCanvas(); }}
            title="Clear canvas"
          >
            <span className="toolbar-icon">🗑</span>
          </button>
        )}

        {onOpenHelp && (
          <button
            className="toolbar-button toolbar-button-secondary"
            onClick={(e) => { e.currentTarget.blur(); onOpenHelp(); }}
            title="Help"
          >
            <span className="toolbar-icon">?</span>
          </button>
        )}
      </div>

      <div
        ref={dragHandleRef}
        className="toolbar-drag-handle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Drag toolbar"
      >
        <span className="toolbar-drag-grip" />
      </div>
    </div>
  );
});
