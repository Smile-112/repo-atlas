import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeLogDetails } from "../server/logger.js";

test("logger redacts secrets while preserving safe diagnostic context", () => {
  assert.deepEqual(sanitizeLogDetails({
    owner: "Smile-112",
    githubToken: "github_pat_example",
    authorization: "Bearer secret",
    port: 8080
  }), {
    owner: "Smile-112",
    githubToken: "[redacted]",
    authorization: "[redacted]",
    port: 8080
  });
});
