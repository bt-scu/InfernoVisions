import { useState, useEffect } from 'react';
import '../styles/xr.css';

interface WelcomePopupProps {
  onDismiss: (dontShowAgain: boolean) => void;
}

export function WelcomePopup({ onDismiss }: WelcomePopupProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    setIsVisible(false);
    // Wait for fade out animation before calling onDismiss
    setTimeout(() => {
      onDismiss(dontShowAgain);
    }, 200);
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleGetStarted();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [dontShowAgain]);

  return (
    <div
      className={`welcome-popup-overlay ${isVisible ? 'visible' : ''}`}
      onClick={handleGetStarted}
      enable-xr
      style={{ '--xr-back': '0', '--xr-z-index': '9999' } as React.CSSProperties}
    >
      <div
        className={`welcome-popup ${isVisible ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
        enable-xr
      >
        <div className="welcome-popup-header">
          <h1 className="welcome-popup-title">Welcome to Spatial Canvas</h1>
          <p className="welcome-popup-subtitle">Your 3D moodboard workspace</p>
        </div>

        <div className="welcome-popup-content">
          <p className="welcome-popup-intro">
            Open these panels from the toolbar to enhance your workflow:
          </p>

          <div className="welcome-popup-features">
            <div className="welcome-popup-feature">
              <span className="welcome-popup-feature-icon">☰</span>
              <div className="welcome-popup-feature-info">
                <strong>Layers</strong>
                <span>Manage and reorder your items</span>
              </div>
            </div>

            <div className="welcome-popup-feature">
              <span className="welcome-popup-feature-icon">⚙</span>
              <div className="welcome-popup-feature-info">
                <strong>Controls</strong>
                <span>Adjust properties, depth, and view minimap</span>
              </div>
            </div>

            <div className="welcome-popup-feature">
              <span className="welcome-popup-feature-icon">🪣</span>
              <div className="welcome-popup-feature-info">
                <strong>Palette</strong>
                <span>Extract and apply colors from images</span>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-popup-footer">
          <label className="welcome-popup-checkbox">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span>Don't show this again</span>
          </label>

          <button
            className="welcome-popup-button"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
