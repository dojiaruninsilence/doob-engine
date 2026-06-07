import esbuild from "esbuild";
import { copyFileSync, existsSync } from "fs";

const vaultPath =
  "D:/forZubin/books stuffs/The 19th Nexus/The 19th Nexus Vault/.obsidian/plugins/doob-engine";

function copyToVault() {
  const src = "dist/main.js";
  const dest = `${vaultPath}/main.js`;

  if (!existsSync(src)) return;

  copyFileSync(src, dest);
  console.log("✔ Copied to Obsidian plugin folder");
}

async function start() {

  const ctx = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "dist/main.js",
    format: "cjs",
    platform: "node",
    external: ["obsidian"],
    sourcemap: true,
    minify: false,

    // 🔥 THIS is the correct hook
    plugins: [
      {
        name: "doob-reload-plugin",
        setup(build) {

          build.onEnd(result => {
            if (result.errors.length === 0) {
              copyToVault();
            } else {
              console.log("❌ Build failed, not copying");
            }
          });

        }
      }
    ]
  });

  console.log("👀 Watching src → dist");

  await ctx.watch();

  // initial copy (first build)
  setTimeout(copyToVault, 500);
}

start();