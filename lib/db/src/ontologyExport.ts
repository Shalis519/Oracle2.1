import { z } from "zod/v4";

/**
 * Zod schemas for ontology export/import format (Variant A).
 * Uses natural keys (code/slug/name) instead of numeric IDs.
 * No createdAt/updatedAt/id fields.
 */

export const exportEntitySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  system: z.string().min(1),
  type: z.string().min(1),
  symbol: z.string().nullable().optional(),
});

export const exportThemeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const exportEntityThemeSchema = z.object({
  entityCode: z.string().min(1),
  themeSlug: z.string().min(1),
  weight: z.number().min(0).max(3),
  polarity: z.enum(["positive", "negative", "neutral"]),
});

export const exportProfileSchema = z.object({
  entityCode: z.string().min(1),
  keyMeanings: z.string().nullable().optional(),
  psychologicalManifestations: z.string().nullable().optional(),
  emotions: z.string().nullable().optional(),
  strengths: z.string().nullable().optional(),
  weaknesses: z.string().nullable().optional(),
  recommendations: z.string().nullable().optional(),
  warnings: z.string().nullable().optional(),
  lifeThemes: z.array(z.string()).default([]),
  keyMeaningsArr: z.array(z.string()).default([]),
  positiveQualities: z.array(z.string()).default([]),
  shadowQualities: z.array(z.string()).default([]),
  positiveEmotions: z.array(z.string()).default([]),
  negativeEmotions: z.array(z.string()).default([]),
  strengthsArr: z.array(z.string()).default([]),
  weaknessesArr: z.array(z.string()).default([]),
  archetypes: z.array(z.string()).default([]),
  professions: z.array(z.string()).default([]),
  objects: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  numbers: z.array(z.string()).default([]),
  days: z.array(z.string()).default([]),
  animals: z.array(z.string()).default([]),
  places: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
});

export const exportRelationSchema = z.object({
  fromCode: z.string().min(1),
  toCode: z.string().min(1),
  relationType: z.string().min(1),
  description: z.string().nullable().optional(),
  weight: z.number().min(0).max(3),
  futuristic: z.record(z.string(), z.unknown()).nullable().optional(),
  keywords: z.array(z.string()).nullable().optional(),
});

export const exportMotivationPhraseSchema = z.object({
  phrase: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const exportLunarInterpretationSchema = z.object({
  category: z.enum(["house", "sign"]),
  key: z.string().min(1),
  title: z.string().min(1),
  text: z.string().default("В разработке"),
  sourceNote: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const exportCinderellaInterpretationSchema = z.object({
  pairKey: z.string().min(1),
  mode: z.enum(["natal", "transit", "synastry"]),
  aspectKey: z.string().min(1).default("any"),
  title: z.string().min(1),
  text: z.string().default("В разработке"),
  keywords: z.array(z.string()).default([]),
  sourceNote: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const ontologyExportSchema = z.object({
  version: z.union([z.literal("2.0"), z.literal("2.1")]),
  exportedAt: z.string().datetime(),
  entities: z.array(exportEntitySchema),
  themes: z.array(exportThemeSchema),
  entityThemes: z.array(exportEntityThemeSchema),
  profiles: z.array(exportProfileSchema),
  relations: z.array(exportRelationSchema),
  motivationPhrases: z.array(exportMotivationPhraseSchema),
  cinderellaInterpretations: z.array(exportCinderellaInterpretationSchema).default([]),
  lunarInterpretations: z.array(exportLunarInterpretationSchema).default([]),
});

export const ontologyImportSchema = z.object({
  mode: z.enum(["replace", "merge"]),
  data: ontologyExportSchema,
});

export type OntologyExport = z.infer<typeof ontologyExportSchema>;
export type OntologyImport = z.infer<typeof ontologyImportSchema>;
