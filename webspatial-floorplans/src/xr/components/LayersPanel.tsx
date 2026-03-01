import { useState, useRef } from 'react';
import type { Item } from '../logic/items';
import type { BoardAction } from '../logic/items';

interface LayersPanelProps {
  items: Item[];
  selectedId: string | undefined;
  dispatch: React.Dispatch<BoardAction>;
  onSelectItem: (id: string | undefined) => void;
}

export function LayersPanel({ items, selectedId, dispatch, onSelectItem }: LayersPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'text' | 'room'>('all');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const dragStartIndex = useRef<number>(-1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Filter items based on search and type
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery ||
      item.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || item.kind === filterType || (filterType === 'room' && item.kind === 'swatch');

    return matchesSearch && matchesType;
  });

  // Sort items by Z depth (ascending - front items first) and zIndex (descending)
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;  // Lower z (front) first
    return b.zIndex - a.zIndex;          // Higher zIndex first within same depth
  });

  const getItemIcon = (kind: string) => {
    switch (kind) {
      case 'image': return '🖼';
      case 'text': return 'T';
      case 'room': return '◼';
      default: return '•';
    }
  };

  const getItemLabel = (item: Item) => {
    // Use custom name if available
    if (item.name) {
      return item.name;
    }

    // Auto-generate based on type
    if (item.kind === 'text' && item.text) {
      return item.text.slice(0, 30) + (item.text.length > 30 ? '...' : '');
    }
    if (item.kind === 'room' || item.kind === 'swatch') {
      return item.color || 'Color';
    }
    if (item.kind === 'image') {
      return 'Image';
    }
    return `${item.kind}`;
  };

  const handleDelete = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.blur();
    // Direct delete without confirmation for Vision Pro compatibility
    // window.confirm() doesn't work in visionOS/WebSpatial
    dispatch({ type: 'REMOVE_ITEM', id });
  };

  const handleDuplicate = (item: Item, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();

    // Find a unique offset by checking existing item positions
    // Start with offset 20 and increment until we find a free spot
    let offset = 20;
    const maxOffset = 200;
    while (offset < maxOffset) {
      const targetX = item.x + offset;
      const targetY = item.y + offset;
      // Check if any item is within 10px of this position
      const overlap = items.some(
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
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (item: Item, index: number, e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedItemId(item.id);
    dragStartIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';

    // Set drag image (optional - makes it look nicer)
    if (e.currentTarget instanceof HTMLElement) {
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.5';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragOver = (item: Item, _index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (draggedItemId && draggedItemId !== item.id) {
      setDragOverItemId(item.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverItemId(null);
  };

  const handleDrop = (targetItem: Item, targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItemId || draggedItemId === targetItem.id) {
      setDraggedItemId(null);
      setDragOverItemId(null);
      return;
    }

    // Find the dragged item
    const draggedItem = sortedItems.find(i => i.id === draggedItemId);
    if (!draggedItem) return;

    // Calculate new z-index based on drop position
    // Items are sorted by z (descending) then zIndex (descending)
    // So we need to match the target item's z-index or adjust relative to nearby items

    const newZIndex = targetItem.zIndex + (targetIndex > dragStartIndex.current ? -1 : 1);

    dispatch({
      type: 'UPDATE_ITEM',
      id: draggedItemId,
      updates: { zIndex: newZIndex }
    });

    setDraggedItemId(null);
    setDragOverItemId(null);
    dragStartIndex.current = -1;
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedItemId(null);
    setDragOverItemId(null);
    dragStartIndex.current = -1;
  };

  // Visibility toggle handler
  const handleToggleVisibility = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();
    dispatch({ type: 'TOGGLE_VISIBILITY', id });
  };

  // Lock toggle handler
  const handleToggleLock = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();
    dispatch({ type: 'TOGGLE_LOCK', id });
  };

  // Layer name editing handlers
  const handleStartEdit = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItemId(item.id);
    setEditingName(item.name || getItemLabel(item));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };

  const handleNameBlur = (itemId: string) => {
    if (editingName.trim()) {
      dispatch({ type: 'RENAME_ITEM', id: itemId, name: editingName.trim() });
    }
    setEditingItemId(null);
    setEditingName('');
  };

  const handleNameKeyDown = (_itemId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditingItemId(null);
      setEditingName('');
    }
  };

  return (
    <div className="layers-panel" enable-xr>
      <div className="layers-header">
        <h3 className="layers-title">Layers</h3>
        <span className="layers-count">{filteredItems.length}</span>
      </div>

      <div className="layers-hint">
        <span className="layers-hint-icon">⋮⋮</span>
        <span className="layers-hint-text">Drag to reorder</span>
      </div>

      <div className="layers-search">
        <input
          type="text"
          placeholder="Search layers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="layers-search-input"
        />
      </div>

      <div className="layers-filters">
        {(['all', 'image', 'text', 'room'] as const).map(type => (
          <button
            key={type}
            className={`filter-btn ${filterType === type ? 'active' : ''}`}
            onClick={() => setFilterType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="layers-list">
        {sortedItems.length === 0 ? (
          <div className="layers-empty">
            <p>No items found</p>
            <small>{searchQuery ? 'Try a different search' : 'Add items to get started'}</small>
          </div>
        ) : (
          sortedItems.map((item, index) => (
            <div
              key={item.id}
              className={`layer-item ${item.id === selectedId ? 'selected' : ''} ${item.id === draggedItemId ? 'dragging' : ''} ${item.id === dragOverItemId ? 'drag-over' : ''} ${item.visible === false ? 'invisible' : ''} ${item.locked ? 'locked' : ''}`}
              onClick={() => onSelectItem(item.id)}
              onDragOver={(e) => handleDragOver(item, index, e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(item, index, e)}
            >
              <div className="layer-item-content">
                <span
                  className="layer-drag-handle"
                  title="Drag to reorder"
                  draggable
                  onDragStart={(e) => handleDragStart(item, index, e)}
                  onDragEnd={handleDragEnd}
                >
                  ⋮⋮
                </span>
                <span className="layer-icon" style={{ color: (item.kind === 'room' || item.kind === 'swatch') ? item.color : undefined }}>
                  {getItemIcon(item.kind)}
                </span>
                <div className="layer-info">
                  {editingItemId === item.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={handleNameChange}
                      onBlur={() => handleNameBlur(item.id)}
                      onKeyDown={(e) => handleNameKeyDown(item.id, e)}
                      className="layer-name-input"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="layer-label"
                      onDoubleClick={(e) => handleStartEdit(item, e)}
                      title="Double-click to rename"
                    >
                      {getItemLabel(item)}
                    </span>
                  )}
                  <span className="layer-meta">
                    {item.z}pt
                    {item.locked && ' • 🔒'}
                    {!item.visible && ' • Hidden'}
                    {item.tags.length > 0 && ` • ${item.tags.join(', ')}`}
                  </span>
                </div>
              </div>
              <div className="layer-actions">
                <button
                  className={`layer-action-btn visibility-toggle ${item.visible === false ? 'active hidden' : ''}`}
                  onClick={(e) => handleToggleVisibility(item.id, e)}
                  title={item.visible === false ? 'Show' : 'Hide'}
                >
                  {item.visible !== false ? '👁' : '🙈'}
                </button>
                <button
                  className={`layer-action-btn lock-toggle ${item.locked === true ? 'active locked' : ''}`}
                  onClick={(e) => handleToggleLock(item.id, e)}
                  title={item.locked === true ? 'Unlock' : 'Lock'}
                >
                  {item.locked === true ? '🔒' : '🔐'}
                </button>
                <button
                  className="layer-action-btn"
                  onClick={(e) => handleDuplicate(item, e)}
                  title="Duplicate"
                >
                  ⧉
                </button>
                <button
                  className="layer-action-btn danger"
                  onClick={(e) => handleDelete(item.id, e)}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
