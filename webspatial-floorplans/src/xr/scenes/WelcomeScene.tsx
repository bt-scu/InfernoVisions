import { useCallback } from 'react';
import '../styles/xr.css';

export function WelcomeScene() {
  const handleDismiss = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('scene', 'board');
    window.location.href = url.toString();
  }, []);

  return (
    <div className="welcome-scene">
      <h2 className="welcome-title">Inferno Vision</h2>
      <p className="welcome-subtitle">Please choose from the buildings listed below:</p>

      <div className="welcome-panels">
        <div className="welcome-panel-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="welcome-panel-icon">🏢</span>
            <div className="welcome-panel-text">
              <strong>Building 1</strong>
            </div>
          </div>
          <button
            className="welcome-dismiss-btn"
            onClick={handleDismiss}
            style={{ width: 'auto', padding: '12px 24px', margin: 0, transition: 'background 0.2s, color 0.2s' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#B82424';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.95)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.95)';
              (e.currentTarget as HTMLButtonElement).style.color = '#B82424';
            }}
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}