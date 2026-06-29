import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Bundled offline world city database (GeoNames cities>=5000 population),
// sorted by population descending. Each row:
//   [displayName, asciiName, russianName, countryCode, lat, lng, timezone]
type Row = [string, string, string, string, number, number, string];

export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

let rows: Row[] = [];
try {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(path.join(dir, "cities.json"), "utf8");
  rows = JSON.parse(raw) as Row[];
} catch {
  rows = [];
}

function toCity(r: Row): City {
  return { name: r[0], country: r[3], lat: r[4], lng: r[5], timezone: r[6] };
}

export function searchCities(q: string, limit = 12): City[] {
  const norm = q.trim().toLowerCase();
  if (norm.length < 2) return [];
  const res: City[] = [];
  for (const r of rows) {
    const disp = r[0].toLowerCase();
    const ascii = r[1].toLowerCase();
    const ru = (r[2] || "").toLowerCase();
    if (
      disp.startsWith(norm) ||
      ascii.startsWith(norm) ||
      ru.startsWith(norm)
    ) {
      res.push(toCity(r));
      if (res.length >= limit) break;
    }
  }
  return res;
}
