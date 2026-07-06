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

// Auto-seed ontology data on startup, then load into memory.
// seedOntology() must complete BEFORE loadOntology() so the cache is fresh.
(async () => {
  try {
    await seedOntology();
    await loadOntology();
  } catch (err) {
    logger.error({ err }, "Ontology seed/load failed");
  }
})();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
