import type { NatalChartInput } from "./astrology";

type BirthData = {
  birthDate: string | null;
  birthTime: string | null;
  birthLatitude: number | null;
  birthLongitude: number | null;
  birthTimezone: string | null;
};

export function parseNatalChartInput(data: BirthData): NatalChartInput | null {
  if (
    !data.birthDate ||
    !data.birthTime ||
    data.birthLatitude == null ||
    data.birthLongitude == null ||
    !data.birthTimezone
  ) {
    return null;
  }

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.birthDate);
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(data.birthTime);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));

  if (
    !Number.isInteger(year) ||
    month < 1 || month > 12 ||
    day < 1 ||
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59 ||
    !Number.isFinite(data.birthLatitude) ||
    !Number.isFinite(data.birthLongitude) ||
    data.birthLatitude < -90 ||
    data.birthLatitude > 90 ||
    data.birthLongitude < -180 ||
    data.birthLongitude > 180
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    latitude: data.birthLatitude,
    longitude: data.birthLongitude,
    timezone: data.birthTimezone,
  };
}
