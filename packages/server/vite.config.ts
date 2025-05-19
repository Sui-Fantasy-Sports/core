// import { defineConfig } from "vite";
// import devServer from "@hono/vite-dev-server";
// import bunAdapter from "@hono/vite-dev-server/bun";
// import tailwindcss from "@tailwindcss/vite";
// import path from "path";

// const port = Bun.env["PORT"] ? Number(Bun.env["PORT"]) : 5173;
// export default defineConfig({
//     server: { port: port },
//     build: {
//         rollupOptions: {
//             input: ["./app/main.tsx"],
//             output: {
//                 entryFileNames: "static/client.js",
//                 chunkFileNames: "static/assets/[name]-[hash].js",
//                 assetFileNames: "static/assets/[name].[ext]",
//             },
//         },
//         emptyOutDir: false,
//         copyPublicDir: false,
//     },
//     publicDir: "public",
//     plugins: [
//         tailwindcss(),
//         devServer({
//             entry: "server.ts",
//             adapter: bunAdapter(),
//         }),
//     ],
//     resolve: {
//         alias: {
//             "~shared": import.meta.resolve("../../../shared"),
//         },
//     },
// });
// import { defineConfig } from "vite";
// import devServer from "@hono/vite-dev-server";
// import bunAdapter from "@hono/vite-dev-server/bun";
// import tailwindcss from "@tailwindcss/vite";
// import react from "@vitejs/plugin-react";
// import path from "path";

// const port = Bun.env["PORT"] ? Number(Bun.env["PORT"]) : 5173;

// export default defineConfig({
//   plugins: [
//     react(),
//     tailwindcss(),
//     devServer({
//       entry: "server.ts",
//       adapter: bunAdapter(),
//     }),
//   ],
//   server: { port: port },
//   publicDir: "public",
//   build: {
//     outDir: "dist",
//     emptyOutDir: true,
//     copyPublicDir: true,
//     rollupOptions: {
//       input: "template.html",
//       output: {
//         entryFileNames: "static/client.js",
//         chunkFileNames: "static/assets/[name]-[hash].js",
//         assetFileNames: "static/assets/[name].[ext]",
//         manualChunks: {
//           vendor: ["react", "react-dom", "react-router-dom"],
//           mysten: ["@mysten/dapp-kit", "@mysten/sui"],
//           tanstack: ["@tanstack/react-query"],
//           radix: [
//             "@radix-ui/react-tabs",
//             "@radix-ui/react-dialog",
//             "@radix-ui/react-dropdown-menu",
//             "@radix-ui/react-presence",
//             "@radix-ui/react-roving-focus",
//             "@radix-ui/react-slot",
//             "@radix-ui/react-collection",
//           ],
//           framer: ["framer-motion"],
//         },
//       },
//     },
//     chunkSizeWarningLimit: 1000,
//   },
//   base: "/",
//   esbuild: {
//     logOverride: {
//       "module-directive": "silent",
//     },
//   },
//   resolve: {
//     alias: {
//       "~shared": path.resolve(__dirname, "../../../shared"),
//       "@mysten/sui": path.resolve(__dirname, "node_modules/@mysten/sui/dist/esm/client/index.js"), // Redirect to client subpath
//     },
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import devServer from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Bun.env["PORT"] ? Number(Bun.env["PORT"]) : 5173;
export default defineConfig(({ mode }) => ({
  root: ".", // Project root is packages/server/
  server: {
    port: port,
    strictPort: true,
  },
  base: "/",
  build: {
  rollupOptions: {
    input: path.resolve(__dirname, "index.html"), // <- NOT public/index.html
  },
  outDir: "dist",
  emptyOutDir: true,
  copyPublicDir: true, // restore this to true
  sourcemap: true,
  chunkSizeWarningLimit: 1000,
},

  publicDir: "public",
  plugins: [
    react(),
    tailwindcss(),
    mode === "development" ? devServer({
      entry: "server.ts",
      adapter: bunAdapter(),
      // pathPrefix is not a valid option for devServer
    }) : null,
    {
      name: "fix-html-output",
      generateBundle(options, bundle) {
        for (const [key, asset] of Object.entries(bundle)) {
          if (key.startsWith("public/")) {
            bundle[key.replace("public/", "")] = asset;
            delete bundle[key];
          }
        }
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "~shared": path.resolve(__dirname, "../../../shared"),
      "/app/main.tsx": path.resolve(__dirname, "app/main.tsx"),
    },
  },
}));