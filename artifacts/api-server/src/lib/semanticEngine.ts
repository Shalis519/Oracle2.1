import { logger } from "./logger";
import { db } from "@workspace/db";
import {
  ontologyEntitiesTable,
  ontologyThemesTable,
  ontologyEntityThemesTable,
  ontologyEntityProfilesTable,
  ontologyEntityRelationsTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

export interface OntologyEntity {
  id: number;
  name: string;
  description: string | null;
  type: string | null;
  themes: EntityTheme[];
  relations: EntityRelation[];
  profile: EntityProfile | null;
}

export interface EntityTheme {
  themeId: number;
  themeName: string;
  weight: number;
  polarity: string;
  contextRules: Record<string, unknown> | null;
}

export interface EntityRelation {
  toEntityId: number;
  toEntityName: string;
  type: string;
  description: string | null;
  weight: number;
  futuristic: Record<string, unknown> | null;
  keywords: string[] | null;
}

export interface EntityProfile {
  entityId: number;
  keyMeanings: string | null;
  psychologicalManifestations: string | null;
  emotions: string | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
  warnings: string | null;
  lifeThemes: string[];
  keyMeaningsArr: string[];
  positiveQualities: string[];
  shadowQualities: string[];
  positiveEmotions: string[];
  negativeEmotions: string[];
  strengthsArr: string[];
  weaknessesArr: string[];
  archetypes: string[];
  professions: string[];
  objects: string[];
  colors: string[];
  numbers: string[];
  days: string[];
  animals: string[];
  places: string[];
  materials: string[];
}

/* ─── 30-second in-memory cache (explicitly invalidated by refreshOntology) ─── */

let cache: Map<string, OntologyEntity> | null = null;
let cacheExpiresAt = 0;
let rebuildPromise: Promise<Map<string, OntologyEntity>> | null = null;
const CACHE_TTL_MS = 30_000;

function isCacheValid(): boolean {
  return cache !== null && Date.now() < cacheExpiresAt;
}

function setCache(data: Map<string, OntologyEntity>): void {
  cache = data;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
}

function clearCache(): void {
  cache = null;
  cacheExpiresAt = 0;
}

async function buildEntityMap(): Promise<Map<string, OntologyEntity>> {
  const [entities, themes, entityThemes, profiles, rawRelations] = await Promise.all([
    db.select().from(ontologyEntitiesTable),
    db.select().from(ontologyThemesTable),
    db.select().from(ontologyEntityThemesTable),
    db.select().from(ontologyEntityProfilesTable),
    db.select().from(ontologyEntityRelationsTable),
  ]);

  const entityMap = new Map<string, OntologyEntity>();

  for (const entity of entities) {
    const entityProfile = profiles.find((p) => p.entityId === entity.id) ?? null;
    const entityThemesList: EntityTheme[] = entityThemes
      .filter((et) => et.entityId === entity.id)
      .map((et) => {
        const theme = themes.find((t) => t.id === et.themeId);
        return {
          themeId: et.themeId,
          themeName: theme?.name ?? "unknown",
          weight: et.weight ?? 1.0,
          polarity: et.polarity ?? "neutral",
          contextRules: null,
        };
      })
      .sort((a, b) => b.weight - a.weight);

    const entityRelations: EntityRelation[] = rawRelations
      .filter((r) => r.fromEntityId === entity.id)
      .map((r) => {
        const target = entities.find((e) => e.id === r.toEntityId);
        return {
          toEntityId: r.toEntityId,
          toEntityName: target?.name ?? "unknown",
          type: r.relationType,
          description: r.description ?? null,
          weight: r.weight ?? 1.0,
          futuristic: (r.futuristic as Record<string, unknown> | null) ?? null,
          keywords: (r.keywords as string[] | null) ?? null,
        };
      });

    const profileData: EntityProfile | null = entityProfile
      ? {
          entityId: entityProfile.entityId,
          keyMeanings: entityProfile.keyMeanings,
          psychologicalManifestations: entityProfile.psychologicalManifestations,
          emotions: entityProfile.emotions,
          strengths: entityProfile.strengths,
          weaknesses: entityProfile.weaknesses,
          recommendations: entityProfile.recommendations,
          warnings: entityProfile.warnings,
          lifeThemes: (entityProfile.lifeThemes as string[]) ?? [],
          keyMeaningsArr: (entityProfile.keyMeaningsArr as string[]) ?? [],
          positiveQualities: (entityProfile.positiveQualities as string[]) ?? [],
          shadowQualities: (entityProfile.shadowQualities as string[]) ?? [],
          positiveEmotions: (entityProfile.positiveEmotions as string[]) ?? [],
          negativeEmotions: (entityProfile.negativeEmotions as string[]) ?? [],
          strengthsArr: (entityProfile.strengthsArr as string[]) ?? [],
          weaknessesArr: (entityProfile.weaknessesArr as string[]) ?? [],
          archetypes: (entityProfile.archetypes as string[]) ?? [],
          professions: (entityProfile.professions as string[]) ?? [],
          objects: (entityProfile.objects as string[]) ?? [],
          colors: (entityProfile.colors as string[]) ?? [],
          numbers: (entityProfile.numbers as string[]) ?? [],
          days: (entityProfile.days as string[]) ?? [],
          animals: (entityProfile.animals as string[]) ?? [],
          places: (entityProfile.places as string[]) ?? [],
          materials: (entityProfile.materials as string[]) ?? [],
        }
      : null;

    entityMap.set(entity.name, {
      id: entity.id,
      name: entity.name,
      description: null,
      type: entity.type ?? null,
      themes: entityThemesList,
      relations: entityRelations,
      profile: profileData,
    });
  }

  return entityMap;
}

/* ─── Public API ─── */

/** Get ontology entity by name. Reads from 30-sec cache or rebuilds from DB. */
export async function getEntity(name: string): Promise<OntologyEntity | null> {
  try {
    if (!isCacheValid()) {
      const data = await buildEntityMap();
      setCache(data);
      logger.info({ count: data.size }, "ontology cache rebuilt");
    }
    return cache!.get(name) ?? null;
  } catch (error) {
    logger.error({ error, name }, "failed to fetch entity");
    throw error; // propagate so caller can distinguish DB failure vs missing data
  }
}

/** Get entity themes sorted by weight desc. */
export async function getEntityThemes(name: string): Promise<EntityTheme[]> {
  const entity = await getEntity(name);
  return entity?.themes ?? [];
}

/** Get entity relations. */
export async function getEntityRelations(name: string): Promise<EntityRelation[]> {
  const entity = await getEntity(name);
  return entity?.relations ?? [];
}

/** Find a relation from source to target by target name and relation type. */
export async function findRelation(
  sourceName: string,
  toEntityName: string,
  relationType?: string,
): Promise<EntityRelation | null> {
  const relations = await getEntityRelations(sourceName);
  const candidates = relations.filter((r) => r.toEntityName === toEntityName);
  if (candidates.length === 0) return null;
  if (relationType) {
    const exact = candidates.find((r) => r.type === relationType);
    if (exact) return exact;
    const fuzzy = candidates.find((r) => {
      const a = r.type.toLowerCase().replace(/aspect_/g, "").replace(/\s/g, "");
      const b = relationType.toLowerCase().replace(/aspect_/g, "").replace(/\s/g, "");
      return a === b;
    });
    if (fuzzy) return fuzzy;
  }
  return candidates[0] ?? null;
}

/** Check if entity exists. */
export async function hasEntity(name: string): Promise<boolean> {
  const entity = await getEntity(name);
  return entity !== null;
}

/** Explicitly invalidate the 30-second cache (called by Studio UI mutations). */
export async function refreshOntology(): Promise<void> {
  clearCache();
  logger.info("ontology cache invalidated");
}

/** Legacy no-op: cache is lazy-loaded. */
export async function ensureOntologyLoaded(): Promise<void> {
  // Cache is lazy-loaded by getEntity.
}

/** Legacy: used by index.ts startup. Rebuilds cache once. */
export async function loadOntology(): Promise<void> {
  const data = await buildEntityMap();
  setCache(data);
  logger.info({ count: data.size }, "ontology loaded");
}
