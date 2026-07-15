# Repo Atlas — product requirements and delivery plan

**Status:** living product document  
**Last updated:** 2026-07-14  
**Product type:** open-source, local-first, self-hosted repository portfolio workspace

## 1. Product purpose

Repo Atlas helps a developer or a small team understand and reorganize a portfolio of software repositories. It makes the current portfolio visible, lets the user classify repositories in their own terms, produces explainable consolidation suggestions, and previews a proposed future repository structure.

Repo Atlas is a planning tool. It must not move, archive, edit, or delete GitHub repositories automatically.

## 2. Principles

1. **Local-first and private by default.** Private repository metadata and credentials remain in the user’s deployment.
2. **Human decisions override heuristics.** Analysis proposes; the user accepts, changes, or rejects.
3. **Explainable recommendations.** Every recommendation must show its supporting and conflicting factors.
4. **Reversible planning.** A scenario changes workspace metadata only, never a Git provider.
5. **Git history is explicit.** Each proposed import records whether it preserves complete history or creates a squashed import.
6. **No required LLM.** The core product works deterministically. AI review is an optional, export-only convenience.

## 3. Users and distribution

### Primary users

- developers with many personal, learning, client, and experimental repositories;
- maintainers deciding whether projects should remain separate or move into monorepos;
- small teams that need an inventory before a repository reorganization.

### Public distribution

- source code under the MIT license on GitHub;
- Docker image published to GitHub Container Registry;
- Docker Compose as the primary self-hosted installation path;
- public demo with synthetic data only;
- no private repository data, tokens, `.env` values, or source code in the demo.

### Owner selection

Atlas imports and displays one configured repository owner at a time. The self-hosted operator may configure a small allow-list of owners. Switching owner replaces the displayed portfolio; it never merges multiple people’s repositories into one map by default.

## 4. Core data model

### Repository metadata

Imported from GitHub, GitLab, or a local Git folder: name, URL, visibility, language, topics, dates, default branch, size, README/license/CI presence, release and dependency signals.

### User-owned workspace metadata

Stored separately from imported provider metadata:

```yaml
repository: owner/example-project
tags: [minecraft, steamcraft, important]
status: active
decision: merge               # keep | merge | archive
target_monorepo: minecraft-addons
history_strategy: full        # full | squash
note: "Shared server ecosystem"
```

### Built-in classifications

- lifecycle: `active`, `maintenance`, `complete`, `archived`;
- decision: `keep`, `merge`, `archive`;
- signals: `stale`, `needs-readme`, `needs-ci`, `large-files`;
- context: `portfolio`, `learning`, `client`, `fork`;
- migration: `monorepo-candidate` plus a required target monorepo.

### Custom tags

Users can create, remove, filter, and colour their own tags. Tags are not limited to a predefined taxonomy.

## 5. Target monorepos

A target monorepo is a first-class planning entity, not merely a string tag. It has a name, description, optional existing remote URL, and default history strategy.

```text
minecraft-addons
├── mods/minemessage-forge-1.20.1
└── mods/tg-bridge-forge-1.20.1
```

A repository can have at most one accepted target in a scenario. Atlas must surface conflicts rather than silently assigning multiple targets.

## 6. Recommendation engine

The engine is deterministic and explainable. It combines weighted evidence; the user can configure weights and hard exclusions later.

| Evidence | Supports a merge | Opposes a merge |
| --- | --- | --- |
| Domain and tags | Same subject, ecosystem, or user tags | Different audiences and purposes |
| Stack | Same language, platform, and build tooling | Incompatible runtimes or toolchains |
| Operations | Shared deployment, releases, docs, and server | Independent domains, databases, secrets, or SLAs |
| Code relationships | Shared dependencies, links, and workflow conventions | No meaningful interaction |
| Lifecycle | Small related or inactive modules | Independent roadmap and active releases |
| Explicit user intent | Matching target/allowed tags | `keep-separate`, `client`, `fork`, or user exclusion |

Hard exclusions always win over a numeric score. The UI must expose the evidence and confidence, never only a final label.

## 7. Current and proposed maps

### Current map

Displays imported repositories as they exist now: domains, activity, health, tags, and provider metadata.

### Proposed map

