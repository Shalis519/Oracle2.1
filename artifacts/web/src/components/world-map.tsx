import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldData from "world-atlas/countries-110m.json";
import countries from "i18n-iso-countries";
import ruLocale from "i18n-iso-countries/langs/ru.json";

countries.registerLocale(ruLocale as Parameters<typeof countries.registerLocale>[0]);

interface CountryFeature {
  id: string | number;
  properties: { name: string };
}

export type CountryStatus = "visited" | "wishlist";

interface WorldMapProps {
  statusByCode: Record<string, CountryStatus>;
  onSelect: (code: string, name: string) => void;
}

const WIDTH = 800;
const HEIGHT = 400;

export function WorldMap({ statusByCode, onSelect }: WorldMapProps) {
  const features = useMemo(() => {
    const topo = worldData as unknown as Parameters<typeof feature>[0];
    const obj = (topo as unknown as { objects: { countries: unknown } }).objects.countries;
    const fc = feature(topo, obj as Parameters<typeof feature>[1]) as unknown as {
      features: CountryFeature[];
    };
    return fc.features;
  }, []);

  const pathGen = useMemo(() => {
    const fc = { type: "FeatureCollection", features } as unknown as Parameters<
      ReturnType<typeof geoNaturalEarth1>["fitSize"]
    >[1];
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], fc);
    return geoPath(projection);
  }, [features]);

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto select-none">
      {features.map((f) => {
        const numeric = String(f.id).padStart(3, "0");
        const alpha2 = countries.numericToAlpha2(numeric) || "";
        const status = alpha2 ? statusByCode[alpha2] : undefined;
        const name = (alpha2 && countries.getName(alpha2, "ru")) || f.properties?.name || "";
        const d = pathGen(f as unknown as Parameters<typeof pathGen>[0]) || undefined;
        const fill =
          status === "visited"
            ? "hsl(var(--primary))"
            : status === "wishlist"
              ? "hsl(var(--accent))"
              : hovered === numeric
                ? "hsl(var(--muted-foreground) / 0.6)"
                : "hsl(var(--muted))";
        return (
          <path
            key={numeric}
            d={d}
            fill={fill}
            stroke="hsl(var(--background))"
            strokeWidth={0.5}
            className="cursor-pointer transition-colors duration-200"
            onMouseEnter={() => setHovered(numeric)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => alpha2 && onSelect(alpha2, name)}
          >
            <title>{name}</title>
          </path>
        );
      })}
    </svg>
  );
}
