// esbuild.config.mjs
import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "main.js",
  format: "cjs",
  external: ["obsidian"],
  watch: process.argv.includes("--watch")
});