import { useCallback } from 'react';
import '../styles/xr.css';

export function WelcomeScene() {
  const handleDismiss = useCallback(() => {
    // Navigate to board
    const url = new URL(window.location.href);
    url.searchParams.set('scene', 'board');
    window.location.href = url.toString();
  }, []);

  return (
    <div className="welcome-scene">
      <h2 className="welcome-title">Inferno Vision</h2>
      <p className="welcome-subtitle">Open these panels from the toolbar to enhance your workspace:</p>

      <div className="welcome-panels">
        <div className="welcome-panel-item">
          <span className="welcome-panel-icon">☰</span>
          <div className="welcome-panel-text">
            <strong>Layers</strong>
            <span>Manage & reorder items</span>
          </div>
        </div>
        <div className="welcome-panel-item">
          <span className="welcome-panel-icon">⚙</span>
          <div className="welcome-panel-text">
            <strong>Controls</strong>
            <span>Adjust properties & depth</span>
          </div>
        </div>
        <div className="welcome-panel-item">
          <span className="welcome-panel-icon">🎨</span>
          <div className="welcome-panel-text">
            <strong>Palette</strong>
            <span>Pick & apply colors</span>
          </div>
        </div>
      </div>

      <button className="welcome-dismiss-btn" onClick={handleDismiss}>
        Got it!
      </button>
    </div>
  );
}
