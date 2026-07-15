export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function requestJson(url, { timeoutMs = 15_000, signal } = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeoutMs);
  const cancel = () => controller.abort(signal.reason);
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(payload.error ?? `Request failed with status ${response.status}.`, response.status);
    return payload;
  } catch (error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") throw new ApiError("The request timed out. Try again.", 408);
    if (error instanceof ApiError) throw error;
    throw new ApiError("The server could not be reached. Check the connection and try again.");
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}
