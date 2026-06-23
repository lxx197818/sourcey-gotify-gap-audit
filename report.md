# Sourcey 3.6.3 documentation-gap audit: Gotify REST API

## Scope and reproduction

- Target: `gotify/server`, pinned commit `8221c0b895fdd1b1b84c0d5784e9422eb314ecb5`
- License: MIT
- Input: `docs/spec.json`, a Swagger 2.0 document
- Sourcey adapter/config: OpenAPI quick-build mode, with no custom `sourcey.config.ts`
- Commands: `npx --yes sourcey@3.6.3 validate .\source\spec.json` and `npx --yes sourcey@3.6.3 build .\source\spec.json -o .\audit-build`
- Result: validation and generation succeeded for 41 operations and 22 schemas in 4.0 seconds.

## What worked well

- Sourcey preserved all 41 stable operation IDs, summaries, methods, paths, and tags, producing a complete endpoint navigation rather than anonymous entries.
- Sourcey rendered all 22 Swagger definitions as searchable models; the generated search index contains 63 entries split exactly into 41 endpoints and 22 models.
- Sourcey surfaced Gotify's API-key and basic-auth declarations together with operation-level security information, making authentication requirements visible without template work.
- The static output included `api.html`, client-side search, sitemap, Open Graph image, `llms.txt`, and `llms-full.txt`; the result is portable and does not require a documentation server.

## Concrete gaps and friction points

### 1. Copyable examples target `localhost` (target-source gap plus Sourcey safeguard gap)

The pinned Swagger source declares `host: localhost` and both HTTP and HTTPS schemes. Sourcey correctly preserves that input, but the generated `api.html` contains 289 `localhost` occurrences. A polished build can therefore be published with request examples that do not target a real Gotify deployment.

Target action: Gotify should publish a deploy-neutral server placeholder or document how downstream builds should replace the host.

Sourcey action: warn in quick-build mode when a common placeholder host becomes the effective base URL. Public issue: https://github.com/sourcey/sourcey/issues/252

### 2. Most operations lack explanatory descriptions (target-project gap)

Twenty-four of 41 operations have no `description`; they have only a short summary. The missing context is most visible for application/client mutation, image upload/removal, login, pagination, and destructive message operations.

Target action: add intent, authorization, side effects, pagination semantics, and failure behavior to the Swagger operation descriptions.

### 3. No response examples exist (target-project gap)

All 41 operations lack response examples in the committed specification. Sourcey can render schemas, but users cannot see representative success and error payloads or copy realistic values.

Target action: prioritize examples for authentication, token creation, message paging, uploads, streaming, and error responses.

### 4. One model lacks a top-level description and field prose is uneven (target-project gap)

One of the 22 definitions has no top-level description, while several models rely on names and types to carry meaning. Generated model pages are structurally correct but cannot explain lifecycle, ownership, or security implications that are absent upstream.

Target action: document model purpose and sensitive fields in the Swagger source.

### 5. Quick mode produces reference only, not a task-oriented onboarding path (configuration friction, not a Sourcey defect)

The quick-build command creates a strong API reference but no first-message walkthrough, authentication guide, deployment URL guidance, streaming guide, or pagination tutorial. Sourcey supports Markdown guides through a configured site, so this is not a missing renderer feature.

Operator action: move from quick mode to `sourcey.config.ts` and add short guides before presenting the output as end-user documentation.

### 6. Validation proves schema validity, not publish readiness (expected behavior, but easy operator trap)

`sourcey validate` correctly reports the Swagger document as valid. It does not flag that the host is a placeholder, that 24 descriptions are absent, or that every operation lacks examples. Those are quality/readiness concerns rather than schema errors.

Operator action: add a documentation-quality preflight alongside validation. Only the placeholder-host warning was filed upstream because it is a narrow Sourcey safeguard; the missing prose/examples belong in Gotify, and guide composition is already supported by configured Sourcey sites. Opening a second Sourcey issue would misclassify target-source gaps as generator defects.

## Recommended next steps

- Keep Sourcey's operation/model rendering and static search as the baseline; those parts were complete and useful.
- Fix the source-level host, description, model-prose, and example gaps in Gotify's Swagger generation path.
- Add a configured Sourcey site with authentication, first-message, pagination, streaming, and deployment guides.
- Add a publish-readiness check that records placeholder hosts, description coverage, example coverage, and search-index counts.
- Track Sourcey issue #252 for a non-fatal placeholder-host warning in quick mode.

