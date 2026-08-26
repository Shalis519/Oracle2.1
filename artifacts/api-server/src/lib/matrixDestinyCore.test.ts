import { describe, expect, it } from "vitest";
import {
  buildFullMatrixNumbers,
  reduceMatrixArcana,
} from "./matrixDestinyCore";

describe("full destiny matrix core", () => {
  it("repeats the documented primary-source example 01.05.1969", () => {
    const result = buildFullMatrixNumbers({ year: 1969, month: 5, day: 1 });
    expect(result).not.toBeNull();

    expect(result?.points.day.value).toBe(1);
    expect(result?.points.month.value).toBe(5);
    expect(result?.points.year.value).toBe(7);
    expect(result?.points.foundation.value).toBe(13);
    expect(result?.points.center.value).toBe(8);

    expect(result?.points.directTopLeft.value).toBe(12);
    expect(result?.points.directTopRight.value).toBe(6);
    expect(result?.points.directBottomRight.value).toBe(14);
    expect(result?.points.directBottomLeft.value).toBe(20);

    expect(result?.points.heaven.value).toBe(18);
    expect(result?.points.earth.value).toBe(8);
    expect(result?.points.personalPurpose.value).toBe(8);
    expect(result?.points.fatherLine.value).toBe(8);
    expect(result?.points.motherLine.value).toBe(8);
    expect(result?.points.socialPurpose.value).toBe(16);
    expect(result?.points.spiritualPurpose.value).toBe(6);
    expect(result?.points.planetaryPurpose.value).toBe(22);
  });

  it("calculates the full wheel for 05.02.1980", () => {
    const result = buildFullMatrixNumbers({ year: 1980, month: 2, day: 5 });
    expect(result).not.toBeNull();

    expect(result?.points.foundation.value).toBe(7);
    expect(result?.points.center.value).toBe(5);
    expect(result?.points.heaven.value).toBe(9);
    expect(result?.points.earth.value).toBe(5);
    expect(result?.points.personalPurpose.value).toBe(14);
    expect(result?.points.fatherLine.value).toBe(14);
    expect(result?.points.motherLine.value).toBe(5);
    expect(result?.points.socialPurpose.value).toBe(19);
    expect(result?.points.spiritualPurpose.value).toBe(6);
    expect(result?.points.planetaryPurpose.value).toBe(7);
  });

  it("matches the independently visible full result for 13.08.1991", () => {
    const result = buildFullMatrixNumbers({ year: 1991, month: 8, day: 13 });
    expect(result).not.toBeNull();

    expect(result?.points.center.value).toBe(10);
    expect(result?.points.heaven.value).toBe(13);
    expect(result?.points.earth.value).toBe(6);
    expect(result?.points.personalPurpose.value).toBe(19);
    expect(result?.points.fatherLine.value).toBe(10);
    expect(result?.points.motherLine.value).toBe(10);
    expect(result?.points.socialPurpose.value).toBe(20);
    expect(result?.points.spiritualPurpose.value).toBe(12);
    expect(result?.points.planetaryPurpose.value).toBe(5);
  });

  it("matches the independently visible full result for 01.01.2000", () => {
    const result = buildFullMatrixNumbers({ year: 2000, month: 1, day: 1 });
    expect(result).not.toBeNull();

    expect(result?.points.center.value).toBe(8);
    expect(result?.points.personalPurpose.value).toBe(8);
    expect(result?.points.socialPurpose.value).toBe(16);
    expect(result?.points.spiritualPurpose.value).toBe(6);
    expect(result?.points.planetaryPurpose.value).toBe(22);
  });

  it("repeatedly reduces values above 22 and maps zero to 22", () => {
    expect(reduceMatrixArcana(41)).toBe(5);
    expect(reduceMatrixArcana(46)).toBe(10);
    expect(reduceMatrixArcana(0)).toBe(22);
  });

  it("rejects impossible civil dates", () => {
    expect(buildFullMatrixNumbers({ year: 2001, month: 2, day: 29 })).toBeNull();
    expect(buildFullMatrixNumbers({ year: 2000, month: 2, day: 29 })).not.toBeNull();
  });
});
