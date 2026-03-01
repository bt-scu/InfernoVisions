import { useState, useRef, useEffect } from 'react';
import { createChannel, closeChannel } from '../logic/channel';
import type { Item } from '../logic/items';
import '../styles/xr.css';

const STORAGE_VERSION = 1;

interface SavedState {
  version: number;
  items: Item[];
  savedAt: string;
}

export function ImportScene() {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Create channel on mount
  useEffect(() => {
    channelRef.current = createChannel(() => {
      // We don't need to handle incoming messages in import scene
    });

    return () => {
      if (channelRef.current) {
        closeChannel(channelRef.current);
      }
    };
  }, []);

  const validateAndParse = (text: string): Item[] | null => {
    if (!text.trim()) {
      setError('Please paste JSON data or select a file');
      return null;
    }

    try {
      const parsed = JSON.parse(text);

      // Check if it's the new format with version and items
      if (parsed.version !== undefined && Array.isArray(parsed.items)) {
        const state = parsed as SavedState;
        if (state.version !== STORAGE_VERSION) {
          setError(`Unsupported version: ${state.version}. Expected version ${STORAGE_VERSION}`);
          return null;
        }
        return state.items;
      }

      // Check if it's just an array of items (legacy format)
      if (Array.isArray(parsed)) {
        return parsed as Item[];
      }

      setError('Invalid format: expected an object with "items" array or a direct array of items');
      return null;
    } catch (e) {
      setError('Invalid JSON: ' + (e instanceof Error ? e.message : 'Parse error'));
      return null;
    }
  };

  const sendItemsToBoard = (items: Item[]) => {
    // Validate items have required properties
    const validItems = items.filter(item =>
      item.id &&
      item.kind &&
      typeof item.x === 'number' &&
      typeof item.y === 'number'
    );

    if (validItems.length === 0) {
      setError('No valid items found in the data');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 2000);
      return;
    }

    // Send items to main board
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'importItems', items: validItems });
      setImportStatus('success');
      setError(null);

      // Close window after short delay
      setTimeout(() => {
        window.close();
      }, 1000);
    } else {
      setError('Communication channel not available');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 2000);
    }
  };

  const handleImport = () => {
    setError(null);
    const items = validateAndParse(jsonText);

    if (!items) {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 2000);
      return;
    }

    sendItemsToBoard(items);
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setJsonText(text);
      setError(null);

      // Auto-validate and import
      const items = validateAndParse(text);
      if (items) {
        sendItemsToBoard(items);
      }
    } catch (err) {
      console.error('Failed to read file:', err);
      setError('Failed to read file');
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 2000);
    }

    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const handleClose = () => {
    window.close();
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        setJsonText(text);
        setError(null);
      } else {
        // Focus textarea for manual paste
        textareaRef.current?.focus();
      }
    } catch (e) {
      // Focus textarea for manual paste
      textareaRef.current?.focus();
    }
  };

  const handleClear = () => {
    setJsonText('');
    setError(null);
    setImportStatus('idle');
  };

  return (
    <div className="import-scene">
      <div className="import-scene-header">
        <h2 className="import-scene-title">Import Board</h2>
        <button className="import-scene-close" onClick={handleClose}>
          &times;
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json,.txt,text/plain"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Select File button - prominent at top */}
      <div className="import-scene-file-section">
        <button
          className="import-scene-button import-scene-button-file"
          onClick={handleSelectFile}
        >
          Select File
        </button>
        <span className="import-scene-or">(.json or .txt) or paste below</span>
      </div>

      <div className="import-scene-content">
        <textarea
          ref={textareaRef}
          className={`import-scene-textarea ${error ? 'has-error' : ''}`}
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setError(null);
          }}
          placeholder="Paste your exported JSON here..."
        />
      </div>

      {error && (
        <div className="import-scene-error">
          {error}
        </div>
      )}

      <div className="import-scene-actions">
        <button
          className="import-scene-button import-scene-button-secondary"
          onClick={handlePaste}
        >
          Paste
        </button>
        <button
          className="import-scene-button import-scene-button-secondary"
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          className="import-scene-button import-scene-button-primary"
          onClick={handleImport}
          disabled={!jsonText.trim()}
        >
          {importStatus === 'success' ? 'Imported!' : importStatus === 'error' ? 'Failed' : 'Import'}
        </button>
      </div>

      <p className="import-scene-hint">
        Select a JSON file or paste exported data to restore your board.
      </p>
    </div>
  );
}
