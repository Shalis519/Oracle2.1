import { useId } from "react";
import type { KeyboardEvent } from "react";

export type DestinyMatrixPoint = {
  id: string;
  section: "diagonal" | "direct" | "line" | "purpose";
  position: string;
  arcanaNumber: number;
  arcanaName: string;
  essence: string;
  formula: string;
};

type WheelNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  accent: "base" | "direct" | "line" | "purpose";
  labelPlacement?: "top" | "bottom" | "left" | "right";
};

type DestinyMatrixWheelProps = {
  points: DestinyMatrixPoint[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const BASE_NODES: WheelNode[] = [
  { id: "month", label: "Главный талант", x: 360, y: 94, accent: "base", labelPlacement: "top" },
  { id: "day", label: "Визитная карточка", x: 626, y: 360, accent: "base", labelPlacement: "bottom" },
  { id: "foundation", label: "Кармический хвост", x: 360, y: 626, accent: "base", labelPlacement: "bottom" },
  { id: "year", label: "Задача души", x: 94, y: 360, accent: "base", labelPlacement: "top" },
];

const DIRECT_NODES: WheelNode[] = [
  { id: "directTopLeft", label: "Мать: духовное", x: 186, y: 186, accent: "direct", labelPlacement: "top" },
  { id: "directTopRight", label: "Отец: духовное", x: 534, y: 186, accent: "direct", labelPlacement: "top" },
  { id: "directBottomRight", label: "Мать: материальное", x: 534, y: 534, accent: "direct", labelPlacement: "bottom" },
  { id: "directBottomLeft", label: "Отец: материальное", x: 186, y: 534, accent: "direct", labelPlacement: "bottom" },
];

const LINE_NODES: WheelNode[] = [
  { id: "heaven", label: "Небо", x: 406, y: 235, accent: "line", labelPlacement: "right" },
  { id: "earth", label: "Земля", x: 235, y: 406, accent: "line", labelPlacement: "left" },
  { id: "fatherLine", label: "Род отца", x: 258, y: 312, accent: "line", labelPlacement: "left" },
  { id: "motherLine", label: "Род матери", x: 462, y: 408, accent: "line", labelPlacement: "right" },
];

const PURPOSE_IDS = [
  "personalPurpose",
  "socialPurpose",
  "spiritualPurpose",
  "planetaryPurpose",
] as const;

function accentStyle(accent: WheelNode["accent"]): { fill: string; stroke: string } {
  return {
    base: { fill: "#5278d6", stroke: "#cfdbff" },
    direct: { fill: "#d9b75b", stroke: "#fff3c5" },
    line: { fill: "#9a5ab8", stroke: "#f0cdfc" },
    purpose: { fill: "#d66d62", stroke: "#ffd2cc" },
  }[accent];
}

function labelPosition(node: WheelNode): {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
} {
  switch (node.labelPlacement) {
    case "top":
      return { x: node.x, y: node.y - 42, anchor: "middle" };
    case "bottom":
      return { x: node.x, y: node.y + 48, anchor: "middle" };
    case "left":
      return { x: node.x - 42, y: node.y + 4, anchor: "end" };
    case "right":
      return { x: node.x + 42, y: node.y + 4, anchor: "start" };
    default:
      return { x: node.x, y: node.y - 42, anchor: "middle" };
  }
}

function isPurposeId(id: string): id is (typeof PURPOSE_IDS)[number] {
  return PURPOSE_IDS.includes(id as (typeof PURPOSE_IDS)[number]);
}

export function DestinyMatrixWheel({
  points,
  selectedId,
  onSelect,
}: DestinyMatrixWheelProps) {
  const titleId = useId();
  const descriptionId = useId();
  const pointById = new Map(points.map((point) => [point.id, point]));
  const center = pointById.get("center");
  const purposes = PURPOSE_IDS.flatMap((id) => {
    const point = pointById.get(id);
    return point ? [point] : [];
  });

  if (!center || purposes.length !== PURPOSE_IDS.length) return null;

  const activateNode = (id: string) => onSelect(id);
  const onNodeKeyDown = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activateNode(id);
    }
  };

  const renderNode = (node: WheelNode, radius: number) => {
    const point = pointById.get(node.id);
    if (!point) return null;
    const isSelected = point.id === selectedId;
    const label = labelPosition(node);
    const style = accentStyle(node.accent);

    return (
      <g
        key={node.id}
        role="button"
        tabIndex={0}
        aria-label={`${point.position}: ${point.arcanaNumber}, ${point.arcanaName}`}
        onClick={() => activateNode(point.id)}
        onKeyDown={(event) => onNodeKeyDown(event, point.id)}
        className="cursor-pointer outline-none"
      >
        <circle
          cx={node.x}
          cy={node.y}
          r={radius + 8}
          fill="hsl(var(--background) / 0.82)"
          stroke={isSelected ? "#fff4ce" : "hsl(var(--primary) / 0.34)"}
          strokeWidth={isSelected ? 3 : 1.25}
        />
        <circle
          cx={node.x}
          cy={node.y}
          r={radius}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={isSelected ? 3 : 1.5}
        />
        <text
          x={node.x}
          y={node.y + 6}
          textAnchor="middle"
          fill="white"
          fontSize={radius > 28 ? 19 : 14}
          fontWeight="700"
        >
          {point.arcanaNumber}
        </text>
        <text
          x={label.x}
          y={label.y}
          textAnchor={label.anchor}
          fill={isSelected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))"}
          fontSize="11"
          fontWeight="700"
        >
          {node.label}
        </text>
      </g>
    );
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
            Полная схема
          </p>
          <h2 id="matrix-wheel-heading" className="mt-1 font-serif text-xl font-semibold sm:text-2xl">
            Круг Вашей матрицы
          </h2>
        </div>
        <div className="hidden rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-muted-foreground sm:block">
          Нажмите на точку
        </div>
      </div>

      <svg
        className="relative z-10 mx-auto block h-auto w-[86%] max-w-[510px] sm:w-[76%]"
        viewBox="0 0 720 720"
        role="group"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>Полное круговое колесо Матрицы Судьбы</title>
        <desc id={descriptionId}>
          Диагональный и прямой квадраты, центральная точка, линии Неба и Земли, а также родовые линии. Каждая точка открывает оригинальное пояснение и её формулу.
        </desc>
        <defs>
          <linearGradient id="matrixOrbit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.62" />
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

        <circle cx="360" cy="360" r="306" fill="none" stroke="url(#matrixOrbit)" strokeWidth="2" />
        <circle cx="360" cy="360" r="255" fill="hsl(var(--background) / 0.22)" stroke="hsl(var(--primary) / 0.25)" strokeWidth="1.5" strokeDasharray="4 8" />
        <circle cx="360" cy="360" r="178" fill="none" stroke="hsl(var(--primary) / 0.18)" strokeWidth="1.5" />

        <path d="M360 94 L626 360 L360 626 L94 360 Z" fill="hsl(var(--primary) / 0.04)" stroke="hsl(var(--primary) / 0.62)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M186 186 L534 186 L534 534 L186 534 Z" fill="hsl(var(--primary) / 0.025)" stroke="#d9b75b" strokeOpacity="0.58" strokeWidth="2.25" strokeLinejoin="round" />
        <path d="M360 94 L360 626 M94 360 L626 360" stroke="hsl(var(--primary) / 0.38)" strokeWidth="1.5" />
        <path d="M186 186 L534 534 M534 186 L186 534" stroke="#d9b75b" strokeOpacity="0.45" strokeWidth="1.5" />

        <g
          transform="translate(360 360)"
          role="button"
          tabIndex={0}
          aria-label={`${center.position}: ${center.arcanaNumber}, ${center.arcanaName}`}
          onClick={() => activateNode(center.id)}
          onKeyDown={(event) => onNodeKeyDown(event, center.id)}
          className="cursor-pointer outline-none"
        >
          <circle r="70" fill="#d9b75b" fillOpacity="0.13" filter="url(#matrixGlow)" />
          <circle r="48" fill="url(#matrixCore)" stroke="#fff4ce" strokeWidth={selectedId === center.id ? 5 : 3} />
          <text y="8" textAnchor="middle" fill="#422d0c" fontSize="34" fontWeight="700" className="font-serif">
            {center.arcanaNumber}
          </text>
          <text y="72" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="13" fontWeight="700">
            Зона комфорта
          </text>
          <text y="91" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11">
            {center.arcanaName}
          </text>
        </g>

        {BASE_NODES.map((node) => renderNode(node, 31))}
        {DIRECT_NODES.map((node) => renderNode(node, 26))}
        {LINE_NODES.map((node) => renderNode(node, 19))}
      </svg>

      <div className="relative z-10 mt-1 grid grid-cols-2 gap-2 px-1 sm:grid-cols-4 sm:px-2">
        {purposes.map((point) => {
          const isSelected = selectedId === point.id;
          return (
            <button
              key={point.id}
              type="button"
              onClick={() => onSelect(point.id)}
              className={`rounded-xl border px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? "border-[#d66d62]/80 bg-[#d66d62]/15"
                  : "border-primary/20 bg-background/35 hover:border-primary/50"
              }`}
              aria-pressed={isSelected}
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d66d62] text-xs text-white">
                  {point.arcanaNumber}
                </span>
                <span className="leading-tight">{point.position.replace(" предназначение", "")}</span>
              </span>
            </button>
          );
        })}
      </div>

    </section>
  );
}
