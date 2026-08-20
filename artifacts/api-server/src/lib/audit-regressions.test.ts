import { describe, expect, it } from "vitest";
import { parseNatalChartInput } from "./birthInput";
import { MONEY_STUDIO_SEEDS } from "./moneyStudioSeeds";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildTransitOpening, toGenitiveThemes } from "./forecastLanguage";
import { splitMoneyCardText } from "./moneyTextFormatting";

const validBirth = {
  birthDate: "1980-02-05",
  birthTime: "16:01",
  birthLatitude: 42.9,
  birthLongitude: 71.4,
  birthTimezone: "Asia/Almaty",
};

describe("audit regressions", () => {
  it("accepts valid ISO birth data and rejects impossible dates", () => {
    expect(parseNatalChartInput(validBirth)).toMatchObject({
      year: 1980,
      month: 2,
      day: 5,
      hour: 16,
      minute: 1,
    });
    expect(
      parseNatalChartInput({ ...validBirth, birthDate: "1980-02-31" }),
    ).toBeNull();
    expect(
      parseNatalChartInput({ ...validBirth, birthTime: "24:00" }),
    ).toBeNull();
  });


  it("uses Pluto as the sole ruler of Scorpio in the money formula", () => {
    const moneyFormula = readFileSync(
      resolve(process.cwd(), "src/lib/moneyFormula.ts"),
      "utf8",
    );
    expect(moneyFormula).toContain('scorpio: ["pluto"]');
    expect(moneyFormula).not.toContain('scorpio: ["mars", "pluto"]');
    expect(moneyFormula).toContain('aquarius: ["uranus"]');
    expect(moneyFormula).not.toContain('aquarius: ["saturn", "uranus"]');
    expect(moneyFormula).toContain('pisces: ["neptune"]');
    expect(moneyFormula).not.toContain('pisces: ["jupiter", "neptune"]');
  });

  it("puts the base house card before ruler cards inside each money house", () => {
    const moneyFormula = readFileSync(
      resolve(process.cwd(), "src/lib/moneyFormula.ts"),
      "utf8",
    );
    expect(moneyFormula).toContain('if (row.context === "house") return 0;');
    expect(moneyFormula).toContain('if (row.context.startsWith("ruler-house-")) return 1;');
  });

  it("keeps money subsection labels ready for bold rendering", () => {
    const moneyFormula = readFileSync(
      resolve(process.cwd(), "src/lib/moneyFormula.ts"),
      "utf8",
    );
    expect(moneyFormula).toContain("return [`${row.title}:\\n");
    expect(moneyFormula).not.toContain("return [`${row.title}:\\n\\n");
  });

  it("groups ruler cards under their corresponding money house", () => {
    const moneyFormula = readFileSync(
      resolve(process.cwd(), "src/lib/moneyFormula.ts"),
      "utf8",
    );
    expect(moneyFormula).toContain("const sections = MONEY_HOUSES.flatMap((house)");
    expect(moneyFormula).toContain(".filter((row) => parentHouse(row) === house)");
    expect(moneyFormula).toContain("ROMAN_HOUSE[rulerMatch[1]]");
    expect(moneyFormula).toContain('textParagraphs.join("\\n")');
  });

  it("keeps the base descriptions for the II, V, and VIII money houses", () => {
    const houseSeeds = new Map(
      MONEY_STUDIO_SEEDS
        .filter((seed) => seed.context === "house")
        .map((seed) => [seed.key, seed.text]),
    );
    expect(houseSeeds.get("house:2")).toContain("Заработки и деньги");
    expect(houseSeeds.get("house:5")).toContain("дом радости планеты Венера");
    expect(houseSeeds.get("house:5")).toContain("удача, везение, подарки, выигрыши, лотереи");
    expect(houseSeeds.get("house:8")).toContain("Все кризисные ситуации");
  });

  it("keeps the imported long-term transit card library and exact-house priority", () => {
    const transitSeeds = readFileSync(
      resolve(process.cwd(), "src/lib/longTermTransitCardSeeds.ts"),
      "utf8",
    );
    const literary = readFileSync(
      resolve(process.cwd(), "src/lib/longTermTransitLiterary.ts"),
      "utf8",
    );
    const runtimeSchema = readFileSync(
      resolve(process.cwd(), "src/lib/runtimeSchema.ts"),
      "utf8",
    );
    expect((transitSeeds.match(/sourceNote: "Авторская база для карточек\.docx"/g) ?? [])).toHaveLength(21);
    expect(literary).toContain('context === "major_aspect_exact"');
    expect(literary).toContain("const row = usable(exactRow) ? exactRow : usable(genericRow) ? genericRow : undefined;");
    expect(runtimeSchema).toContain("await ensureLongTermTransitCardSeeds();");
  });

  it("keeps the complete Money Houses Studio library", () => {
    expect(MONEY_STUDIO_SEEDS).toHaveLength(84);
    expect(
      new Set(MONEY_STUDIO_SEEDS.map((seed) => `${seed.category}:${seed.context}:${seed.key}`)).size,
    ).toBe(84);
    expect(MONEY_STUDIO_SEEDS.every((seed) => seed.sourceNote.includes("ДЕНЬГИВНАТАЛЬНОЙКАРТЕ"))).toBe(true);
  });

  it("keeps planet and aspect declension grammatically correct", () => {
    expect(buildTransitOpening({
      transitBody: "Солнце",
      transitSign: "Лев",
      aspect: "Оппозиция",
      natalBody: "Меркурий",
      natalSign: "Водолей",
      transitHouse: 2,
      natalHouse: 8,
    })).toBe("Транзитное Солнце, проходя по Вашему 2-му дому, образует оппозицию с натальным Меркурием в 8-м доме.");
    expect(buildTransitOpening({
      transitBody: "Луна",
      transitSign: "Лев",
      aspect: "Квадрат",
      natalBody: "Солнце",
      natalSign: "Водолей",
      transitHouse: 5,
      natalHouse: 7,
    })).toBe("Транзитная Луна, проходя по Вашему 5-му дому, образует квадрат с натальным Солнцем в 7-м доме.");
    expect(buildTransitOpening({
      transitBody: "Марс",
      transitSign: "Рак",
      aspect: "Квадрат",
      natalBody: "Луна",
      natalSign: "Весы",
      transitHouse: 12,
      natalHouse: 4,
    })).toBe("Транзитный Марс, проходя по Вашему 12-му дому, образует квадрат с натальной Луной в 4-м доме.");
  });

  it("declines sign themes after the word `тем`", () => {
    expect(toGenitiveThemes("самовыражение, творчество и сила воли")).toBe("самовыражения, творчества и силы воли");
    expect(toGenitiveThemes("интуиция и эмоциональная безопасность")).toBe("интуиции и эмоциональной безопасности");
    expect(toGenitiveThemes("радость, успех и энергия")).toBe("радости, успеха и энергии");
  });

  it("removes the empty additional-associations section", () => {
    expect(splitMoneyCardText("Медицина: сердце. Дополнительно впиши свои ассоциации: ____________________")).toEqual([
      "Медицина: сердце.",
    ]);
  });

  it("splits money card sections into separate paragraphs", () => {
    const paragraphs = splitMoneyCardText("Профессии: преподаватель. Территория: около театров. Услуги: подарки. Медицина: сердце. Денежный период: июль-август.");
    expect(paragraphs).toEqual([
      "Профессии: преподаватель.",
      "Территория: около театров.",
      "Услуги: подарки.",
      "Медицина: сердце.",
      "Денежный период: июль-август.",
    ]);
  });

  it("keeps the daily Sun-opposition-Mercury Studio components seeded", () => {
    const runtimeSchema = readFileSync(
      resolve(process.cwd(), "src/lib/runtimeSchema.ts"),
      "utf8",
    );
    expect(runtimeSchema).toContain("('entity', 'transit', 'sun'");
    expect(runtimeSchema).toContain("('entity', 'natal', 'mercury'");
    expect(runtimeSchema).toContain("('aspect', 'opposition', 'default'");
    expect(runtimeSchema).toContain("('house', 'transit', '2'");
    expect(runtimeSchema).toContain("('house', 'transit', '8'");
    expect(runtimeSchema).toContain("('house', 'natal', '2'");
    expect(runtimeSchema).toContain("('house', 'natal', '8'");
    expect(runtimeSchema).toContain("'composition',\n      'opposition'");
  });

  it("keeps daily synthesis independent from long-term forecast templates", () => {
    const dailyGenerator = readFileSync(
      resolve(process.cwd(), "src/lib/futuristicGenerator.ts"),
      "utf8",
    );
    expect(dailyGenerator).not.toContain("forecastTextTemplatesTable");
    expect(dailyGenerator).not.toContain("ensureForecastTemplateSeeds");
    expect(dailyGenerator).toContain("findRelation");
    expect(dailyGenerator).toContain("getEntityThemes");
  });

  it("uses genitive theme forms in the main daily synthesis sentence", () => {
    const dailyGenerator = readFileSync(
      resolve(process.cwd(), "src/lib/futuristicGenerator.ts"),
      "utf8",
    );
    expect(dailyGenerator).toContain("toGenitiveThemes(formatList(profileListText(s.planetProfile), 3))");
    expect(dailyGenerator).toContain("делает особенно заметными темы ${planetThemes}.");
  });

  it("bumps the persisted daily forecast cache after semantic changes", () => {
    const forecastRoute = readFileSync(
      resolve(process.cwd(), "src/routes/forecast.ts"),
      "utf8",
    );
    expect(forecastRoute).toContain("CURRENT_FORECAST_VERSION = 62");
    expect(forecastRoute).toContain("serving stale prose");
  });

  it("self-heals the daily forecast version column before forecast requests", () => {
    const runtimeSchema = readFileSync(
      resolve(process.cwd(), "src/lib/runtimeSchema.ts"),
      "utf8",
    );
    expect(runtimeSchema).toContain("ALTER TABLE daily_forecasts");
    expect(runtimeSchema).toContain("ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1");
    expect(runtimeSchema).toContain("DELETE FROM daily_forecasts older");
    expect(runtimeSchema).toContain("CREATE UNIQUE INDEX IF NOT EXISTS daily_forecasts_user_date_unique");
  });
});
