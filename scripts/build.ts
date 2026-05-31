import esbuild from "esbuild";
import fs from "fs";
import path from "path";

//  prod 
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "prod";
}

const pkg = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"));

const external = [
  "electron",
  "@huggingface/transformers",
  "onnxruntime-node",
  "vm2",
  "sqlite3",
  "better-sqlite3",
  "sharp",
  "mysql",
  "mysql2",
  "pg",
  "pg-query-stream",
  "oracledb",
  "tedious",
  "mssql",
];

// 
const appBuildConfig: esbuild.BuildOptions = {
  entryPoints: ["src/app.ts"],
  bundle: true,
  minify: false,
  format: "cjs",
  allowOverwrite: true,
  outfile: `data/serve/app.js`,
  platform: "node",
  target: "esnext",
  tsconfig: "./tsconfig.json",
  alias: {
    "@": "./src",
  },
  sourcemap: false,
  external,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
};

// Electron 
const mainBuildConfig: esbuild.BuildOptions = {
  entryPoints: ["scripts/main.ts"],
  bundle: true,
  minify: false,
  format: "cjs",
  outfile: `build/main.js`,
  allowOverwrite: true,
  platform: "node",
  target: "esnext",
  tsconfig: "./tsconfig.json",
  alias: {
    "@": "./src",
  },
  sourcemap: false,
  external,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
};

(async () => {
  try {
    console.log("🔨 ...\n");

    // 
    await Promise.all([esbuild.build(appBuildConfig), esbuild.build(mainBuildConfig)]);

    console.log("✅ : build/app.js");
    console.log("✅ Electron: build/main.js");
    console.log("\n🎉 !\n");
  } catch (err) {
    console.error("❌ :", err);
    process.exit(1);
  }
})();
