import { useState, useEffect } from 'react';
import '../styles/xr.css';

interface ToolbarHintsProps {
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  onComplete: () => void;
}

export function ToolbarHints({ onComplete }: ToolbarHintsProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 6000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onComplete, 500);
  };

  return (
    <div
      className="startup-banner"
      style={{
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="startup-banner-content">
        <span className="startup-banner-text">
          Open <strong>Layers</strong>, <strong>Controls</strong>, and <strong>Palette</strong> panels from the toolbar
        </span>
        <button className="startup-banner-close" onClick={handleDismiss}>✕</button>
      </div>
    </div>
  );
}
