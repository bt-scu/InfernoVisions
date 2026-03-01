import { useEffect, useState } from 'react';
import { Swatch } from '../components/Swatch';
import { createChannel, sendMessage, closeChannel } from '../logic/channel';
import type { ChannelMessage } from '../logic/channel';
import '../styles/xr.css';

const DEFAULT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
];

export function PaletteScene() {
  const [colors] = useState<string[]>(DEFAULT_COLORS);

  // BroadcastChannel for receiving selection updates
  useEffect(() => {
    const channel = createChannel((message: ChannelMessage) => {
      // Future: listen for selection changes to extract colors from selected images
      if (message.type === 'selectItem') {
        // Could extract colors from selected image here
      }
    });

    return () => closeChannel(channel);
  }, []);

  const handleSwatchClick = (color: string) => {
    // Send color to board scene
    const channel = new BroadcastChannel('moodboard');
    sendMessage(channel, { type: 'applyColor', color });
    channel.close();
  };

  return (
    <div className="palette-scene">
      <h2 className="palette-title">Color Palette</h2>
      <div className="palette-swatches">
        {colors.map((color, index) => (
          <Swatch key={`${color}-${index}`} color={color} onClick={handleSwatchClick} />
        ))}
      </div>
      <div style={{
        marginTop: '24px',
        padding: '12px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'white',
        textAlign: 'center'
      }}>
        Click a swatch to apply color to selected item in the main board
      </div>
    </div>
  );
}
