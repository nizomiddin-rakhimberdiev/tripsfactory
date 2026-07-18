export type MapStop = { name: string; lat: number; lng: number };

const W = 900;
const H = 540;
const PAD = 90;

function project(stops: MapStop[]) {
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = Math.max(maxLat - minLat, 0.02);
  const lngRange = Math.max(maxLng - minLng, 0.02);
  const scale = Math.min((W - 2 * PAD) / lngRange, (H - 2 * PAD) / latRange);
  const offX = (W - lngRange * scale) / 2;
  const offY = (H - latRange * scale) / 2;
  return stops.map((s) => ({
    ...s,
    x: offX + (s.lng - minLng) * scale,
    y: offY + (maxLat - s.lat) * scale,
  }));
}

/** Smooth Catmull-Rom curve through the points. */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2)
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function TourMap({
  stops,
  startLabel,
  endLabel,
}: {
  stops: MapStop[];
  startLabel: string;
  endLabel: string;
}) {
  const pts = project(stops);
  const path = smoothPath(pts);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Tur marshruti xaritasi"
      >
        <defs>
          <linearGradient id="tf-route" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
          <filter id="tf-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodColor="#000"
              floodOpacity="0.18"
            />
          </filter>
          <pattern
            id="tf-dots"
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.3" fill="var(--border)" />
          </pattern>
        </defs>

        <rect width={W} height={H} fill="url(#tf-dots)" opacity="0.6" />

        {/* route line */}
        <path
          d={path}
          fill="none"
          stroke="url(#tf-route)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1 14"
          opacity="0.35"
        />
        <path
          d={path}
          fill="none"
          stroke="url(#tf-route)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* stops — labels alternate above/below so neighbouring cities never collide */}
        {pts.map((p, i) => {
          const isFirst = i === 0;
          const isLast = i === pts.length - 1;
          const above = i % 2 === 0;
          const badge = isFirst ? startLabel : isLast ? endLabel : null;
          const ring = isLast ? "var(--accent)" : "var(--primary)";
          const nameY = above ? p.y - 30 : p.y + 40;
          const badgeY = above ? p.y - 50 : p.y + 58;
          return (
            <g key={`${p.name}-${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="19"
                fill="#fff"
                stroke={ring}
                strokeWidth="3"
                filter="url(#tf-shadow)"
              />
              <circle cx={p.x} cy={p.y} r="14" fill={ring} />
              <text
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="15"
                fontWeight="700"
                fill="#fff"
              >
                {i + 1}
              </text>
              <text
                x={p.x}
                y={nameY}
                textAnchor="middle"
                fontSize="19"
                fontWeight="700"
                fill="var(--foreground)"
              >
                {p.name}
              </text>
              {badge && (
                <text
                  x={p.x}
                  y={badgeY}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight="700"
                  letterSpacing="1.5"
                  fill={isFirst ? "var(--primary)" : "var(--accent)"}
                >
                  {badge.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
