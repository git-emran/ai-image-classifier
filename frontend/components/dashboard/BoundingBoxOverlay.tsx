interface BoundingBoxOverlayProps {
  objects: BoundingBox[];
  imageSize?: { width: number; height: number };
}

const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({ objects }) => {
  if (!objects || objects.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {objects.map((obj, idx) => {
        const [xMin, yMin, xMax, yMax] = obj.box;
        const left = (xMin / 1000) * 100;
        const top = (yMin / 1000) * 100;
        const width = ((xMax - xMin) / 1000) * 100;
        const height = ((yMax - yMin) / 1000) * 100;

        return (
          <div
            key={idx}
            className="absolute border-2 border-green-400"
            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
          >
            <span className="absolute -top-6 left-0 bg-green-400 text-white text-xs px-2 py-1 rounded">
              {obj.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default BoundingBoxOverlay
