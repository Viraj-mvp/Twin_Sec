import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";

function getModuleDir(): string {
  try {
    if (typeof __dirname !== "undefined") {
      return __dirname;
    }
    if (typeof import.meta !== "undefined" && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {
    // fallback
  }
  return process.cwd();
}

/**
 * Resolves the absolute path to a file or directory in the dataset folder,
 * gracefully handling local development, server builds, and Vercel Serverless Function runtimes.
 */
export function resolveDatasetPath(...segments: string[]): string {
  const modDir = getModuleDir();
  const candidates = [
    // 1. Direct from process.cwd() (Local dev: D:\PRJ-7\twinsec\dataset\...)
    path.resolve(process.cwd(), "dataset", ...segments),
    // 2. Relative to current module directory
    path.resolve(modDir, "..", "..", "..", "dataset", ...segments),
    path.resolve(modDir, "..", "..", "dataset", ...segments),
    path.resolve(modDir, "..", "dataset", ...segments),
    // 3. Vercel Serverless Lambda root (/var/task/dataset/...)
    path.resolve("/var/task", "dataset", ...segments),
    path.resolve("/var/task", "api", "dataset", ...segments),
    // 4. Relative to dist/server output
    path.resolve(process.cwd(), "dist", "server", "dataset", ...segments),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // Ignore filesystem permission errors during probing
    }
  }

  // Fallback to standard process.cwd() path if none exist yet
  return candidates[0];
}
