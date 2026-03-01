import { useState, useEffect, useRef } from 'react';
import type { BoardAction } from '../logic/items';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: React.Dispatch<BoardAction>;
  onAddText: () => void;
  onAddRoom: (color: string) => void;
  onAlignGrid: () => void;
  onTogglePresent: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenPalette: () => void;
  hasSelection: boolean;
}

export function CommandPalette({
  isOpen,
  onClose,
  dispatch: _dispatch,
  onAddText,
  onAddRoom,
  onAlignGrid,
  onTogglePresent,
  onExport,
  onImport,
  onOpenPalette,
  hasSelection: _hasSelection,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'add-text',
      label: 'Add Text',
      description: 'Create a new text chip',
      icon: 'T',
      action: () => {
        onAddText();
        onClose();
      },
      keywords: ['text', 'label', 'note'],
    },
    {
      id: 'add-color',
      label: 'Add Color',
      description: 'Create a room',
      icon: '◼',
      action: () => {
        onAddRoom('#6366f1');
        onClose();
      },
      keywords: ['color', 'room', 'palette'],
    },
    {
      id: 'align-grid',
      label: 'Align to Grid',
      description: 'Organize items in a grid',
      icon: '⊞',
      action: () => {
        onAlignGrid();
        onClose();
      },
      keywords: ['align', 'grid', 'organize'],
    },
    {
      id: 'select-all',
      label: 'Select All',
      description: 'Select all items on the board',
      icon: '◫',
      action: () => {
        // This will be handled by keyboard shortcut, but we can add it here too
        onClose();
      },
      keywords: ['select', 'all'],
    },
    {
      id: 'toggle-present',
      label: 'Toggle Presentation Mode',
      description: 'Start or stop presentation',
      icon: '▶',
      action: () => {
        onTogglePresent();
        onClose();
      },
      keywords: ['present', 'presentation', 'show'],
    },
    {
      id: 'open-palette',
      label: 'Open Palette Window',
      description: 'Open the color palette scene',
      icon: '🎨',
      action: () => {
        onOpenPalette();
        onClose();
      },
      keywords: ['palette', 'color', 'window'],
    },
    {
      id: 'export',
      label: 'Export Board',
      description: 'Export board as JSON',
      icon: '↓',
      action: () => {
        onExport();
        onClose();
      },
      keywords: ['export', 'save', 'download'],
    },
    {
      id: 'import',
      label: 'Import Board',
      description: 'Import board from JSON',
      icon: '↑',
      action: () => {
        onImport();
        onClose();
      },
      keywords: ['import', 'load', 'upload'],
    },
    {
      id: 'delete-selected',
      label: 'Delete Selected',
      description: 'Delete selected items',
      icon: '×',
      action: () => {
        // This will be handled by keyboard shortcut
        onClose();
      },
      keywords: ['delete', 'remove', 'trash'],
      // Only show when items are selected
    },
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(cmd => {
    if (!query) return true;

    const searchStr = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchStr) ||
      cmd.description.toLowerCase().includes(searchStr) ||
      cmd.keywords?.some(kw => kw.includes(searchStr))
    );
  });

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Escape to always close, even when dialogs are open
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()} enable-xr>
        <div className="command-search">
          <span className="command-search-icon">⌘</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="command-search-input"
          />
        </div>

        <div className="command-list">
          {filteredCommands.length === 0 ? (
            <div className="command-empty">
              <p>No commands found</p>
              <small>Try different keywords</small>
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => cmd.action()}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="command-icon">{cmd.icon}</span>
                <div className="command-info">
                  <span className="command-label">{cmd.label}</span>
                  <span className="command-description">{cmd.description}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="command-footer">
          <div className="command-hint">
            <kbd>↑↓</kbd> Navigate
            <kbd>↵</kbd> Select
            <kbd>Esc</kbd> Close
          </div>
        </div>
      </div>
    </div>
  );
}
