import { useEffect, useRef, useState } from 'react';
import { createChannel, closeChannel } from '../logic/channel';
import type { Item } from '../logic/items';
import '../styles/xr.css';

export function ClearScene() {
  const [itemCount, setItemCount] = useState(0);
  const [isCleared, setIsCleared] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const itemsRef = useRef<Item[]>([]);

  // Create channel and request current state
  useEffect(() => {
    channelRef.current = createChannel((message) => {
      if (message.type === 'itemsUpdate' && Array.isArray(message.items)) {
        itemsRef.current = message.items;
        setItemCount(message.items.length);
      }
    });

    // Request current state from board
    channelRef.current.postMessage({ type: 'requestState' });

    return () => {
      if (channelRef.current) {
        closeChannel(channelRef.current);
      }
    };
  }, []);

  const handleSaveFirst = () => {
    if (!channelRef.current) return;

    // Open export window for user to save, then close this dialog
    // User can clear manually after saving
    channelRef.current.postMessage({ type: 'openExport' });

    // Close the clear dialog after a short delay
    setTimeout(() => window.close(), 300);
  };

  const handleClearOnly = () => {
    if (!channelRef.current) return;

    channelRef.current.postMessage({
      type: 'boardAction',
      action: { type: 'CLEAR_ALL' }
    });
    setIsCleared(true);
    setTimeout(() => window.close(), 800);
  };

  const handleCancel = () => {
    window.close();
  };

  return (
    <div className="clear-scene">
      <div className="clear-scene-header">
        <h2 className="clear-scene-title">Clear Canvas</h2>
        <button className="clear-scene-close" onClick={handleCancel}>
          &times;
        </button>
      </div>

      <div className="clear-scene-content">
        {isCleared ? (
          <div className="clear-scene-success">
            <span className="clear-scene-success-icon">✓</span>
            <p>Canvas cleared!</p>
          </div>
        ) : (
          <>
            <p className="clear-scene-message">
              This will remove all {itemCount} item{itemCount !== 1 ? 's' : ''} from the canvas.
            </p>
            <p className="clear-scene-submessage">
              Would you like to save your work first?
            </p>
          </>
        )}
      </div>

      {!isCleared && (
        <div className="clear-scene-actions">
          <button
            className="clear-scene-btn clear-scene-btn-primary"
            onClick={handleSaveFirst}
          >
            Save First
          </button>
          <button
            className="clear-scene-btn clear-scene-btn-danger"
            onClick={handleClearOnly}
          >
            Clear
          </button>
          <button
            className="clear-scene-btn clear-scene-btn-secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
