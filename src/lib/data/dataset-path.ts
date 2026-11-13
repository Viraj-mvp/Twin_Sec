import * as fs from "fs";
import * as path from "path";

/**
 * Resolves the absolute path to a file or directory in the dataset folder,
 * gracefully handling local development, server builds, and Vercel Serverless Function runtimes.
 */
export function resolveDatasetPath(...segments: string[]): string {
  const candidates = [
    // 1. Direct from process.cwd() (Local dev: D:\PRJ-7\twinsec\dataset\...)
    path.resolve(process.cwd(), "dataset", ...segments),
    // 2. Relative to current file / module
    path.resolve(__dirname, "..", "..", "..", "dataset", ...segments),
    path.resolve(__dirname, "..", "..", "dataset", ...segments),
    path.resolve(__dirname, "..", "dataset", ...segments),
    // 3. Vercel Serverless Lambda root (/var/task/dataset/...)
    path.resolve("/var/task", "dataset", ...segments),
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

