import type { Item } from '../logic/items';
import type { BoardAction } from '../logic/items';
import { DEPTH_STEPS } from '../logic/items';

interface PropertiesPanelProps {
  item: Item | undefined;
  dispatch: React.Dispatch<BoardAction>;
}

export function PropertiesPanel({ item, dispatch }: PropertiesPanelProps) {
  if (!item) {
    return (
      <div className="properties-panel" enable-xr>
        <div className="properties-empty">
          <div className="empty-icon">✨</div>
          <h3>No Selection</h3>
          <p>Select an item to edit its properties</p>
        </div>
      </div>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { [axis]: value } });
  };

  const handleDepthChange = (z: number) => {
    dispatch({ type: 'SET_DEPTH', id: item.id, z });
  };

  const handleRotationChange = (rot: number) => {
    dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { rot } });
  };

  const handleScaleChange = (scale: number) => {
    const clampedScale = Math.max(0.3, Math.min(3, scale));
    dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { scale: clampedScale } });
  };

  const handleColorChange = (color: string) => {
    dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { color } });
  };

  const handleTextChange = (text: string) => {
    dispatch({ type: 'UPDATE_ITEM', id: item.id, updates: { text } });
  };

  return (
    <div className="properties-panel" enable-xr>
      <div className="properties-header">
        <h3 className="properties-title">Properties</h3>
        <span className="item-type-badge">{item.kind}</span>
      </div>

      <div className="properties-content">
        {/* Position */}
        <div className="property-section">
          <label className="property-label">Position</label>
          <div className="property-row">
            <div className="property-input-group">
              <label>X</label>
              <input
                type="number"
                value={Math.round(item.x)}
                onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                className="property-input"
              />
            </div>
            <div className="property-input-group">
              <label>Y</label>
              <input
                type="number"
                value={Math.round(item.y)}
                onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                className="property-input"
              />
            </div>
          </div>
        </div>

        {/* Transform */}
        <div className="property-section">
          <label className="property-label">Transform</label>
          <div className="property-row">
            <div className="property-input-group">
              <label>Rotation</label>
              <input
                type="number"
                value={Math.round(item.rot)}
                onChange={(e) => handleRotationChange(Number(e.target.value))}
                className="property-input"
                min="0"
                max="360"
              />
            </div>
            <div className="property-input-group">
              <label>Scale</label>
              <input
                type="number"
                value={item.scale.toFixed(2)}
                onChange={(e) => handleScaleChange(Number(e.target.value))}
                className="property-input"
                min="0.1"
                max="3"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Depth */}
        <div className="property-section">
          <label className="property-label">Depth (Z-axis)</label>
          <div className="depth-quick-buttons">
            {DEPTH_STEPS.map(step => (
              <button
                key={step}
                className={`depth-btn ${item.z === step ? 'active' : ''}`}
                onClick={() => handleDepthChange(step)}
              >
                {step}pt
              </button>
            ))}
          </div>
          <input
            type="range"
            min={DEPTH_STEPS[0]}
            max={DEPTH_STEPS[DEPTH_STEPS.length - 1]}
            value={item.z}
            onChange={(e) => handleDepthChange(Number(e.target.value))}
            className="depth-slider-alt"
            list="depth-steps-alt"
          />
          <datalist id="depth-steps-alt">
            {DEPTH_STEPS.map(step => (
              <option key={step} value={step} />
            ))}
          </datalist>
        </div>

        {/* Color (for rooms) */}
        {(item.kind === 'room' || item.kind === 'swatch') && (
          <div className="property-section">
            <label className="property-label">Color</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={item.color || '#6366f1'}
                onChange={(e) => handleColorChange(e.target.value)}
                className="color-picker-input"
              />
              <input
                type="text"
                value={item.color || '#6366f1'}
                onChange={(e) => handleColorChange(e.target.value)}
                className="color-text-input"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
        )}

        {/* Text (for text items) */}
        {item.kind === 'text' && (
          <div className="property-section">
            <label className="property-label">Text Content</label>
            <textarea
              value={item.text || ''}
              onChange={(e) => handleTextChange(e.target.value)}
              className="text-content-input"
              rows={3}
            />
          </div>
        )}

        {/* Z-Index */}
        <div className="property-section">
          <label className="property-label">Layer Order</label>
          <div className="property-row">
            <button
              className="layer-order-btn"
              onClick={() => dispatch({ type: 'BRING_TO_FRONT', id: item.id })}
            >
              Bring to Front
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
