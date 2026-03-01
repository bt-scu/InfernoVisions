import { FloorPlan } from '../components/FloorPlan';
import '../styles/xr.css';

export function BoardScene() {
  return (
    <div className="board-scene-container">
      <h2 className="board-title">Floor 1</h2>
      <FloorPlan />
    </div>
  );
}
