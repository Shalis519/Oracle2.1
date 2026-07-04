import {
  db,
  ontologyEntitiesTable,
  ontologyThemesTable,
  ontologyEntityThemesTable,
  ontologyEntityProfilesTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding ontology...");

  // Темы
  const themes = await db
    .insert(ontologyThemesTable)
    .values([
      { name: "Любовь", slug: "love", description: "Отношения, романтика, брак, гармония" },
      { name: "Карьера", slug: "career", description: "Работа, профессия, амбиции, деловая энергия" },
      { name: "Здоровье", slug: "health", description: "Тело, энергии, иммунитет, исцеление" },
    ])
    .onConflictDoNothing({ target: ontologyThemesTable.slug })
    .returning();

  const themeMap = new Map(themes.map((t) => [t.slug, t]));

  // Сущности
  const entities = await db
    .insert(ontologyEntitiesTable)
    .values([
      { name: "Венера", code: "venus", system: "astrology", type: "planet", symbol: "♀" },
      { name: "Марс", code: "mars", system: "astrology", type: "planet", symbol: "♂" },
      { name: "生门", code: "sheng_men", system: "qimen", type: "door", symbol: null },
    ])
    .onConflictDoNothing({ target: ontologyEntitiesTable.code })
    .returning();

  const entityMap = new Map(entities.map((e) => [e.code, e]));

  // Профили
  await db
    .insert(ontologyEntityProfilesTable)
    .values([
      {
        entityId: entityMap.get("venus")!.id,
        keyMeanings: "Любовь, гармония, эстетика, ценности, доверие",
        psychologicalManifestations: "Стремление к гармонии, мягкость, дипломатичность, отклик от конфликта",
        emotions: "Нежность, радость, удовлетворенность, любовь, тоска",
        strengths: "Умеет объединять, создавать красоту, дарить покой, вдохновлять",
        weaknesses: "Зависимость от одобрения, поверхностность, избегание конфликта любой ценой",
        recommendations: "Практикуйте искусство, ухаживайте за внешностью и обстановкой, не ищите постоянной хвалы",
        warnings: "Опасно подаваться иллюзиям, слишком платить за счёт покоя других",
      },
      {
        entityId: entityMap.get("mars")!.id,
        keyMeanings: "Действие, агрессия, смелость, движение, победа",
        psychologicalManifestations: "Прямота, решимость, нетерпение к поражениям, импульсивность, острая реакция",
        emotions: "Гнев, воодушевление, победная эйфория, ревность, страсть",
        strengths: "Проводник, инициатор, защитник, спортсмен, добиватель",
        weaknesses: "Непоследовательность, склонность к агрессии, поспешность, трамва",
        recommendations: "Спорт, физическая активность, поставить цели и двигаться к ним, обучиться реагировать адекватно",
        warnings: "Остерегайте опасности повреждений, конфликтов с авторитетами, не раскалывайте страсти в бездействие",
      },
      {
        entityId: entityMap.get("sheng_men")!.id,
        keyMeanings: "Жизнь, возрождение, рост, надежда, благополучие",
        psychologicalManifestations: "Живость, оптимизм, притяжение нового, исцеление, терпение",
        emotions: "Надежда, облегчение, благодарность, радость от жизни",
        strengths: "Восстанавливает, обновляет, привлекает благо, даёт энергию для новых начинаний",
        weaknesses: "Может быть слишком пассивным, останавливаться в удобстве, игнорировать препятствия",
        recommendations: "Начинайте новые проекты, заботьтесь о здоровье, проводите время на природе",
        warnings: "Не просто ждите удачи, растите плохое зерно, оно взойдет боком",
      },
    ])
    .onConflictDoNothing({ target: ontologyEntityProfilesTable.entityId })
    .returning();

  // Связи сущностей с темами
  await db
    .insert(ontologyEntityThemesTable)
    .values([
      {
        entityId: entityMap.get("venus")!.id,
        themeId: themeMap.get("love")!.id,
        weight: 1.0,
        polarity: "positive",
      },
      {
        entityId: entityMap.get("mars")!.id,
        themeId: themeMap.get("career")!.id,
        weight: 0.9,
        polarity: "positive",
      },
      {
        entityId: entityMap.get("sheng_men")!.id,
        themeId: themeMap.get("health")!.id,
        weight: 1.0,
        polarity: "positive",
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log("Seeded:", entities.length, "entities,", themes.length, "themes");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
