export type EclipseKind = "solar" | "lunar";

export interface EclipseEvent {
  date: string;
  dateUtc: string;
  kind: EclipseKind;
  type: string;
  source: "NASA Five Millennium Catalog";
}

export interface EclipseCorridor {
  startDate: string;
  endDate: string;
  events: EclipseEvent[];
}

// Dates and UTC maxima are transcribed from NASA's Five Millennium Catalogs.
// The range covers the current ten-year planning horizon, with 2036 included
// so that the horizon is not cut off during the current year.
const ECLIPSE_EVENT_ROWS: Array<[string, string, EclipseKind, string]> = [
  ["2026-02-17", "2026-02-17T12:13:06Z", "solar", "кольцеобразное"],
  ["2026-03-03", "2026-03-03T11:34:52Z", "lunar", "полное"],
  ["2026-08-12", "2026-08-12T17:47:06Z", "solar", "полное"],
  ["2026-08-28", "2026-08-28T04:14:04Z", "lunar", "частное"],
  ["2027-02-06", "2027-02-06T16:00:48Z", "solar", "кольцеобразное"],
  ["2027-02-20", "2027-02-20T23:14:06Z", "lunar", "полутеневое"],
  ["2027-07-18", "2027-07-18T16:04:09Z", "lunar", "полутеневое"],
  ["2027-08-02", "2027-08-02T10:07:50Z", "solar", "полное"],
  ["2027-08-17", "2027-08-17T07:14:59Z", "lunar", "полутеневое"],
  ["2028-01-12", "2028-01-12T04:14:13Z", "lunar", "частное"],
  ["2028-01-26", "2028-01-26T15:08:59Z", "solar", "кольцеобразное"],
  ["2028-07-06", "2028-07-06T18:20:57Z", "lunar", "частное"],
  ["2028-07-22", "2028-07-22T02:56:40Z", "solar", "полное"],
  ["2028-12-31", "2028-12-31T16:53:15Z", "lunar", "полное"],
  ["2029-01-14", "2029-01-14T17:13:48Z", "solar", "частное"],
  ["2029-06-12", "2029-06-12T04:06:13Z", "solar", "частное"],
  ["2029-06-26", "2029-06-26T03:23:22Z", "lunar", "полное"],
  ["2029-07-11", "2029-07-11T15:37:19Z", "solar", "частное"],
  ["2029-12-05", "2029-12-05T15:03:58Z", "solar", "частное"],
  ["2029-12-20", "2029-12-20T22:43:12Z", "lunar", "полное"],
  ["2030-06-01", "2030-06-01T06:29:13Z", "solar", "кольцеобразное"],
  ["2030-06-15", "2030-06-15T18:34:34Z", "lunar", "частное"],
  ["2030-11-25", "2030-11-25T06:51:37Z", "solar", "полное"],
  ["2030-12-09", "2030-12-09T22:28:51Z", "lunar", "полутеневое"],
  ["2031-05-07", "2031-05-07T03:52:02Z", "lunar", "полутеневое"],
  ["2031-05-21", "2031-05-21T07:16:04Z", "solar", "кольцеобразное"],
  ["2031-06-05", "2031-06-05T11:45:17Z", "lunar", "полутеневое"],
  ["2031-10-30", "2031-10-30T07:46:45Z", "lunar", "полутеневое"],
  ["2031-11-14", "2031-11-14T21:07:31Z", "solar", "гибридное"],
  ["2032-04-25", "2032-04-25T15:14:51Z", "lunar", "полное"],
  ["2032-05-09", "2032-05-09T13:26:42Z", "solar", "кольцеобразное"],
  ["2032-10-18", "2032-10-18T19:03:40Z", "lunar", "полное"],
  ["2032-11-03", "2032-11-03T05:34:13Z", "solar", "частное"],
  ["2033-03-30", "2033-03-30T18:02:36Z", "solar", "полное"],
  ["2033-04-14", "2033-04-14T19:13:51Z", "lunar", "полное"],
  ["2033-09-23", "2033-09-23T13:54:31Z", "solar", "частное"],
  ["2033-10-08", "2033-10-08T10:56:23Z", "lunar", "полное"],
  ["2034-03-20", "2034-03-20T10:18:45Z", "solar", "полное"],
  ["2034-04-03", "2034-04-03T19:06:59Z", "lunar", "полутеневое"],
  ["2034-09-12", "2034-09-12T16:19:28Z", "solar", "кольцеобразное"],
  ["2034-09-28", "2034-09-28T02:47:37Z", "lunar", "частное"],
  ["2035-02-22", "2035-02-22T09:06:12Z", "lunar", "полутеневое"],
  ["2035-03-09", "2035-03-09T23:05:54Z", "solar", "кольцеобразное"],
  ["2035-08-19", "2035-08-19T01:12:15Z", "lunar", "частное"],
  ["2035-09-02", "2035-09-02T01:56:46Z", "solar", "полное"],
  ["2036-02-11", "2036-02-11T22:13:06Z", "lunar", "полное"],
  ["2036-02-27", "2036-02-27T04:46:49Z", "solar", "частное"],
  ["2036-07-23", "2036-07-23T10:32:06Z", "solar", "частное"],
  ["2036-08-07", "2036-08-07T02:52:32Z", "lunar", "полное"],
  ["2036-08-21", "2036-08-21T17:25:45Z", "solar", "частное"],
];

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function dateDistance(left: string, right: string): number {
  const a = Date.parse(`${left}T12:00:00Z`);
  const b = Date.parse(`${right}T12:00:00Z`);
  return Math.round(Math.abs(a - b) / 86_400_000);
}

function buildCorridors(events: EclipseEvent[]): EclipseCorridor[] {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const corridors: EclipseCorridor[] = [];
  let group: EclipseEvent[] = [];

  const flush = () => {
    if (group.length === 0) return;
    corridors.push({
      startDate: shiftDate(group[0].date, -3),
      endDate: shiftDate(group[group.length - 1].date, 3),
      events: group,
    });
    group = [];
  };

  for (const event of sorted) {
    const previous = group[group.length - 1];
    if (previous && dateDistance(previous.date, event.date) > 31) flush();
    group.push(event);
  }
  flush();
  return corridors;
}

export const ECLIPSE_EVENTS: EclipseEvent[] = ECLIPSE_EVENT_ROWS.map(([date, dateUtc, kind, type]) => ({
  date,
  dateUtc,
  kind,
  type,
  source: "NASA Five Millennium Catalog",
}));
export const ECLIPSE_CORRIDORS = buildCorridors(ECLIPSE_EVENTS);

export function isEclipseCorridorDate(date: Date): boolean {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return ECLIPSE_CORRIDORS.some((corridor) => dateKey >= corridor.startDate && dateKey <= corridor.endDate);
}
