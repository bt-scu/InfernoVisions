import '../styles/xr.css';

export function HelpScene() {
  return (
    <div className="help-scene">
      <div className="help-container">
        <header className="help-header">
          <h1 className="help-title">Quick Guide</h1>
          <p className="help-subtitle">Vision Pro Moodboard</p>
        </header>

        <div className="help-content">
          {/* Keyboard Shortcuts */}
          <section className="help-section">
            <h2 className="help-section-title">⌨️ Keyboard Shortcuts</h2>
            <div className="help-items">
              <div className="help-item">
                <kbd>Cmd</kbd> + <kbd>K</kbd>
                <span>Open command palette</span>
              </div>
              <div className="help-item">
                <kbd>[</kbd>
                <span>Move item closer (decrease depth)</span>
              </div>
              <div className="help-item">
                <kbd>]</kbd>
                <span>Move item farther (increase depth)</span>
              </div>
              <div className="help-item">
                <kbd>Delete</kbd> / <kbd>Backspace</kbd>
                <span>Delete selected items</span>
              </div>
              <div className="help-item">
                <kbd>Cmd</kbd> + <kbd>A</kbd>
                <span>Select all items</span>
              </div>
              <div className="help-item">
                <kbd>Cmd</kbd> / <kbd>Ctrl</kbd> + <span className="help-text">Click</span>
                <span>Multi-select items</span>
              </div>
            </div>
          </section>

          {/* Vision Pro Gestures */}
          <section className="help-section">
            <h2 className="help-section-title">👆 Vision Pro Gestures</h2>
            <div className="help-items">
              <div className="help-item">
                <strong>Gaze + Pinch</strong>
                <span>Select an item</span>
              </div>
              <div className="help-item">
                <strong>Pinch + Drag</strong>
                <span>Move items around the board</span>
              </div>
              <div className="help-item">
                <strong>Two-finger Pinch</strong>
                <span>Rotate item (on rotation handle)</span>
              </div>
              <div className="help-item">
                <strong>Pinch + Pull</strong>
                <span>Scale item (on scale handle)</span>
              </div>
              <div className="help-item">
                <strong>Tap</strong>
                <span>Click buttons and toolbar actions</span>
              </div>
              <div className="help-item">
                <strong>Long Press</strong>
                <span>Right-click context menu</span>
              </div>
            </div>
          </section>

          {/* Desktop Controls */}
          <section className="help-section">
            <h2 className="help-section-title">🖱️ Desktop Controls</h2>
            <div className="help-items">
              <div className="help-item">
                <strong>Click</strong>
                <span>Select item</span>
              </div>
              <div className="help-item">
                <strong>Drag</strong>
                <span>Move item</span>
              </div>
              <div className="help-item">
                <strong>Right-click</strong>
                <span>Open context menu</span>
              </div>
              <div className="help-item">
                <strong>Drag & Drop</strong>
                <span>Add images to board</span>
              </div>
              <div className="help-item">
                <strong>Paste (Cmd+V)</strong>
                <span>Paste images or text</span>
              </div>
            </div>
          </section>

          {/* Toolbar Actions */}
          <section className="help-section">
            <h2 className="help-section-title">🛠️ Toolbar Actions</h2>
            <div className="help-items">
              <div className="help-item">
                <span className="help-icon">T</span>
                <span>Add text chip</span>
              </div>
              <div className="help-item">
                <span className="help-icon">◼</span>
                <span>Add room</span>
              </div>
              <div className="help-item">
                <span className="help-icon">↑</span>
                <span>Bring to front</span>
              </div>
              <div className="help-item">
                <span className="help-icon">⊞</span>
                <span>Align to grid</span>
              </div>
              <div className="help-item">
                <span className="help-icon">☰</span>
                <span>Open layers panel</span>
              </div>
              <div className="help-item">
                <span className="help-icon">⚙</span>
                <span>Open controls panel</span>
              </div>
              <div className="help-item">
                <span className="help-icon">🎨</span>
                <span>Open color palette</span>
              </div>
              <div className="help-item">
                <span className="help-icon">▶</span>
                <span>Start presentation mode</span>
              </div>
            </div>
          </section>

          {/* Depth Layers */}
          <section className="help-section">
            <h2 className="help-section-title">📏 Depth Layers</h2>
            <div className="help-items">
              <div className="help-item">
                <strong>0pt</strong>
                <span>Closest layer (foreground)</span>
              </div>
              <div className="help-item">
                <strong>24pt</strong>
                <span>Mid-close layer</span>
              </div>
              <div className="help-item">
                <strong>48pt</strong>
                <span>Mid-far layer</span>
              </div>
              <div className="help-item">
                <strong>80pt</strong>
                <span>Farthest layer (background)</span>
              </div>
              <div className="help-item">
                <strong>+6pt Focus</strong>
                <span>Selected items lift forward</span>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section className="help-section">
            <h2 className="help-section-title">💡 Tips</h2>
            <div className="help-tips">
              <p>• Arrange windows in 3D space for your ideal workspace layout</p>
              <p>• Use tags to organize items for presentation mode</p>
              <p>• Search layers by text content or tags</p>
              <p>• Export your board as JSON to save or share</p>
              <p>• Windows stay synchronized - changes in one update all</p>
              <p>• Use depth to create visual hierarchy in your moodboard</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