Displays the result of the active scenario:

- projects accepted for migration appear below their target monorepo;
- independent projects remain standalone;
- archive decisions remain visible and preserve original history/URLs;
- the view is a simulation and cannot mutate provider state.

### Compare view — planned

An overlay/diff between current and proposed maps: created targets, moved projects, unchanged projects, archives, and unresolved conflicts.

## 8. History, migration, and rollback safety

Atlas does not execute migrations in the MVP. It prepares a reviewable plan.

For every accepted move, a future `manifest.json` must record:

- source repository URL, branch, and commit SHA;
- target monorepo and destination path;
- history strategy (`full` or `squash`);
- planned command set;
- pre- and post-migration verification status;
- original repository archival decision.

Recommended strategies:

- **Full history:** `git subtree add` without `--squash`; use for active code where commit history matters.
- **Squash import:** `git subtree add --squash`; use for old, learning, or small archived projects while keeping the original repository accessible.

Rollback must be generated from the manifest and exact source state, not improvised by an LLM.

## 9. Optional AI review prompt

Atlas may generate a copyable prompt containing a proposed scenario for external review. It does not call an LLM itself.

The exporter must exclude by default:

- tokens and passwords;
- credential-bearing URLs;
- `.env` contents;
- private source files and commit contents;
- private collaborators/issues unless the user deliberately adds them.

Prompt templates: structural review, migration-plan review, and rollback-plan explanation. The output is advisory; deterministic manifests remain authoritative.

## 10. Delivery plan

| Stage | Deliverable | Status |
| --- | --- | --- |
| 0 | Product boundary, privacy model, architecture notes | Done |
| 1 | Public React/Vite demo shell and Docker build | Done |
| 2 | Catalog, filters, repository profile, health signals | Done with synthetic data |
| 3 | Custom tags and built-in decisions | Done in browser state |
| 4 | Target monorepos, history strategy, proposed-map simulation | Done in browser state |
| 5 | Copyable local AI-review prompt | Done |
| 6 | Versioned local browser workspace store for tags and decisions | Done |
| 7 | Read-only GitHub importer for one account | Implemented; live-token verification pending |
| 8 | Explainable scoring, rules editor, and recommendation evidence | Implemented for built-in target profiles |
| 9 | Current/proposed compare map and conflict detection | Implemented for active scenario |
| 10 | Markdown/JSON report and migration manifest export | Planned |
| 10a | Structured container logging for startup, runtime, imports, and errors | Implemented |
| 11 | GitLab and local Git adapters | Planned |
| 12 | GitHub App authentication and team features | Future |
| 13 | Separate UI/UX acceptance checks and browser interaction regression tests | Planned |
| 14 | User-selectable visual themes | Future |
| 15 | Russian and English UI localisation with a language switcher (AI-review prompt remains intentionally untranslated) | Future |
| 16 | Adaptive-layout review for narrow and touch screens | Future |

## 11. Current implementation notes

The current public demo intentionally uses synthetic data. Tags, decisions, targets, and history strategies are stored locally in the browser using the versioned `repo-atlas.workspace.v1` schema. They never leave the browser and can be reset to the demo workspace. Generated prompts still live only in memory and reset after a page refresh.

The next implementation milestone is a fine-grained read-only GitHub importer.

Repository descriptions are imported from GitHub and technology classification combines the GitHub Languages endpoint with recognised technology topics. Deeper dependency and manifest analysis is a later enhancement.

The first recommendation engine is deterministic. It scores matching domain, recognised tags, technology stack, repository size, and lifecycle against built-in target-monorepo profiles. Tags such as `client`, `fork`, and `keep-separate` are hard stop-factors. The user can change the merge-confidence threshold and must explicitly adopt a recommendation before the scenario changes.

## 12. Definition of done for the first usable release

1. A user can import one GitHub account using a fine-grained read-only token.
2. Imported data is cached locally and never embedded in the static public demo.
3. The user can persist custom tags, notes, decisions, target monorepos, and history strategies.
4. The user can compare current and proposed maps and resolve migration conflicts.
5. Atlas exports a Markdown plan and `manifest.json` with no secrets.
6. Every generated recommendation is explainable and user-editable.
