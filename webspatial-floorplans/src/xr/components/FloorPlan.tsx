import { useBuildingFloor } from '../hooks/useBuildingFloor';
import { FLOOR_PLAN_WIDTH, FLOOR_PLAN_HEIGHT } from '../data/floorPlanRooms';
import type { RoomState } from '../hooks/useBuildingFloor';

const BUILDING_NAME = import.meta.env.VITE_BUILDING_NAME ?? 'Heafey';

const ROOM_COLORS: Record<RoomState, { fill: string; opacity: number }> = {
  default: { fill: '#ffffff', opacity: 0.35 },
  green:   { fill: '#22c55e', opacity: 0.5 },
  red:     { fill: '#ef4444', opacity: 0.5 },
};

export function FloorPlan() {
  const { rooms, roomStates, handleRoomClick, loading, error } = useBuildingFloor(BUILDING_NAME, 1);

  if (loading) {
    return <div className="floor-plan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Loading floor 1...</div>;
  }

  if (error) {
    return <div className="floor-plan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>Error: {error}</div>;
  }

  return (
    <div className="floor-plan">
      <svg
        viewBox={`0 0 ${FLOOR_PLAN_WIDTH} ${FLOOR_PLAN_HEIGHT}`}
        className="floor-plan-svg"
      >
        {rooms.map(room => {
          const state = roomStates[room.id] ?? 'default';
          const { fill, opacity } = ROOM_COLORS[state];
          return (
            <g key={room.id} onClick={() => handleRoomClick(room.id)} className="floor-plan-room">
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill={fill}
                fillOpacity={opacity}
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={1}
                rx={4}
                ry={4}
              />
              {state === 'default' && (
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="floor-plan-label"
                  fontSize={room.width < 60 || room.height < 50 ? 10 : 13}
                >
                  {room.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
