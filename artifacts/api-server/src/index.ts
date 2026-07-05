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

// Auto-seed ontology data on startup if tables are empty
seedOntology().catch((err) => {
  logger.error({ err }, "Ontology seed failed");
});

// Load ontology into memory for semantic forecasts
loadOntology().catch((err) => {
  logger.warn({ err }, "Ontology load failed — semantic forecasts will show missing data");
});

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
