const isDev = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.DEV : true;

export const log = {
  error: (...args: unknown[]) => console.error("[TwinSec]", ...args),
  warn: (...args: unknown[]) => {
    if (isDev) console.warn("[TwinSec]", ...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.log("[TwinSec]", ...args);
  },
};
