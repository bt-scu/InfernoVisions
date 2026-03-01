import { FloorPlan } from '../components/FloorPlan';
import '../styles/xr.css';

export function Floor1Scene() {
  return (
    <div className="board-scene-container">
      <h2 className="board-title">FLOOR 1</h2>
      <FloorPlan />
    </div>
  );
}
