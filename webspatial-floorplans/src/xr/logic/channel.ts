// BroadcastChannel helpers for cross-scene communication
import type { Item, BoardAction } from './items';

export const CHANNEL_NAME = 'moodboard';

export type ChannelMessage =
  | { type: 'applyColor'; color: string }
  | { type: 'selectItem'; id: string | undefined }
  | { type: 'presentCluster'; tag: string }
  | { type: 'endPresent' }
  | { type: 'itemsUpdate'; items: Item[] }
  | { type: 'selectionUpdate'; selectedId?: string; selectedIds?: string[] }
  | { type: 'boardAction'; action: BoardAction }
  | { type: 'requestState' }
  | { type: 'navigate'; x: number; y: number }
  | { type: 'importItems'; items: Item[] }
  | { type: 'openExport' };

/**
 * Create a typed BroadcastChannel
 */
export function createChannel(
  onMessage: (message: ChannelMessage) => void
): BroadcastChannel {
  const channel = new BroadcastChannel(CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent) => {
    try {
      const message = event.data as ChannelMessage;
      onMessage(message);
    } catch (error) {
      console.error('Failed to handle channel message:', error);
    }
  };

  return channel;
}

/**
 * Send a message to all scenes
 */
export function sendMessage(channel: BroadcastChannel, message: ChannelMessage): void {
  try {
    channel.postMessage(message);
  } catch (error) {
    console.error('Failed to send channel message:', error);
  }
}

/**
 * Close the channel
 */
export function closeChannel(channel: BroadcastChannel): void {
  try {
    channel.close();
  } catch (error) {
    console.error('Failed to close channel:', error);
  }
}
