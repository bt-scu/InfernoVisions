import '../styles/key.css';

const FIREFIGHTERS = [                                                                              
  { id: 'ff1', label: 'FF1', color: '#06b6d4' },                                                  
  { id: 'ff2', label: 'FF2', color: '#eab308' },                                                    
  { id: 'ff3', label: 'FF3', color: '#6366f1' },                                                  
  { id: 'ff4', label: 'FF4', color: '#22c55e' },                                                    
  { id: 'ff5', label: 'FF5', color: '#e11d48' },                                                    
  { id: 'ff6', label: 'FF6', color: '#f97316' },                                                    
]; 

export function KeyScene() {
  return (
    <div className="firefighter-grid">
      {FIREFIGHTERS.map((ff) => (
        <div key={ff.id} className="firefighter-item">
          <div 
            className="firefighter-dot" 
            style={{ backgroundColor: ff.color }} 
          />
          <span className="firefighter-label">{ff.label}</span>
        </div>
      ))}
    </div>
  );
}