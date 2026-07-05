import {
  pgTable,
  text,
  serial,
  integer,
  real,
  timestamp,
  uniqueIndex,
  jsonb,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ontologyEntitiesTable = pgTable("ontology_entities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  system: text("system").notNull(),
  type: text("type").notNull(),
  symbol: text("symbol"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ontologyThemesTable = pgTable("ontology_themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ontologyEntityThemesTable = pgTable(
  "ontology_entity_themes",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id")
      .notNull()
      .references(() => ontologyEntitiesTable.id, { onDelete: "cascade" }),
    themeId: integer("theme_id")
      .notNull()
      .references(() => ontologyThemesTable.id, { onDelete: "cascade" }),
    weight: real("weight").notNull().default(1.0),
    polarity: text("polarity").notNull().default("neutral"),
  },
  (table) => [
    uniqueIndex("entity_theme_unique").on(table.entityId, table.themeId),
    check(
      "check_theme_weight",
      sql`${table.weight} >= 0.0 AND ${table.weight} <= 3.0`,
    ),
  ],
);

export const ontologyEntityProfilesTable = pgTable(
  "ontology_entity_profiles",
  {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id")
      .notNull()
      .unique()
      .references(() => ontologyEntitiesTable.id, { onDelete: "cascade" }),
    keyMeanings: text("key_meanings"),
    psychologicalManifestations: text("psychological_manifestations"),
    emotions: text("emotions"),
    strengths: text("strengths"),
    weaknesses: text("weaknesses"),
    recommendations: text("recommendations"),
    warnings: text("warnings"),
    lifeThemes: jsonb("life_themes").$type<string[]>().notNull().default([]),
    keyMeaningsArr: jsonb("key_meanings_arr").$type<string[]>().notNull().default([]),
    positiveQualities: jsonb("positive_qualities").$type<string[]>().notNull().default([]),
    shadowQualities: jsonb("shadow_qualities").$type<string[]>().notNull().default([]),
    positiveEmotions: jsonb("positive_emotions").$type<string[]>().notNull().default([]),
    negativeEmotions: jsonb("negative_emotions").$type<string[]>().notNull().default([]),
    strengthsArr: jsonb("strengths_arr").$type<string[]>().notNull().default([]),
    weaknessesArr: jsonb("weaknesses_arr").$type<string[]>().notNull().default([]),
    archetypes: jsonb("archetypes").$type<string[]>().notNull().default([]),
    professions: jsonb("professions").$type<string[]>().notNull().default([]),
    objects: jsonb("objects").$type<string[]>().notNull().default([]),
    colors: jsonb("colors").$type<string[]>().notNull().default([]),
    numbers: jsonb("numbers").$type<string[]>().notNull().default([]),
    days: jsonb("days").$type<string[]>().notNull().default([]),
    animals: jsonb("animals").$type<string[]>().notNull().default([]),
    places: jsonb("places").$type<string[]>().notNull().default([]),
    materials: jsonb("materials").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const ontologyEntityRelationsTable = pgTable(
  "ontology_entity_relations",
  {
    id: serial("id").primaryKey(),
    fromEntityId: integer("from_entity_id")
      .notNull()
      .references(() => ontologyEntitiesTable.id, { onDelete: "cascade" }),
    toEntityId: integer("to_entity_id")
      .notNull()
      .references(() => ontologyEntitiesTable.id, { onDelete: "cascade" }),
    relationType: text("relation_type").notNull(),
    description: text("description"),
    weight: real("weight").notNull().default(1.0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("entity_relation_unique").on(
      table.fromEntityId,
      table.toEntityId,
      table.relationType,
    ),
    check(
      "check_relation_weight",
      sql`${table.weight} >= 0.0 AND ${table.weight} <= 3.0`,
    ),
  ],
);

export const insertOntologyEntitySchema = createInsertSchema(
  ontologyEntitiesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertOntologyThemeSchema = createInsertSchema(
  ontologyThemesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertOntologyEntityThemeSchema = createInsertSchema(
  ontologyEntityThemesTable,
).omit({ id: true });
export const insertOntologyEntityProfileSchema = createInsertSchema(
  ontologyEntityProfilesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOntologyEntity = z.infer<typeof insertOntologyEntitySchema>;
export type OntologyEntity = typeof ontologyEntitiesTable.$inferSelect;
export type InsertOntologyTheme = z.infer<typeof insertOntologyThemeSchema>;
export type OntologyTheme = typeof ontologyThemesTable.$inferSelect;
export type InsertOntologyEntityTheme = z.infer<
  typeof insertOntologyEntityThemeSchema
>;
export type OntologyEntityTheme =
  typeof ontologyEntityThemesTable.$inferSelect;
export type InsertOntologyEntityProfile = z.infer<
  typeof insertOntologyEntityProfileSchema
>;
export type OntologyEntityProfile =
  typeof ontologyEntityProfilesTable.$inferSelect;
