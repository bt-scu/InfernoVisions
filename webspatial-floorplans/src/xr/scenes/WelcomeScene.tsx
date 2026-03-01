import { useCallback } from 'react';
import { initScene } from '@webspatial/react-sdk';
import '../styles/xr.css';
import buildingIcon from '../../assets/building.png';
import infernoLogo from '../../assets/inferno.png';

export function WelcomeScene() {
  const handleDismiss = useCallback(() => {
    initScene('firefighterHub', prevConfig => ({
      ...prevConfig,
      defaultSize: { width: 1800, height: 150 },
    }));
    const hubUrl = new URL(window.location.href);
    hubUrl.searchParams.set('scene', 'firefighter-hub');
    window.open(hubUrl.toString(), 'firefighterHub');

    initScene('keyScene', prevConfig => ({
      ...prevConfig,
      defaultSize: { width: 1800, height: 150 },
    }));
    const keyUrl = new URL(window.location.href);
    keyUrl.searchParams.set('scene', 'key');
    window.open(keyUrl.toString(), 'keyScene');

    const url = new URL(window.location.href);
    url.searchParams.set('scene', 'board');
    window.location.href = url.toString();
  }, []);

  return (
    <div className="welcome-scene">
      <div style={{ flex: 0.3 }} />

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <img
          src={infernoLogo}
          alt="Inferno Vision Logo"
          style={{
            width: '200px',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '24px',
          }}
        />
      </div>

      <h2 className="welcome-title">Inferno Vision</h2>
      <p className="welcome-subtitle">Please choose from the buildings listed below:</p>

      <div className="welcome-panels">
        <div className="welcome-panel-item" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img
              src={buildingIcon}
              alt="Building"
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            <div className="welcome-panel-text">
              <strong>Building 1</strong>
            </div>
          </div>
          <button className="welcome-dismiss-btn" onClick={handleDismiss} style={{ width: 'auto', padding: '12px 24px', margin: 0 }}>
            Start
          </button>
        </div>
      </div>

      <div style={{ flex: 2 }} />
    </div>
  );
}