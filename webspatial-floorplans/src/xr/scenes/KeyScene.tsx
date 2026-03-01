import '../styles/key.css';
import '../styles/xr.css';

const KEYS = [                                                                              
  { id: 'k1', label: 'k1', color: '#85E175' },                                                  
  { id: 'k2', label: 'k2', color: '#F96464' }                                                 
]; 

export function KeyScene() {
  return (
    <div className="key-grid">
      {KEYS.map((key) => (
        <div key={key.id} className="key-item">
          <div 
            className="key-dot" 
            style={{ backgroundColor: key.color }} 
          />
          <span className="key-label">{key.label}</span>
        </div>
      ))}
    </div>
  );
}