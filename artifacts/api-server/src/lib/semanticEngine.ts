import { logger } from "./logger";
import { db } from "@workspace/db";
import {
  ontologyEntitiesTable,
  ontologyThemesTable,
  ontologyEntityThemesTable,
  ontologyEntityProfilesTable,
  ontologyEntityRelationsTable,
} from "@workspace/db";

// Explicit DB row type (Drizzle $inferSelect doesn't always pick up .array()/.jsonb())
type DBEntityRelation = {
  id: number;
  fromEntityId: number;
  toEntityId: number;
  relationType: string;
  description: string | null;
  weight: number;
  futuristic: Record<string, unknown> | null;
  keywords: string[] | null;
  createdAt: Date;
  updatedAt: Date;
};

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

// Runtime type guard for relation rows
function toDbRelation(row: unknown): DBEntityRelation {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as number,
    fromEntityId: r.fromEntityId as number,
    toEntityId: r.toEntityId as number,
    relationType: r.relationType as string,
    description: r.description as string | null,
    weight: r.weight as number,
    futuristic: (r.futuristic as Record<string, unknown> | null) ?? null,
    keywords: (r.keywords as string[] | null) ?? null,
    createdAt: r.createdAt as Date,
    updatedAt: r.updatedAt as Date,
  };
}

let ontologyCache: Map<string, OntologyEntity> | null = null;
let lastLoadTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Load all ontology data into module-level cache. */
export async function loadOntology(): Promise<void> {
  try {
    const [entities, themes, entityThemes, profiles, rawRelations] = await Promise.all([
      db.select().from(ontologyEntitiesTable),
      db.select().from(ontologyThemesTable),
      db.select().from(ontologyEntityThemesTable),
      db.select().from(ontologyEntityProfilesTable),
      db.select().from(ontologyEntityRelationsTable),
    ]);

    const relations = (rawRelations as unknown[]).map(toDbRelation);

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
        });

      const entityRelations: EntityRelation[] = relations
        .filter((r) => r.fromEntityId === entity.id)
        .map((r) => {
          const target = entities.find((e) => e.id === r.toEntityId);
          return {
            toEntityId: r.toEntityId,
            toEntityName: target?.name ?? "unknown",
            type: r.relationType,
            description: r.description ?? null,
            weight: r.weight ?? 1.0,
            futuristic: r.futuristic ?? null,
            keywords: r.keywords ?? null,
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

    ontologyCache = entityMap;
    lastLoadTime = Date.now();
    logger.info(`ontology loaded: ${entities.length} entities`);
  } catch (error) {
    logger.error({ error }, "failed to load ontology");
    throw error;
  }
}

/** Get ontology entity by name (case-sensitive). */
export function getEntity(name: string): OntologyEntity | null {
  return ontologyCache?.get(name) ?? null;
}

/** Get entity themes sorted by weight desc. */
export function getEntityThemes(name: string): EntityTheme[] {
  const entity = getEntity(name);
  return (entity?.themes ?? []).sort((a, b) => b.weight - a.weight);
}

/** Get entity relations. */
export function getEntityRelations(name: string): EntityRelation[] {
  const entity = getEntity(name);
  return entity?.relations ?? [];
}

/** Find a relation from source to target by target name and relation type.
 *  Filters by aspect type (e.g. "тригон") so the correct description is used.
 */
export function findRelation(sourceName: string, toEntityName: string, relationType?: string): EntityRelation | null {
  const relations = getEntityRelations(sourceName);
  const candidates = relations.filter((r) => r.toEntityName === toEntityName);
  if (candidates.length === 0) return null;
  if (relationType) {
    const exact = candidates.find((r) => r.type === relationType);
    if (exact) return exact;
    // Fallback: fuzzy match ignoring case and common prefix/suffix differences
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
export function hasEntity(name: string): boolean {
  return getEntity(name) !== null;
}

/** Refresh the ontology cache. */
export async function refreshOntology(): Promise<void> {
  await loadOntology();
}

/** Ensure cache is fresh (lazy TTL check). */
export async function ensureOntologyLoaded(): Promise<void> {
  if (!ontologyCache || Date.now() - lastLoadTime > CACHE_TTL_MS) {
    await loadOntology();
  }
}
