# Repo Atlas

A local-first workspace for cataloging, analyzing, and organizing software repositories.

Repo Atlas helps you understand the shape of a repository portfolio: what is active, what is neglected, what belongs together, and what should remain independent. It produces reviewable recommendations; it never performs destructive GitHub actions.

## Current MVP

- interactive repository catalog with search, filters, sorting, bulk actions, saved views, and editable custom tags;
- built-in decisions: **keep**, **move to a chosen monorepo**, or **archive**;
- current and proposed portfolio maps with drag-and-drop, accessible move controls, and undo/redo;
- editable target groups, named scenarios, and versioned workspace import/export;
- one built-in Archive monorepo that competes in recommendations while preserving the explicit archive decision;
- explicit Git-history strategy for every planned move;
- optional copyable AI-review prompt — no LLM integration or data transfer;
- read-only GitHub, GitLab, and explicitly mounted local Git importers;
- deterministic migration manifest and Markdown-plan export;
- four structural visual themes, responsive/touch UI, and English/Russian localisation;
- progressive-disclosure controls and an in-app three-step quick guide;
- optional Basic access protection for self-hosted instances;
- Docker-ready public demo data with no personal or private repository content.

## Run locally

```bash
npm install
npm run dev
```

To build the production bundle:

```bash
npm run build
```

Run fast unit/acceptance tests with `npm test`, or the browser regression suite with `npm run test:e2e` (after `npx playwright install chromium`).

## Container

```bash
docker build -t repo-atlas .
docker run --rm -p 8080:8080 repo-atlas
```

Then open `http://localhost:8080`.

### Importing GitHub repositories

The importer is available only from the self-hosted server. Create a fine-grained GitHub token with **Metadata: Read-only** and **Contents: Read-only**, restrict it to the repositories you want to inspect, then run:

```bash
docker run --rm -p 8080:8080 \
  -e GITHUB_TOKEN=github_pat_your_read_only_token \
  repo-atlas
```

The token stays on the server and is never sent to the browser bundle, saved in the workspace, or included in AI-review prompts. Repo Atlas can apply optional Basic access protection; remote deployments must additionally terminate HTTPS at a trusted reverse proxy.

For the complete token and Docker Compose setup, see [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md).

## Roadmap

Completed stages and future work are tracked in [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md). The next larger milestone is optional GitHub App authentication and team features.

Read [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries, planned layers, and the security model.
