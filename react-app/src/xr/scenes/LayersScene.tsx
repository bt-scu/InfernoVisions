import { useEffect, useState } from 'react';
import { LayersPanel } from '../components/LayersPanel';
import { createChannel, closeChannel } from '../logic/channel';
import type { ChannelMessage } from '../logic/channel';
import type { Item, BoardAction } from '../logic/items';
import '../styles/xr.css';

export function LayersScene() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // Listen for updates from BoardScene
  useEffect(() => {
    const channel = createChannel((message: ChannelMessage) => {
      if (message.type === 'itemsUpdate') {
        setItems(message.items || []);
      } else if (message.type === 'selectionUpdate') {
        setSelectedId(message.selectedId);
      }
    });

    // Request initial state with retry logic
    const requestState = () => {
      channel.postMessage({ type: 'requestState' });
    };

    // Request immediately
    requestState();

    // Retry after a delay in case BoardScene wasn't ready yet
    const retryTimer = setTimeout(requestState, 300);

    return () => {
      clearTimeout(retryTimer);
      closeChannel(channel);
    };
  }, []);

  // Create a dispatch function that sends actions to BoardScene
  const dispatch = (action: BoardAction) => {
    const channel = new BroadcastChannel('moodboard');
    channel.postMessage({ type: 'boardAction', action });
    channel.close();
  };

  const handleSelectItem = (id: string | undefined) => {
    const channel = new BroadcastChannel('moodboard');
    channel.postMessage({ type: 'selectItem', id });
    channel.close();
  };

  return (
    <div className="layers-scene">
      <LayersPanel
        items={items}
        selectedId={selectedId}
        dispatch={dispatch}
        onSelectItem={handleSelectItem}
      />
    </div>
  );
}
