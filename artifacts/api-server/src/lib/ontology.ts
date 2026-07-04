import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  ontologyEntitiesTable,
  ontologyEntityProfilesTable,
  ontologyEntityThemesTable,
  ontologyThemesTable,
  ontologyEntityRelationsTable,
} from "@workspace/db";

export interface EntityProfile {
  entityId: number;
  entityName: string;
  entityCode: string;
  entityType: string;
  entitySymbol: string | null;
  keyMeanings: string | null;
  psychologicalManifestations: string | null;
  emotions: string | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
  warnings: string | null;
  lifeThemes: string[] | null;
  keyMeaningsArr: string[] | null;
  positiveQualities: string[] | null;
  shadowQualities: string[] | null;
  positiveEmotions: string[] | null;
  negativeEmotions: string[] | null;
  strengthsArr: string[] | null;
  weaknessesArr: string[] | null;
  archetypes: string[] | null;
}

export async function fetchEntityProfiles(codes: string[]): Promise<Map<string, EntityProfile>> {
  if (codes.length === 0) return new Map();

  const entities = await db
    .select()
    .from(ontologyEntitiesTable)
    .where(inArray(ontologyEntitiesTable.code, codes));

  const entityIds = entities.map((e) => e.id);
  const profiles = entityIds.length > 0
    ? await db
        .select()
        .from(ontologyEntityProfilesTable)
        .where(inArray(ontologyEntityProfilesTable.entityId, entityIds))
    : [];

  const profileById = new Map(profiles.map((p) => [p.entityId, p]));

  const out = new Map<string, EntityProfile>();
  for (const e of entities) {
    const p = profileById.get(e.id);
    out.set(e.code, {
      entityId: e.id,
      entityName: e.name,
      entityCode: e.code,
      entityType: e.type,
      entitySymbol: e.symbol,
      keyMeanings: p?.keyMeanings ?? null,
      psychologicalManifestations: p?.psychologicalManifestations ?? null,
      emotions: p?.emotions ?? null,
      strengths: p?.strengths ?? null,
      weaknesses: p?.weaknesses ?? null,
      recommendations: p?.recommendations ?? null,
      warnings: p?.warnings ?? null,
      lifeThemes: (p?.lifeThemes as string[] | null) ?? null,
      keyMeaningsArr: (p?.keyMeaningsArr as string[] | null) ?? null,
      positiveQualities: (p?.positiveQualities as string[] | null) ?? null,
      shadowQualities: (p?.shadowQualities as string[] | null) ?? null,
      positiveEmotions: (p?.positiveEmotions as string[] | null) ?? null,
      negativeEmotions: (p?.negativeEmotions as string[] | null) ?? null,
      strengthsArr: (p?.strengthsArr as string[] | null) ?? null,
      weaknessesArr: (p?.weaknessesArr as string[] | null) ?? null,
      archetypes: (p?.archetypes as string[] | null) ?? null,
    });
  }
  return out;
}

export async function fetchRelatedEntities(
  entityCode: string,
  relationType?: string,
): Promise<Array<{ relation: string; weight: number; entityName: string; entityCode: string; entityType: string }>> {
  const [entity] = await db
    .select()
    .from(ontologyEntitiesTable)
    .where(eq(ontologyEntitiesTable.code, entityCode))
    .limit(1);

  if (!entity) return [];

  const rels = await db
    .select()
    .from(ontologyEntityRelationsTable)
    .where(
      and(
        eq(ontologyEntityRelationsTable.fromEntityId, entity.id),
        relationType ? eq(ontologyEntityRelationsTable.relationType, relationType) : undefined,
      ),
    );

  if (rels.length === 0) return [];

  const targetIds = rels.map((r) => r.toEntityId);
  const targets = await db
    .select()
    .from(ontologyEntitiesTable)
    .where(inArray(ontologyEntitiesTable.id, targetIds));

  const targetMap = new Map(targets.map((t) => [t.id, t]));

  return rels
    .map((r) => {
      const t = targetMap.get(r.toEntityId);
      if (!t) return null;
      return {
        relation: r.relationType,
        weight: r.weight,
        entityName: t.name,
        entityCode: t.code,
        entityType: t.type,
      };
    })
    .filter(Boolean) as any[];
}
