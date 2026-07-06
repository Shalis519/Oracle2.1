import app from "./app";
import { logger } from "./lib/logger";
import { seedOntology } from "./lib/seedOntology";

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

/** Start server after seeding skeleton. Cache is lazy-loaded on first request. */
async function start(): Promise<void> {
  try {
    await seedOntology();
    logger.info("Ontology seeded -- Studio UI is the source of truth for relations & profiles");
  } catch (err) {
    logger.error({ err }, "Ontology seed failed -- aborting startup");
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
