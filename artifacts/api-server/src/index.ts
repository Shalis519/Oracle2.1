import app from "./app";
import { logger } from "./lib/logger";
import { seedOntology } from "./lib/seedOntology";
import { loadOntology } from "./lib/semanticEngine";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/** Start server only after ontology seed + load complete so requests never hit stale cache. */
async function start(): Promise<void> {
  try {
    await seedOntology();
    await loadOntology();

    // Sanity check: verify core data loaded
    const { getEntity } = await import("./lib/semanticEngine");
    const moon = getEntity("Луна");
    if (!moon || moon.themes.length === 0) {
      logger.error("Ontology sanity check failed: Moon has no themes; aborting startup");
      process.exit(1);
    }
    logger.info({ moonThemes: moon.themes.length }, "Ontology sanity check passed");
  } catch (err) {
    logger.error({ err }, "Ontology seed/load failed — aborting startup");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

start();
