import test from "node:test";
import assert from "node:assert/strict";
import { messages } from "../src/i18n.js";

test("Russian navigation has translations for every language control", () => {
  for (const key of Object.keys(messages.en)) assert.equal(typeof messages.ru[key], "string");
});
