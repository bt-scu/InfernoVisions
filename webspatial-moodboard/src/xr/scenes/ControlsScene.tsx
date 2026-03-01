import { useEffect, useState } from 'react';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { Minimap } from '../components/Minimap';
import { DepthSlider } from '../components/DepthSlider';
import { createChannel, closeChannel } from '../logic/channel';
import type { ChannelMessage } from '../logic/channel';
import type { Item, BoardAction } from '../logic/items';
import '../styles/xr.css';

export function ControlsScene() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Listen for updates from BoardScene
  useEffect(() => {
    const channel = createChannel((message: ChannelMessage) => {
      if (message.type === 'itemsUpdate') {
        setItems(message.items || []);
      } else if (message.type === 'selectionUpdate') {
        setSelectedIds(message.selectedIds || []);
      }
    });

    // Request initial state with retry logic
    const requestState = () => {
      channel.postMessage({ type: 'requestState' });
    };

    // Request immediately
    requestState();

    // Retry after delays in case BoardScene wasn't ready yet
    const retryTimer1 = setTimeout(requestState, 300);
    const retryTimer2 = setTimeout(requestState, 800);

    return () => {
      clearTimeout(retryTimer1);
      clearTimeout(retryTimer2);
      closeChannel(channel);
    };
  }, []);

  // Create a dispatch function that sends actions to BoardScene
  const dispatch = (action: BoardAction) => {
    const channel = new BroadcastChannel('moodboard');
    channel.postMessage({ type: 'boardAction', action });
    channel.close();
  };

  const handleDepthChange = (z: number) => {
    // Apply to all selected items
    selectedIds.forEach(id => {
      dispatch({ type: 'SET_DEPTH', id, z });
    });
  };

  const handleNavigate = (x: number, y: number) => {
    const channel = new BroadcastChannel('moodboard');
    channel.postMessage({ type: 'navigate', x, y });
    channel.close();
  };

  const handleSelectItem = (id: string) => {
    const channel = new BroadcastChannel('moodboard');
    channel.postMessage({ type: 'selectItem', id });
    channel.close();
  };

  const selectedItem = selectedIds.length > 0
    ? items.find(i => i.id === selectedIds[0])
    : undefined;

  return (
    <div className="controls-scene">
      <div className="controls-container">
        <Minimap
          items={items}
          selectedIds={selectedIds}
          onNavigate={handleNavigate}
          onSelectItem={handleSelectItem}
        />
        <PropertiesPanel
          item={selectedItem}
          dispatch={dispatch}
        />
        <div className="depth-slider-wrapper">
          <DepthSlider
            value={selectedItem?.z ?? 0}
            onChange={handleDepthChange}
            disabled={selectedIds.length === 0}
          />
        </div>
      </div>
    </div>
  );
}
