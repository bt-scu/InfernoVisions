import { useRef, useEffect, useState, useMemo } from 'react';
import type { Item } from '../logic/items';

interface MinimapProps {
  items: Item[];
  selectedIds: string[];
  onNavigate: (x: number, y: number) => void;
  onSelectItem?: (id: string) => void;
}

// Padding around content bounds for visual breathing room
const BOUNDS_PADDING = 80;

export function Minimap({ items, selectedIds, onNavigate, onSelectItem }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const minimapWidth = 280;
  const minimapHeight = 200;

  // Calculate bounds dynamically from item positions
  const bounds = useMemo(() => {
    if (items.length === 0) {
      // Default bounds when no items
      return { minX: 0, minY: 0, maxX: 1000, maxY: 750 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    items.forEach(item => {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x);
      maxY = Math.max(maxY, item.y);
    });

    // Add padding around bounds
    return {
      minX: minX - BOUNDS_PADDING,
      minY: minY - BOUNDS_PADDING,
      maxX: maxX + BOUNDS_PADDING,
      maxY: maxY + BOUNDS_PADDING,
    };
  }, [items]);

  // Calculate content dimensions and uniform scale
  const { scale, offsetX, offsetY } = useMemo(() => {
    const contentWidth = Math.max(bounds.maxX - bounds.minX, 100);
    const contentHeight = Math.max(bounds.maxY - bounds.minY, 100);

    // Use uniform scale to maintain aspect ratio
    const scaleToFitWidth = minimapWidth / contentWidth;
    const scaleToFitHeight = minimapHeight / contentHeight;
    const uniformScale = Math.min(scaleToFitWidth, scaleToFitHeight);

    // Center content in minimap
    const scaledWidth = contentWidth * uniformScale;
    const scaledHeight = contentHeight * uniformScale;
    const offX = (minimapWidth - scaledWidth) / 2;
    const offY = (minimapHeight - scaledHeight) / 2;

    return { scale: uniformScale, offsetX: offX, offsetY: offY };
  }, [bounds, minimapWidth, minimapHeight]);

  // Helper to convert item coords to minimap coords
  const toMinimapCoords = (itemX: number, itemY: number) => ({
    x: (itemX - bounds.minX) * scale + offsetX,
    y: (itemY - bounds.minY) * scale + offsetY,
  });

  // Helper to convert minimap coords back to board coords
  const toBoardCoords = (minimapX: number, minimapY: number) => ({
    x: (minimapX - offsetX) / scale + bounds.minX,
    y: (minimapY - offsetY) / scale + bounds.minY,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, minimapWidth, minimapHeight);

    // Draw background with subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, minimapWidth, minimapHeight);
    gradient.addColorStop(0, 'rgba(248, 250, 252, 0.8)');
    gradient.addColorStop(1, 'rgba(241, 245, 249, 0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, minimapWidth, minimapHeight);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 50 * scale;
    for (let gx = 0; gx < minimapWidth; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, minimapHeight);
      ctx.stroke();
    }
    for (let gy = 0; gy < minimapHeight; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(minimapWidth, gy);
      ctx.stroke();
    }

    // Sort items by depth (render far items first)
    const sortedItems = [...items].sort((a, b) => a.z - b.z);

    // Draw items
    sortedItems.forEach(item => {
      const { x, y } = toMinimapCoords(item.x, item.y);
      const baseSize = 12;
      const depthBonus = (item.z / 80) * 6;
      const size = baseSize + depthBonus;

      const isSelected = selectedIds.includes(item.id);
      const isHovered = hoveredItemId === item.id;

      // Draw shadow for depth
      if (item.z > 0) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 4 + (item.z / 80) * 8;
        ctx.shadowOffsetX = 2 + (item.z / 80) * 3;
        ctx.shadowOffsetY = 2 + (item.z / 80) * 3;
      }

      // Draw based on item type
      if (item.kind === 'swatch' && item.color) {
        // Swatches: circles with actual color
        ctx.fillStyle = item.color;
        ctx.strokeStyle = isSelected ? '#6366f1' : 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = isSelected ? 2.5 : (isHovered ? 2 : 1);
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (item.kind === 'text') {
        // Text: rounded rectangles
        const rectSize = size * 1.2;
        ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.85)' : 'rgba(99, 102, 241, 0.4)';
        ctx.strokeStyle = isSelected ? '#6366f1' : 'rgba(99, 102, 241, 0.6)';
        ctx.lineWidth = isSelected ? 2.5 : (isHovered ? 2 : 1);
        ctx.beginPath();
        ctx.roundRect(x - rectSize / 2, y - rectSize / 3, rectSize, rectSize / 1.5, 3);
        ctx.fill();
        ctx.stroke();
      } else {
        // Images: squares
        const squareSize = size;
        ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.85)' : 'rgba(99, 102, 241, 0.4)';
        ctx.strokeStyle = isSelected ? '#6366f1' : 'rgba(99, 102, 241, 0.6)';
        ctx.lineWidth = isSelected ? 2.5 : (isHovered ? 2 : 1);
        ctx.beginPath();
        ctx.roundRect(x - squareSize / 2, y - squareSize / 2, squareSize, squareSize, 2);
        ctx.fill();
        ctx.stroke();
      }

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Highlight if hovered
      if (isHovered) {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, size / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, minimapWidth, minimapHeight);
  }, [items, selectedIds, hoveredItemId, scale, offsetX, offsetY, bounds, toMinimapCoords]);

  const findItemAtPosition = (canvasX: number, canvasY: number): string | null => {
    // Convert canvas coordinates back to board coordinates
    const { x: boardX, y: boardY } = toBoardCoords(canvasX, canvasY);

    // Find item at this position (check in reverse order to match rendering)
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const dx = item.x - boardX;
      const dy = item.y - boardY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const baseSize = 12;
      const depthBonus = (item.z / 80) * 6;
      const size = baseSize + depthBonus;

      // Scale tolerance by current scale factor
      const tolerance = (size / 2 + 5) / scale;
      if (distance <= tolerance) {
        return item.id;
      }
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Check if clicking on an item
    const itemId = findItemAtPosition(canvasX, canvasY);
    if (itemId && onSelectItem) {
      onSelectItem(itemId);
    } else {
      // Navigate to clicked position
      const { x, y } = toBoardCoords(canvasX, canvasY);
      onNavigate(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    const itemId = findItemAtPosition(canvasX, canvasY);
    setHoveredItemId(itemId);
  };

  const handleMouseLeave = () => {
    setHoveredItemId(null);
  };

  // Count items by type
  const imageCount = items.filter(i => i.kind === 'image').length;
  const textCount = items.filter(i => i.kind === 'text').length;
  const swatchCount = items.filter(i => i.kind === 'swatch').length;

  return (
    <div className="minimap-container" enable-xr>
      <div className="minimap-header">
        <h4 className="minimap-title">Navigator</h4>
        <span className="minimap-count">{items.length}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={minimapWidth}
        height={minimapHeight}
        className="minimap-canvas"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: hoveredItemId ? 'pointer' : 'crosshair' }}
      />
      <div className="minimap-legend">
        <div className="minimap-legend-item">
          <div className="minimap-legend-icon">◼</div>
          <span>{imageCount}</span>
        </div>
        <div className="minimap-legend-item">
          <div className="minimap-legend-icon">▭</div>
          <span>{textCount}</span>
        </div>
        <div className="minimap-legend-item">
          <div className="minimap-legend-icon">●</div>
          <span>{swatchCount}</span>
        </div>
      </div>
    </div>
  );
}
