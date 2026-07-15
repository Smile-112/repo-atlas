const SENSITIVE_KEY = /token|authorization|cookie|password|secret/i;

export function sanitizeLogDetails(details = {}) {
  return Object.fromEntries(Object.entries(details).map(([key, value]) => [
    key,
    SENSITIVE_KEY.test(key) ? "[redacted]" : value
  ]));
}

export function log(level, event, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitizeLogDetails(details)
  };
  console.log(JSON.stringify(entry));
  return entry;
}

export const logger = {
  info: (event, details) => log("info", event, details),
  warn: (event, details) => log("warn", event, details),
  error: (event, details) => log("error", event, details)
};
