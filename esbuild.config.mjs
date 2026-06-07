import esbuild from "esbuild";
import { copyFileSync, existsSync, statSync } from "fs";

const vaultPath =
  "D:/forZubin/books stuffs/The 19th Nexus/The 19th Nexus Vault/.obsidian/plugins/doob-engine";

const buildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "dist/main.js",
  format: "cjs",
  platform: "node",
  external: ["obsidian"],
  sourcemap: true,
  minify: false
};

function copyToVault() {
  const src = "dist/main.js";
  const dest = `${vaultPath}/main.js`;

  if (!existsSync(src)) return;

  copyFileSync(src, dest);
  console.log("✔ Copied to Obsidian plugin folder");
}

async function start() {
  const ctx = await esbuild.context(buildOptions);

  console.log("👀 Watching src → dist");

  // 🔥 THIS is the ONLY correct watch call
  await ctx.watch();

  // initial build copy (safe delay for first build)
  setTimeout(copyToVault, 500);

  // 🔥 THE ONLY RELIABLE HOOK in context mode:
  // we hook rebuild by wrapping rebuild function safely

  const originalRebuild = ctx.rebuild.bind(ctx);

  ctx.rebuild = async (...args) => {
    const result = await originalRebuild(...args);

    // only copy if build succeeded
    if (result) {
      copyToVault();
    }

    return result;
  };
}

start();