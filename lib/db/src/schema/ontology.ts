import {
  pgTable,
  text,
  serial,
  integer,
  real,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
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
