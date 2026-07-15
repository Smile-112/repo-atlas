import { timingSafeEqual } from "node:crypto";

function safeEqual(actual, expected) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function parseBasicAuthorization(value) {
  if (typeof value !== "string" || !value.startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(value.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return { username: decoded.slice(0, separator), password: decoded.slice(separator + 1) };
  } catch {
    return null;
  }
}

export function createAccessControl({ username = "atlas", accessKey = "", maxFailures = 8, windowMs = 60_000 } = {}) {
  const enabled = Boolean(accessKey);
  const failures = new Map();

  return function accessControl(request, response, next) {
    if (!enabled) return next();
    const client = request.ip ?? request.socket?.remoteAddress ?? "unknown";
    const now = Date.now();
    const state = failures.get(client);
    if (state && state.resetAt > now && state.count >= maxFailures) return response.status(429).json({ error: "Too many authentication attempts. Try again later." });
    if (state && state.resetAt <= now) failures.delete(client);

    const credentials = parseBasicAuthorization(request.get("authorization"));
    if (credentials && safeEqual(credentials.username, username) && safeEqual(credentials.password, accessKey)) {
      failures.delete(client);
      return next();
    }

    const current = failures.get(client);
    failures.set(client, current && current.resetAt > now ? { ...current, count: current.count + 1 } : { count: 1, resetAt: now + windowMs });
    response.set("WWW-Authenticate", 'Basic realm="Repo Atlas", charset="UTF-8"');
    if (request.path.startsWith("/api/")) return response.status(401).json({ error: "Authentication required." });
    return response.status(401).type("text").send("Repo Atlas authentication required.");
  };
}
