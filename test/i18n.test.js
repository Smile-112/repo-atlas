import test from "node:test";
import assert from "node:assert/strict";
import { localizeRenderedText, messages } from "../src/i18n.js";

test("Russian navigation has translations for every language control", () => {
  for (const key of Object.keys(messages.en)) assert.equal(typeof messages.ru[key], "string");
});

test("localisation translates known dynamic text without overwriting counters", () => {
  const known = { nodeValue: "27 repositories in view", parentElement: { closest: () => false } };
  const counter = { nodeValue: "27", parentElement: { closest: () => false } };
  const nodes = [known, counter];
  global.NodeFilter = { SHOW_TEXT: 4 };
  global.document = { body: {}, createTreeWalker: () => ({ currentNode: null, nextNode() { this.currentNode = nodes.shift(); return Boolean(this.currentNode); } }) };
  localizeRenderedText("ru");
  assert.equal(known.nodeValue, "27 репозиториев показано");
  assert.equal(counter.nodeValue, "27");
  delete global.document;
  delete global.NodeFilter;
});
