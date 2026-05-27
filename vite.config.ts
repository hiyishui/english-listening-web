import fs from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const projectDir = fileURLToPath(new URL(".", import.meta.url));
const defaultContentRepoPath = path.resolve(projectDir, "../english-listening-content");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const contentRepoPath = env.VITE_LOCAL_CONTENT_REPO_PATH || process.env.VITE_LOCAL_CONTENT_REPO_PATH || defaultContentRepoPath;

  return {
    plugins: [react(), localContentPlugin(contentRepoPath)],
    base: env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || "/"
  };
});

function localContentPlugin(contentRepoPath: string): Plugin {
  const mountPath = "/local-content/";
  const contentRoot = path.resolve(contentRepoPath);

  return {
    name: "english-listening-local-content",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const requestUrl = req.url || "";
        if (!requestUrl.startsWith(mountPath)) {
          next();
          return;
        }

        const pathname = new URL(requestUrl, "http://local").pathname;
        const relativePath = decodeURIComponent(pathname.slice(mountPath.length));
        const filePath = path.resolve(contentRoot, relativePath);
        const rootRelativePath = path.relative(contentRoot, filePath);
        if (rootRelativePath.startsWith("..") || path.isAbsolute(rootRelativePath)) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        try {
          const fileStat = await stat(filePath);
          if (!fileStat.isFile()) {
            res.statusCode = 404;
            res.end("Local content not found");
            return;
          }
        } catch {
          res.statusCode = 404;
          res.end("Local content not found");
          return;
        }

        res.setHeader("Content-Type", contentTypeFor(filePath));
        fs.createReadStream(filePath)
          .on("error", () => {
            if (!res.headersSent) {
              res.statusCode = 500;
            }
            res.end("Unable to read local content");
          })
          .pipe(res);
      });
    }
  };
}

function contentTypeFor(filePath: string): string {
  switch (path.extname(filePath)) {
    case ".json":
      return "application/json; charset=utf-8";
    case ".mp3":
      return "audio/mpeg";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".vtt":
      return "text/vtt; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}
