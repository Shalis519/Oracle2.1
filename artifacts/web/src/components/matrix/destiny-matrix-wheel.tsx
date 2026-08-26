import { useId } from "react";
import type { KeyboardEvent } from "react";

export type DestinyMatrixPoint = {
  position: string;
  arcanaNumber: number;
  arcanaName: string;
  essence: string;
};

type WheelNode = {
  point: DestinyMatrixPoint;
  key: string;
  shortLabel: string;
  x: number;
  y: number;
  accent: "gold" | "blue" | "violet" | "coral";
};

type DestinyMatrixWheelProps = {
  points: DestinyMatrixPoint[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const OUTER_NODE_LAYOUT = [
  {
    key: "year",
    shortLabel: "Духовный вектор",
    x: 360,
    y: 92,
    accent: "violet",
  },
  {
    key: "sky",
    shortLabel: "Социальная линия",
    x: 525,
    y: 164,
    accent: "blue",
  },
  { key: "earth", shortLabel: "Земная линия", x: 610, y: 360, accent: "coral" },
  { key: "heart", shortLabel: "Отношения", x: 525, y: 556, accent: "coral" },
  {
    key: "karma",
    shortLabel: "Кармический урок",
    x: 360,
    y: 628,
    accent: "violet",
  },
  { key: "talent", shortLabel: "Таланты", x: 195, y: 556, accent: "gold" },
  { key: "day", shortLabel: "Личность", x: 110, y: 360, accent: "blue" },
  { key: "month", shortLabel: "Линия рода", x: 195, y: 164, accent: "gold" },
] as const;

const POINT_INDEX_BY_KEY: Record<string, number> = {
  day: 0,
  month: 1,
  year: 2,
  talent: 3,
  heart: 4,
  karma: 5,
  purpose: 6,
  sky: 7,
  earth: 8,
};

function nodeClass(accent: WheelNode["accent"]): string {
  return {
    gold: "fill-[#d9b75b] stroke-[#fff3c5]",
    blue: "fill-[#5278d6] stroke-[#cddcff]",
    violet: "fill-[#9a5ab8] stroke-[#f0cdfc]",
    coral: "fill-[#d66d62] stroke-[#ffd2cc]",
  }[accent];
}

function labelPlacement(node: WheelNode): {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
} {
  if (node.key === "day" || node.key === "earth") {
    return { x: node.x, y: node.y + 58, anchor: "middle" };
  }
  if (node.y < 200) return { x: node.x, y: node.y - 54, anchor: "middle" };
  if (node.y > 520) return { x: node.x, y: node.y + 58, anchor: "middle" };
  if (node.x < 200) return { x: node.x - 52, y: node.y + 5, anchor: "end" };
  return { x: node.x + 52, y: node.y + 5, anchor: "start" };
}

export function DestinyMatrixWheel({
  points,
  selectedIndex,
  onSelect,
}: DestinyMatrixWheelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const pointByIndex = new Map(points.map((point, index) => [index, point]));
  const corePoint = pointByIndex.get(POINT_INDEX_BY_KEY.purpose);

  if (!corePoint || points.length < 9) return null;

  const nodes: WheelNode[] = OUTER_NODE_LAYOUT.flatMap((layout) => {
    const point = pointByIndex.get(POINT_INDEX_BY_KEY[layout.key]);
    return point ? [{ ...layout, point }] : [];
  });

  const activateNode = (index: number) => onSelect(index);
  const onNodeKeyDown = (event: KeyboardEvent<SVGGElement>, index: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateNode(index);
    }
  };

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-primary/30 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.22),transparent_40%),linear-gradient(145deg,hsl(var(--card)/0.96),hsl(var(--background)/0.82))] p-3 shadow-[0_24px_90px_hsl(var(--primary)/0.16)] sm:p-5"
      aria-labelledby="matrix-wheel-heading"
    >
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(hsl(var(--primary)/0.24)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative mb-3 flex items-start justify-between gap-4 px-2 pt-1 sm:mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
            Персональная схема
          </p>
          <h2
            id="matrix-wheel-heading"
            className="mt-1 font-serif text-xl font-semibold sm:text-2xl"
          >
            Круг Вашей матрицы
          </h2>
        </div>
        <div className="hidden rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-muted-foreground sm:block">
          Нажмите на точку
        </div>
      </div>

      <svg
        className="relative z-10 mx-auto block h-auto w-[80%] max-w-[610px]"
        viewBox="0 0 720 720"
        role="group"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>Круговая матрица судьбы</title>
        <desc id={descriptionId}>
          Девять точек персональной матрицы, рассчитанных по дате рождения.
          Каждая точка открывает её расшифровку.
        </desc>
        <defs>
          <linearGradient id="matrixOrbit" x1="0" y1="0" x2="1" y2="1">
            <stop
              offset="0%"
              stopColor="hsl(var(--primary))"
              stopOpacity="0.62"
            />
            <stop offset="100%" stopColor="#d9b75b" stopOpacity="0.36" />
          </linearGradient>
          <radialGradient id="matrixCore" cx="50%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#fff1b7" />
            <stop offset="55%" stopColor="#d9b75b" />
            <stop offset="100%" stopColor="#9e7529" />
          </radialGradient>
          <filter id="matrixGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="360"
          cy="360"
          r="305"
          fill="none"
          stroke="url(#matrixOrbit)"
          strokeWidth="2"
        />
        <circle
          cx="360"
          cy="360"
          r="248"
          fill="hsl(var(--background) / 0.24)"
          stroke="hsl(var(--primary) / 0.28)"
          strokeWidth="1.5"
          strokeDasharray="4 8"
        />
        <circle
          cx="360"
          cy="360"
          r="175"
          fill="none"
          stroke="hsl(var(--primary) / 0.22)"
          strokeWidth="1.5"
        />

        <path
          d="M360 92 L525 164 L610 360 L525 556 L360 628 L195 556 L110 360 L195 164 Z"
          fill="hsl(var(--primary) / 0.04)"
          stroke="hsl(var(--primary) / 0.6)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M360 92 L360 628 M110 360 L610 360 M195 164 L525 556 M525 164 L195 556"
          stroke="hsl(var(--primary) / 0.34)"
          strokeWidth="1.5"
        />
        <path
          d="M195 164 L610 360 L195 556 M525 164 L110 360 L525 556"
          fill="none"
          stroke="#d9b75b"
          strokeOpacity="0.32"
          strokeWidth="1.25"
        />

        <g
          transform="translate(360 360)"
          role="button"
          tabIndex={0}
          aria-label={`Предназначение: ${corePoint.arcanaNumber}, ${corePoint.arcanaName}`}
          onClick={() => activateNode(POINT_INDEX_BY_KEY.purpose)}
          onKeyDown={(event) =>
            onNodeKeyDown(event, POINT_INDEX_BY_KEY.purpose)
          }
          className="cursor-pointer outline-none"
        >
          <circle
            r="78"
            fill="#d9b75b"
            fillOpacity="0.14"
            filter="url(#matrixGlow)"
          />
          <circle
            r="54"
            fill="url(#matrixCore)"
            stroke="#fff4ce"
            strokeWidth={selectedIndex === POINT_INDEX_BY_KEY.purpose ? 5 : 3}
          />
          <text
            y="8"
            textAnchor="middle"
            fill="#422d0c"
            fontSize="38"
            fontWeight="700"
            className="font-serif"
          >
            {corePoint.arcanaNumber}
          </text>
          <text
            y="78"
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            fontSize="14"
            fontWeight="700"
          >
            Предназначение
          </text>
          <text
            y="98"
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize="12"
          >
            {corePoint.arcanaName}
          </text>
        </g>

        {nodes.map((node) => {
          const pointIndex = POINT_INDEX_BY_KEY[node.key];
          const isSelected = pointIndex === selectedIndex;
          const label = labelPlacement(node);
          return (
            <g
              key={node.key}
              role="button"
              tabIndex={0}
              aria-label={`${node.shortLabel}: ${node.point.arcanaNumber}, ${node.point.arcanaName}`}
              onClick={() => activateNode(pointIndex)}
              onKeyDown={(event) => onNodeKeyDown(event, pointIndex)}
              className="cursor-pointer outline-none"
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? 43 : 37}
                fill="hsl(var(--background) / 0.76)"
                stroke={isSelected ? "#fff4ce" : "hsl(var(--primary) / 0.42)"}
                strokeWidth={isSelected ? 3.5 : 1.5}
                className="transition-all duration-200"
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={isSelected ? 34 : 29}
                strokeWidth="2"
                className={`${nodeClass(node.accent)} transition-all duration-200`}
              />
              <text
                x={node.x}
                y={node.y + 7}
                textAnchor="middle"
                fill="white"
                fontSize={isSelected ? 22 : 19}
                fontWeight="700"
              >
                {node.point.arcanaNumber}
              </text>
              <text
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                fill={
                  isSelected
                    ? "hsl(var(--foreground))"
                    : "hsl(var(--muted-foreground))"
                }
                fontSize="12"
                fontWeight="700"
              >
                {node.shortLabel}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="relative z-10 mt-1 px-2 text-center text-xs leading-relaxed text-muted-foreground sm:hidden">
        Коснитесь цветной точки, чтобы прочитать её значение ниже.
      </p>
    </section>
  );
}
