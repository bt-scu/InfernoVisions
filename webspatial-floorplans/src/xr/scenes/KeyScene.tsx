import '../styles/key.css';
import '../styles/xr.css';
import circleCheck from '../../assets/Circle_Check.svg';
import triangleWarning from '../../assets/Triangle_Warning.png';

const KEYS = [
  { id: 'k1', label: 'Clear', color: '#85E175', icon: circleCheck },
  { id: 'k2', label: 'Hazard', color: '#F96464', icon: triangleWarning }
]; 

export function KeyScene() {
  return (
    <div className="key-component">
    <div className="key-grid">
      {KEYS.map((key) => (
        <div key={key.id} className="key-item">
          <div
            className="key-dot"
            style={{ backgroundColor: key.color }}
          >
            <img src={key.icon} className="key-dot-icon" alt={key.label} />
          </div>
          <span className="key-label">{key.label}</span>
        </div>
      ))}
    </div>
    </div>
  );
}