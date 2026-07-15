# UI quality checks

Repo Atlas keeps a small, dependency-free acceptance suite for product promises that should not silently regress.

Run it with:

```bash
npm run test:ui
```

It verifies that the UI keeps one owner visible at a time, exposes both safe exports, does not contain a client-side GitHub token variable, retains narrow-layout breakpoints, and keeps dynamic imported repository counts independent from localisation.

## Manual browser checklist

Before a release, verify these flows in a real browser at 1440 px, 1024 px, 680 px, and 375 px:

1. Import one owner and switch to another: the displayed map is replaced, not merged.
2. Add and remove a custom tag; refresh and confirm it persists locally.
3. Change a decision and target; inspect **Current**, **Proposed**, and **Compare** views.
4. Download both exports; confirm the manifest has no token and an incomplete import is marked `needs-source-metadata`.
5. Use keyboard tab navigation on filters, the repository detail panel, and export buttons.

Automated browser interaction tests will be added when the UI test runner is introduced; this checklist is intentionally separate from the application runtime.
