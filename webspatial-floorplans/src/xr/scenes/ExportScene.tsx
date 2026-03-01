import { useEffect, useState, useRef } from 'react';
import { createChannel, closeChannel } from '../logic/channel';
import type { ChannelMessage } from '../logic/channel';
import type { Item } from '../logic/items';
import '../styles/xr.css';

const STORAGE_VERSION = 1;

export function ExportScene() {
  const [items, setItems] = useState<Item[]>([]);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Listen for items from main board
  useEffect(() => {
    const channel = createChannel((message: ChannelMessage) => {
      if (message.type === 'itemsUpdate') {
        setItems(message.items);
      }
    });

    // Request current state from board
    channel.postMessage({ type: 'requestState' });

    return () => closeChannel(channel);
  }, []);

  const state = {
    version: STORAGE_VERSION,
    items,
    savedAt: new Date().toISOString(),
  };

  const jsonString = JSON.stringify(state, null, 2);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonString);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2000);
        return;
      }

      // Fallback: select textarea and use execCommand
      if (textareaRef.current) {
        textareaRef.current.select();
        textareaRef.current.setSelectionRange(0, jsonString.length);
        const success = document.execCommand('copy');
        if (success) {
          setCopyStatus('copied');
          setTimeout(() => setCopyStatus('idle'), 2000);
          return;
        }
      }

      throw new Error('Copy not supported');
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Spatial Canvas Export',
          text: jsonString,
        });
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2000);
      } else {
        throw new Error('Share not supported');
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to share:', error);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  const handleClose = () => {
    window.close();
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="export-scene">
      <div className="export-scene-header">
        <h2 className="export-scene-title">Export Board</h2>
        <button className="export-scene-close" onClick={handleClose}>
          &times;
        </button>
      </div>

      <div className="export-scene-content">
        <textarea
          ref={textareaRef}
          className="export-scene-textarea"
          value={jsonString}
          readOnly
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
      </div>

      <div className="export-scene-actions">
        <button
          className="export-scene-button export-scene-button-primary"
          onClick={handleCopy}
        >
          {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Failed' : 'Copy JSON'}
        </button>

        {canShare && (
          <button
            className="export-scene-button export-scene-button-secondary"
            onClick={handleShare}
          >
            {shareStatus === 'shared' ? 'Shared!' : shareStatus === 'error' ? 'Failed' : 'Share JSON'}
          </button>
        )}
      </div>

      <p className="export-scene-hint">
        Copy the JSON and save it somewhere safe. Import it later to restore your board.
      </p>
    </div>
  );
}
