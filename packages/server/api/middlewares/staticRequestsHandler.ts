import { createMiddleware } from "hono/factory";
import path from "path";
import { tryCatch } from "../lib/tryCatch"

const staticRequestsHandler = (staticDir: string) =>
  createMiddleware(async (ctx, next) => {
    const requestedPath = ctx.req.path;
    const relativePath = requestedPath.substring("/".length);

    if (!relativePath.includes(".")) {
      return await next();
    }

    // Prevent directory traversal attacks
    if (relativePath.includes("..")) {
      ctx.log(`[Static] Denied potentially malicious path: ${relativePath}`);
      return ctx.text("Forbidden", 403);
    }

    const absoluteFilePath = path.join(staticDir, relativePath);

    const file = Bun.file(absoluteFilePath);
    const exists = await tryCatch(file.exists());

    if (exists.error) {
      ctx.log(`[Static] Truoble trying to find file: ${absoluteFilePath}.`);

      await next();
    }
    if (!exists.data) {
      ctx.log(`[Static] File not found: ${absoluteFilePath}.`);

      return ctx.text("Not Found", 404);
    }

    const mimeType = mimeLookup(absoluteFilePath) || "application/octet-stream";
    ctx.header("Content-Type", mimeType);
    return ctx.body(file.stream());
  });

export default staticRequestsHandler;

function mimeLookup(filePath: string) {
  const lastDotIndex = filePath.lastIndexOf(".");
  if (lastDotIndex < 0) {
    return "application/octet-stream";
  }

  const extension = filePath.substring(lastDotIndex + 1).toLowerCase();

  switch (extension) {
    case "html":
    case "htm":
      return "text/html";
    case "css":
      return "text/css";
    case "js":
    case "mjs":
      return "application/javascript";
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";

    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "ico":
      return "image/vnd.microsoft.icon";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";

    case "woff":
      return "font/woff";
    case "woff2":
      return "font/woff2";
    case "ttf":
      return "font/ttf";
    case "otf":
      return "font/otf";
    case "eot":
      return "application/vnd.ms-fontobject";

    case "txt":
      return "text/plain";
    case "pdf":
      return "application/pdf";

    default:
      return "application/octet-stream"; //fallback
  }
}