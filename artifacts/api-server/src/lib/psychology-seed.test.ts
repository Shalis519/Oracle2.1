import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values }));
  return { insert, values, onConflictDoNothing };
});

vi.mock("@workspace/db", () => ({
  db: { insert: mocks.insert },
  psychologyPracticesTable: { slug: "slug" },
}));

import { ensurePsychologyPractices } from "./seedPsychology";

type SeedPractice = {
  slug: string;
  safetyNote: string;
  steps: Array<{ id: string; instruction: string }>;
};

function seededPractices(): SeedPractice[] {
  const calls = mocks.values.mock.calls as unknown as Array<[SeedPractice[]]>;
  const practices = calls[0]?.[0];
  expect(practices).toBeDefined();
  return practices!;
}

describe("начальное наполнение раздела психологии", () => {
  beforeEach(() => {
    mocks.insert.mockClear();
    mocks.values.mockClear();
    mocks.onConflictDoNothing.mockClear();
  });

  it("создаёт все утверждённые практики без перезаписи правок администратора", async () => {
    await ensurePsychologyPractices();

    expect(mocks.insert).toHaveBeenCalledOnce();
    const practices = seededPractices();
    expect(practices).toHaveLength(11);
    expect(practices.map((practice) => practice.slug)).toEqual([
      "cognitive-rehearsal",
      "pause-before-response",
      "intention-anchor",
      "what-matters-now",
      "desire-without-negation",
      "one-delayed-step",
      "support-and-boundaries",
      "voice-in-important-conversation",
      "parts-before-financial-decision",
      "my-suitable-day",
      "small-experiment",
    ]);
    expect(mocks.onConflictDoNothing).toHaveBeenCalledWith({ target: "slug" });
  });

  it("включает защитные границы и не обещает особых свойств воды", async () => {
    await ensurePsychologyPractices();

    const practices = seededPractices();
    for (const practice of practices) {
      expect(practice.safetyNote).toContain("не заменяет помощь психолога");
    }

    const waterPractice = practices.find(
      (practice) => practice.slug === "intention-anchor",
    );
    expect(waterPractice).toBeDefined();
    const waterStep = waterPractice!.steps.find((step) => step.id === "water");
    expect(waterStep).toBeDefined();
    expect(waterStep!.instruction).toContain("не обладает особыми свойствами");

    const financialPractice = practices.find(
      (practice) => practice.slug === "parts-before-financial-decision",
    );
    expect(financialPractice).toBeDefined();
    expect(financialPractice!.safetyNote).toContain(
      "не финансовая консультация",
    );
  });
});
