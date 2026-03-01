import { DEPTH_STEPS } from '../logic/items';

interface DepthSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function DepthSlider({ value, onChange, disabled }: DepthSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const min = DEPTH_STEPS[0];
  const max = DEPTH_STEPS[DEPTH_STEPS.length - 1];

  // Get depth label
  const getDepthLabel = () => {
    if (disabled) return 'No selection';
    const index = DEPTH_STEPS.indexOf(value);
    const labels = ['Near', 'Mid', 'Far', 'Distant'];
    return labels[index] || `${value}pt`;
  };

  return (
    <div className="depth-slider-container" enable-xr>
      <div className="depth-slider-header">
        <span className="depth-icon">⚡</span>
        <label className="depth-slider-label">
          Depth Control
        </label>
      </div>

      <div className="depth-steps-visual">
        {DEPTH_STEPS.map((step, index) => (
          <div
            key={step}
            className={`depth-step ${value === step ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onChange(step)}
            title={`${step}pt`}
          >
            <div className="depth-step-bar" style={{
              height: `${(index + 1) * 15}px`,
              opacity: disabled ? 0.3 : (value === step ? 1 : 0.5)
            }} />
          </div>
        ))}
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className="depth-slider"
        disabled={disabled}
        list="depth-steps"
      />
      <datalist id="depth-steps">
        {DEPTH_STEPS.map(step => (
          <option key={step} value={step} />
        ))}
      </datalist>

      <div className="depth-value">
        <span className="depth-value-number">{value}pt</span>
        <span className="depth-value-label">{getDepthLabel()}</span>
      </div>

      <div className="depth-hint">
        <kbd>[</kbd> <kbd>]</kbd> to adjust
      </div>
    </div>
  );
}
