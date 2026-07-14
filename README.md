# Repo Atlas

A local-first workspace for cataloging, analyzing, and organizing software repositories.

Repo Atlas helps you understand the shape of a repository portfolio: what is active, what is neglected, what belongs together, and what should remain independent. It produces reviewable recommendations; it never performs destructive GitHub actions.

## Current MVP

- interactive repository catalog with search, filters, and editable custom tags;
- built-in decisions: **keep**, **move to a chosen monorepo**, or **archive**;
- current and proposed portfolio maps, based on a reversible scenario;
- explicit Git-history strategy for every planned move;
- optional copyable AI-review prompt — no LLM integration or data transfer;
- Docker-ready static demo, containing no personal or private repository data.

## Run locally

```bash
npm install
npm run dev
```

To build the production bundle:

```bash
npm run build
```

## Container

```bash
docker build -t repo-atlas .
docker run --rm -p 8080:80 repo-atlas
```

Then open `http://localhost:8080`.

## Roadmap

1. GitHub read-only importer for a single account.
2. Persistent local workspace configuration for tags, status, relationships, and decisions.
3. GitHub importer and explainable thematic/health rules.
4. Consolidation-plan and migration-manifest export.
5. GitLab and local Git adapters.

Read [ARCHITECTURE.md](ARCHITECTURE.md) for boundaries, planned layers, and the security model.
