# Architecture

## Product boundary

Repo Atlas is a self-hosted, local-first workspace for understanding a portfolio of software repositories. It produces recommendations; it never moves, archives, edits, or deletes a repository automatically.

## MVP

1. Import metadata for repositories owned by one GitHub account.
2. Explore a card catalog, filters, repository details, and health signals.
3. Store user-owned classifications separately from GitHub metadata.
4. Maintain reversible reorganization scenarios with a **current** and a **proposed** map.
5. Export a reviewable consolidation report and an optional AI-review prompt.

The initial UI uses static demo data so it is safe to publish and evaluate without a token. It already demonstrates custom tags, built-in decisions, target monorepos, history strategy, scenario visualization, and a local-only AI prompt export.

## Workspace decisions

GitHub metadata is immutable input. Workspace data is owned by the user and includes:

- custom tags and notes;
- a decision: `keep`, `merge`, or `archive`;
- the target monorepo for a `merge` decision;
- Git history strategy: preserve full history or create a squashed import.

A scenario changes only this workspace data. It never changes a GitHub repository. Future migration manifests will record the source branch, source commit SHA, target path, chosen history strategy, and verification steps before a user runs any Git command.

## Optional AI review

Repo Atlas does not require an LLM and does not send workspace data to one. It can generate a copyable review prompt based on the current scenario. The exporter must exclude tokens, credential-bearing URLs, `.env` contents, and source files unless the user deliberately adds them.

## Planned layers

| Layer | Responsibility |
| --- | --- |
| UI | Catalog, graph, filters, reports, and human review. |
| Import adapters | Read-only GitHub API first; GitLab and local Git later. |
| Workspace store | Cached metadata and user-maintained classifications. |
| Analysis engine | Deterministic health checks and explainable recommendations. |
| Export | Markdown, JSON, and eventually a shareable report. |

## Security model

Private repository data stays in the deployment where the token is configured. A future GitHub token must be fine-grained, read-only, and scoped to the selected account/repositories. Tokens are never included in exported data or client bundles.
