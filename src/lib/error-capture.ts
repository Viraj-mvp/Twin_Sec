// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function isClientSocketAbort(error: unknown): boolean {
  if (!error) return false;
  const msg = String((error as { message?: string })?.message || error || "");
  const code =
    (error as { code?: string; cause?: { code?: string } })?.code ||
    (error as { cause?: { code?: string } })?.cause?.code;
  const causeMsg = String((error as { cause?: { message?: string } })?.cause?.message || "");

  return (
    msg.includes("aborted") ||
    msg.includes("ECONNRESET") ||
    code === "ECONNRESET" ||
    code === "ECANCELED" ||
    code === "ERR_HTTP_REQUEST_ABORTED" ||
    code === "ERR_STREAM_PREMATURE_CLOSE" ||
    causeMsg.includes("aborted") ||
    causeMsg.includes("ECONNRESET")
  );
}

function record(error: unknown) {
  if (isClientSocketAbort(error)) {
    return;
  }
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("unhandledRejection", (reason) => {
    if (isClientSocketAbort(reason)) {
      // Suppress noisy client-side connection resets in development terminal
      return;
    }
  });
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
