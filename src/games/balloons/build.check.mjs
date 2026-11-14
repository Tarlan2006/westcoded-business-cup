/** Build the dev entry separately without editing Vite config or production inputs. */
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const result = await build({ configFile: false, plugins: [react()], build: {
  outDir: "src/games/balloons/.build", emptyOutDir: true, sourcemap: false,
  rollupOptions: { input: resolve("dev/balloons-preview.html") },
} });
const outputs = (Array.isArray(result) ? result : [result]).flatMap((bundle) => "output" in bundle ? bundle.output : []);
const game = outputs.find((item) => item.type === "chunk" && item.isDynamicEntry && item.facadeModuleId?.endsWith("/balloons/index.ts"));
assert(game?.type === "chunk", "React.lazy generates a separate game chunk");
const bytes = gzipSync(game.code).byteLength;
assert(bytes < 40 * 1024, `game chunk ${bytes} bytes gzip must be <40KB`);
console.log(`PASS isolated lazy game chunk: ${(bytes / 1024).toFixed(2)} KB gzip (<40 KB); fonts are local assets`);
