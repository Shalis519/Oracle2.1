import fs from "node:fs";

const route = fs.readFileSync("artifacts/api-server/src/routes/adminLongTermForecasts.ts", "utf8");
const literary = fs.readFileSync("artifacts/api-server/src/lib/longTermTransitLiterary.ts", "utf8");
const schema = fs.readFileSync("artifacts/api-server/src/lib/runtimeSchema.ts", "utf8");
const checks = [
  ["transit house is stored", route, /transitHouse:\s*typeof aspect\.transitHouse === "number"/],
  ["natal house is stored", route, /natalHouse:\s*typeof aspect\.natalHouse === "number"/],
  ["transit house is passed", route, /item\.transitHouse == null \? "" : String\(item\.transitHouse\)/],
  ["natal house is passed", route, /item\.natalHouse == null \? "" : String\(item\.natalHouse\)/],
  ["empty house arguments removed", route, !/renderLongTermTransit\([\s\S]{0,500}?item\.from,\s*item\.to,\s*"",\s*""\)/.test(route)],
  ["literary renderer resolves transit house themes", literary, /transitHouseThemes/],
  ["literary renderer resolves natal house themes", literary, /natalHouseThemes/],
  ["2nd and 8th house ontology exists", schema, /'house', 'transit', '2'/.test(schema) && /'house', 'natal', '8'/.test(schema)],
  ["long-term cards use house placeholders", schema, /sun:opposition:mercury'[\s\S]{0,800}?\{transitHouseThemes\}[\s\S]{0,200}?\{natalHouseThemes\}/],
];
const failed = checks.filter(([, source, pattern]) => pattern instanceof RegExp ? !pattern.test(source) : !pattern);
if (failed.length) {
  throw new Error(`House propagation checks failed: ${failed.map(([name]) => name).join(", ")}`);
}
console.log("House propagation checks passed:");
for (const [name] of checks) console.log(`- ${name}`);
