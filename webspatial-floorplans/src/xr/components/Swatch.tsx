interface SwatchProps {
  color: string;
  onClick: (color: string) => void;
}

export function Swatch({ color, onClick }: SwatchProps) {
  const handleClick = () => {
    onClick(color);
  };

  return (
    <div
      className="palette-swatch"
      enable-xr
      style={{ background: color }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span className="palette-swatch-label">{color}</span>
    </div>
  );
}
