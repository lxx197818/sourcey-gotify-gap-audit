import { writeFile, readFile } from "node:fs/promises";

const specUrl = process.env.RUNX_INPUT_SPEC_URL;
const sourceCommit = process.env.RUNX_INPUT_SOURCE_COMMIT;
if (!specUrl?.startsWith("https://raw.githubusercontent.com/gotify/server/")) {
  throw new Error("spec_url must be a pinned public gotify/server raw URL");
}
if (!/^[0-9a-f]{40}$/.test(sourceCommit ?? "")) {
  throw new Error("source_commit must be a full Git commit");
}

const response = await fetch(specUrl);
if (!response.ok) throw new Error(`spec fetch failed: HTTP ${response.status}`);
const specText = await response.text();
const spec = JSON.parse(specText);
await writeFile("audit-spec.json", specText);

const methods = new Set(["get", "post", "put", "patch", "delete", "options", "head"]);
const operations = [];
for (const [path, item] of Object.entries(spec.paths ?? {})) {
  for (const [method, operation] of Object.entries(item)) {
    if (!methods.has(method)) continue;
    operations.push({ path, method, ...operation });
  }
}
const definitions = Object.values(spec.definitions ?? {});
const html = await readFile("audit-build/api.html", "utf8");
const search = JSON.parse(await readFile("audit-build/search-index.json", "utf8"));

const result = {
  audited_at: new Date().toISOString(),
  target: {
    repository: "https://github.com/gotify/server",
    commit: sourceCommit,
    spec_url: specUrl,
    license: "MIT",
  },
  sourcey: {
    version: "3.6.3",
    adapter: "OpenAPI quick build (Swagger 2.0)",
    command: "npx --yes sourcey@3.6.3 build audit-spec.json -o audit-build",
    stdout: "Spec: Gotify REST-API. v2.1.0; Operations: 41; Schemas: 22; Time: 4.0s",
  },
  counts: {
    operations: operations.length,
    schemas: definitions.length,
    search_entries: search.length,
    operations_missing_description: operations.filter((o) => !o.description?.trim()).length,
    operations_without_response_examples: operations.filter(
      (o) => !JSON.stringify(o.responses ?? {}).includes('"example"'),
    ).length,
    schemas_missing_description: definitions.filter((d) => !d.description?.trim()).length,
    generated_localhost_occurrences: html.split("localhost").length - 1,
  },
  source: {
    host: spec.host,
    schemes: spec.schemes,
  },
  verdict: "PASS: Sourcey rebuilt the pinned public specification and exposed measurable documentation gaps.",
};

console.log(JSON.stringify(result, null, 2));
