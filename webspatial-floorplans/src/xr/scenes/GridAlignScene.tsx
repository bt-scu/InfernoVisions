import { useEffect, useRef, useState } from 'react';
import { createChannel, closeChannel } from '../logic/channel';
import type { Item } from '../logic/items';
import '../styles/xr.css';

export function GridAlignScene() {
  const [items, setItems] = useState<Item[]>([]);
  const [isAligning, setIsAligning] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Create channel and request current state
  useEffect(() => {
    channelRef.current = createChannel((message) => {
      if (message.type === 'itemsUpdate' && Array.isArray(message.items)) {
        setItems(message.items);
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

  const handleAlign = () => {
    if (!channelRef.current) return;

    setIsAligning(true);
    channelRef.current.postMessage({
      type: 'boardAction',
      action: { type: 'ALIGN_GRID_SMART' }
    });
    setTimeout(() => window.close(), 800);
  };

  const handleCancel = () => {
    window.close();
  };

  // Count items by type
  const imageCount = items.filter(i => i.kind === 'image').length;
  const textCount = items.filter(i => i.kind === 'text').length;
  const roomCount = items.filter(i => i.kind === 'room' || i.kind === 'swatch').length;

  return (
    <div className="grid-align-scene">
      <div className="grid-align-scene-header">
        <h2 className="grid-align-scene-title">Align to Grid</h2>
        <button className="grid-align-scene-close" onClick={handleCancel}>
          &times;
        </button>
      </div>

      <div className="grid-align-scene-content">
        {isAligning ? (
          <div className="grid-align-scene-success">
            <span className="grid-align-scene-success-icon">✓</span>
            <p>Items aligned!</p>
          </div>
        ) : (
          <>
            <p className="grid-align-scene-message">
              This will arrange {items.length} item{items.length !== 1 ? 's' : ''} into a grid layout.
            </p>

            <div className="grid-align-scene-breakdown">
              {imageCount > 0 && (
                <div className="grid-align-scene-item-type">
                  <span className="grid-align-scene-item-icon">🖼</span>
                  <span>{imageCount} image{imageCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {textCount > 0 && (
                <div className="grid-align-scene-item-type">
                  <span className="grid-align-scene-item-icon">📝</span>
                  <span>{textCount} text item{textCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {roomCount > 0 && (
                <div className="grid-align-scene-item-type">
                  <span className="grid-align-scene-item-icon">🎨</span>
                  <span>{roomCount} room{roomCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <p className="grid-align-scene-warning">
              Item positions and rotations will be reset.
            </p>
          </>
        )}
      </div>

      {!isAligning && (
        <div className="grid-align-scene-actions">
          <button
            className="grid-align-scene-btn grid-align-scene-btn-secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="grid-align-scene-btn grid-align-scene-btn-primary"
            onClick={handleAlign}
            disabled={items.length === 0}
          >
            Align Grid
          </button>
        </div>
      )}
    </div>
  );
}
