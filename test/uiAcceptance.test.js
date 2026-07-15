import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [application, styles] = await Promise.all([
  readFile(new URL("../src/main.jsx", import.meta.url), "utf8"),
  readFile(new URL("../src/styles.css", import.meta.url), "utf8")
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
