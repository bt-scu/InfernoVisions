import { useRef, useEffect, useState, type CSSProperties } from 'react';
import type { Item as ItemType } from '../logic/items';

interface ItemProps {
  item: ItemType;
  isSelected: boolean;
  onPointerDown: (id: string, e: React.PointerEvent) => void;
  onClick: (id: string, e?: React.MouseEvent) => void;
  onRotate?: (id: string, rotation: number) => void;
  onScale?: (id: string, scale: number) => void;
  onContextMenu?: (itemId: string, x: number, y: number) => void;
  className?: string;
  onDelete?: (id: string) => void;
  onEditText?: (id: string, text: string) => void;
}

const ItemComponent = ({
  item,
  isSelected,
  onPointerDown,
  onClick,
  onRotate,
  onScale,
  onContextMenu,
  className,
  onDelete,
  onEditText,
}: ItemProps) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [currentDepth, setCurrentDepth] = useState(item.z);
  const animationRef = useRef<number | null>(null);

  // Local state for smooth scale during drag
  const [activeScale, setActiveScale] = useState<number | null>(null);
  const [isScaling, setIsScaling] = useState(false);
  const scaleStartRef = useRef<{ y: number; scale: number } | null>(null);

  // Local state for text editing
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text || '');
  const textInputRef = useRef<HTMLInputElement>(null);

  // Use actual depth (no focus lift - so user can see effect of layer arrows)
  const targetDepth = item.z;

  // Exit editing mode when item is deselected
  useEffect(() => {
    if (!isSelected && isEditing) {
      handleTextSubmit();
    }
  }, [isSelected]);

  // Smooth depth animation using requestAnimationFrame
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startDepth = currentDepth;
    const startTime = performance.now();
    const duration = 200; // ms

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic function
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const newDepth = startDepth + (targetDepth - startDepth) * easeProgress;
      setCurrentDepth(newDepth);

      if (itemRef.current) {
        itemRef.current.style.setProperty('--xr-back', String(newDepth));
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetDepth, item.z, isSelected, currentDepth]);

  const depth = currentDepth;

  // Use active scale during drag, otherwise use item scale
  const currentScale = activeScale !== null ? activeScale : item.scale;

  // Inline styles for spatial properties
  const style: CSSProperties = {
    left: `${item.x}px`,
    top: `${item.y}px`,
    transform: `rotate(${item.rot}deg) scale(${currentScale})`,
    '--xr-back': String(depth),
    '--xr-z-index': String(item.zIndex),
    zIndex: item.zIndex,
    opacity: item.opacity,
    cursor: item.locked ? 'not-allowed' : 'move',
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Block interactions if item is locked
    if (item.locked) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Don't trigger drag if clicking on rotate/scale handles
    // Check both target and its parent (in case clicking on text inside handle)
    let target = e.target as HTMLElement;
    while (target && target !== e.currentTarget) {
      if (
        target.classList?.contains('item-rotate-handle') ||
        target.classList?.contains('item-scale-handle') ||
        target.classList?.contains('item-delete-button') ||
        target.classList?.contains('item-edit-button') ||
        target.classList?.contains('item-text-input')
      ) {
        return;
      }
      target = target.parentElement as HTMLElement;
    }

    // Prevent default to avoid text selection during drag
    e.preventDefault();

    // Allow dragging from anywhere on the item
    onPointerDown(item.id, e);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(item.id, e);
  };

  const handleContextMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(item.id, e.clientX, e.clientY);
    }
  };

  const handleRotateControl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onRotate || item.locked) return;

    // Simple click: rotate 90 degrees each time
    const newRot = item.rot + 90;
    onRotate(item.id, newRot);
  };

  const handleScaleStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!onScale || item.locked) return;

    // Capture pointer
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    // Store start position and scale
    scaleStartRef.current = {
      y: e.clientY,
      scale: item.scale,
    };
    setIsScaling(true);
  };

  const handleScaleMove = (e: React.PointerEvent) => {
    if (!isScaling || !scaleStartRef.current) return;

    e.stopPropagation();
    e.preventDefault();

    // Calculate scale change based on vertical movement
    const deltaY = scaleStartRef.current.y - e.clientY;
    const scaleDelta = deltaY * 0.01; // 100px = 1x scale change
    const newScale = scaleStartRef.current.scale + scaleDelta;

    // Apply with clamping
    const clampedScale = Math.max(0.3, Math.min(3, newScale));
    setActiveScale(clampedScale);
  };

  const handleScaleEnd = (e: React.PointerEvent) => {
    if (!isScaling) return;

    e.stopPropagation();
    e.preventDefault();

    // Release pointer capture
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }

    // Commit final scale
    const finalScale = activeScale !== null ? activeScale : item.scale;
    setActiveScale(null);
    setIsScaling(false);
    scaleStartRef.current = null;

    if (onScale) {
      onScale(item.id, finalScale);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.blur();
    onDelete?.(item.id);
  };

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.blur();
    setIsEditing(true);
    setEditText(item.text || '');
    // Focus the input after rendering
    setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.select();
    }, 50);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
      setEditText(item.text || '');
    }
  };

  const handleTextSubmit = () => {
    if (onEditText && editText.trim()) {
      onEditText(item.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleTextBlur = () => {
    handleTextSubmit();
  };

  return (
    <div
      ref={itemRef}
      className={`item ${item.locked ? 'locked' : ''} ${className || ''}`}
      data-item-id={item.id}
      enable-xr
      style={style}
      aria-selected={isSelected}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onContextMenu={handleContextMenuClick}
    >
      <div className="item-handle" />
      {isSelected && !item.locked && (
        <>
          {onDelete && (
            <button
              className="item-delete-button"
              onClick={handleDeleteClick}
              title="Delete item"
            >
              ×
            </button>
          )}
          <div
            className="item-rotate-handle"
            onClick={handleRotateControl}
            style={{ transform: `rotate(-${item.rot}deg)` }}
            title="Rotate 90°"
          >
            ↻
          </div>
          <div
            className="item-scale-handle"
            onPointerDown={handleScaleStart}
            onPointerMove={handleScaleMove}
            onPointerUp={handleScaleEnd}
            style={{ transform: `rotate(-${item.rot}deg)` }}
            title="Resize (drag up/down)"
          >
            ⇲
          </div>
          {item.kind === 'text' && onEditText && (
            <button
              className="item-edit-button"
              onClick={handleEditClick}
              style={{ transform: `rotate(-${item.rot}deg)` }}
              title="Edit text"
            >
              edit
            </button>
          )}
        </>
      )}
      {isSelected && item.locked && (
        <div
          className="item-locked-indicator"
          style={{ transform: `rotate(-${item.rot}deg)` }}
          title="Item is locked"
        >
          🔒
        </div>
      )}
      <div className="item-content">
        {item.kind === 'image' && item.src && (
          <img src={item.src} alt="Spatial Canvas item" className="item-image" />
        )}
        {item.kind === 'swatch' && item.color && (
          <div
            className="item-swatch"
            style={{ background: item.color }}
          />
        )}
        {item.kind === 'text' && (
          isEditing ? (
            <input
              ref={textInputRef}
              type="text"
              value={editText}
              onChange={handleTextChange}
              onKeyDown={handleTextKeyDown}
              onBlur={handleTextBlur}
              className="item-text-input"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="item-text">{item.text}</div>
          )
        )}
      </div>
    </div>
  );
}

// Export without memo for now - simpler approach
export const Item = ItemComponent;
