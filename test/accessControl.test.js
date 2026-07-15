import test from "node:test";
import assert from "node:assert/strict";
import { createAccessControl, parseBasicAuthorization } from "../server/accessControl.js";

test("parses basic authorization without accepting malformed credentials", () => {
  assert.deepEqual(parseBasicAuthorization(`Basic ${Buffer.from("atlas:secret").toString("base64")}`), { username: "atlas", password: "secret" });
  assert.equal(parseBasicAuthorization("Bearer secret"), null);
  assert.equal(parseBasicAuthorization("Basic !!!"), null);
});

test("optional access control is disabled unless a key is configured", () => {
  let continued = false;
  createAccessControl()({}, {}, () => { continued = true; });
  assert.equal(continued, true);
});

test("configured access control accepts only matching credentials", () => {
  const middleware = createAccessControl({ username: "atlas", accessKey: "correct" });
  let continued = false;
  const request = { ip: "test", path: "/api/data", get: () => `Basic ${Buffer.from("atlas:correct").toString("base64")}` };
  middleware(request, {}, () => { continued = true; });
  assert.equal(continued, true);
});
