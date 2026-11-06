import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    // Gracefully handle stale or unresolved client serverFn RPC actions
    const errMessage = error instanceof Error ? error.message : String(error);
    if (errMessage.includes("Cannot read properties of undefined (reading 'method')")) {
      return new Response(
        JSON.stringify({
          error: "Server function not found or stale client bundle. Please reload the page.",
          stale: true,
        }),
        {
          status: 404,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Gracefully handle client connection resets / aborted requests without logging false 500 crashes
    const errCode =
      (error as { code?: string; cause?: { code?: string } })?.code ||
      (error as { cause?: { code?: string } })?.cause?.code;
    const causeMsg = String((error as { cause?: { message?: string } })?.cause?.message || "");

    if (
      errMessage.includes("aborted") ||
      errMessage.includes("ECONNRESET") ||
      errCode === "ECONNRESET" ||
      errCode === "ECANCELED" ||
      errCode === "ERR_STREAM_PREMATURE_CLOSE" ||
      errCode === "ERR_HTTP_REQUEST_ABORTED" ||
      causeMsg.includes("aborted") ||
      causeMsg.includes("ECONNRESET")
    ) {
      return new Response(null, { status: 499 });
    }

    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, errorMiddleware],
}));
