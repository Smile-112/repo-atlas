import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [application, views, styles, localization] = await Promise.all([
  readFile(new URL("../src/main.jsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/AtlasViews.jsx", import.meta.url), "utf8"),
  readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  readFile(new URL("../src/i18n.js", import.meta.url), "utf8")
]);

test("workspace keeps one owner visible and exposes safe export actions", () => {
  assert.match(application, /One selected owner is displayed at a time/);
  assert.match(application, /Download manifest/);
  assert.match(application, /Download Markdown/);
  assert.match(application, /Import local Git/);
  assert.match(application, /Import GitLab/);
  assert.match(application, /option value="claude"/);
  assert.match(application, /option value="elevenlabs"/);
  assert.match(application, /option value="ollama"/);
  assert.match(application, /option value="ru"/);
  assert.doesNotMatch(application, /VITE_GITHUB_TOKEN/);
});

test("narrow layouts collapse the three-column workspace without hiding controls", () => {
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /\.workspace \{ display: block; \}/);
  assert.match(styles, /\.review-panel \{ grid-template-columns: 1fr; \}/);
  assert.match(styles, /\.mode-switch/);
});

test("themes change workspace structure instead of only recoloring it", () => {
  assert.match(styles, /\[data-theme="claude"\] \.workspace \{ grid-template-columns: minmax\(0, 1fr\) 300px/);
  assert.match(styles, /\[data-theme="claude"\] \.repo-grid \{ grid-template-columns: 1fr/);
  assert.match(styles, /\[data-theme="elevenlabs"\] \.workspace \{ grid-template-columns: 250px 300px minmax\(0, 1fr\)/);
  assert.match(styles, /\[data-theme="elevenlabs"\] \.content \{ grid-column: 3/);
  assert.match(styles, /\[data-theme="ollama"\] \.workspace \{ display: block/);
  assert.match(styles, /\[data-theme="ollama"\] \.repo-grid \{ display: block/);
});

test("proposed map supports reversible drag and accessible move controls", () => {
  assert.match(views, /draggable="true"/);
  assert.match(views, /dataTransfer\.setData\("text\/repository-id"/);
  assert.match(views, /onDrop: \(event\)/);
  assert.match(views, /className="map-move"/);
  assert.match(views, /onMove\(repoId, destination\)/);
  assert.match(views, /aria-live="polite"/);
});

test("disclosure controls expose a visible rotating chevron", () => {
  assert.match(styles, /details > summary::after/);
  assert.match(styles, /details\[open\] > summary::after/);
  assert.match(views, /className="analysis-criteria" open/);
});

test("React owns localisation without observing or rewriting the DOM", () => {
  assert.match(application, /translate\(language, value\)/);
  assert.doesNotMatch(localization, /MutationObserver|createTreeWalker|nodeValue/);
});
