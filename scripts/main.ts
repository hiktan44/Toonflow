import { app, BrowserWindow, protocol } from "electron";
import path from "path";
import fs from "fs";
import Module from "module";

//  Electron ： GPU ，
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");

const TARGET_ENTRIES = new Set(["assets", "models", "serve", "skills", "web", "vendor"]);

function copyDir(src: string, dest: string): void {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.existsSync(d) || fs.copyFileSync(s, d);
  }
}

declare const __APP_VERSION__: string;

function compareVersions(a: string, b: string): number {
  const pa = a
    .split(".")
    .map((n) => Number.parseInt(n, 10))
    .filter((n) => Number.isFinite(n));
  const pb = b
    .split(".")
    .map((n) => Number.parseInt(n, 10))
    .filter((n) => Number.isFinite(n));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

function initializeData(): void {
  const srcDir = path.join(process.resourcesPath, "data");
  const destDir = path.join(app.getPath("userData"), "data");
  const versionFilePath = path.join(destDir, "version.txt");

  let shouldForceReplace = false;
  if (!fs.existsSync(versionFilePath)) {
    shouldForceReplace = true;
  } else {
    const localVersion = fs.readFileSync(versionFilePath, "utf-8").trim();
    if (compareVersions(localVersion, __APP_VERSION__) < 0) {
      shouldForceReplace = true;
    }
  }

  for (const dir of TARGET_ENTRIES) {
    const targetDir = path.join(destDir, dir);
    if (shouldForceReplace) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      copyDir(path.join(srcDir, dir), targetDir);
      continue;
    }
    if (!fs.existsSync(targetDir)) {
      copyDir(path.join(srcDir, dir), targetDir);
    }
  }

  if (shouldForceReplace) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(versionFilePath, `${__APP_VERSION__}\n`, "utf-8");
  }
}

//， unpacked ， asar 
function getNodeModulesPaths(): string[] {
  const paths: string[] = [];
  if (app.isPackaged) {
    // external （） unpacked 
    const unpackedNodeModules = path.join(process.resourcesPath, "app.asar.unpacked", "node_modules");
    if (fs.existsSync(unpackedNodeModules)) {
      paths.push(unpackedNodeModules);
    }
    //  asar 
    const asarNodeModules = path.join(process.resourcesPath, "app.asar", "node_modules");
    paths.push(asarNodeModules);
  } else {
    paths.push(path.join(process.cwd(), "node_modules"));
  }
  return paths;
}

//
function requireWithCustomPaths(modulePath: string): any {
  const appNodeModulesPaths = getNodeModulesPaths();
  // 
  const originalNodeModulePaths = (Module as any)._nodeModulePaths;
  // 
  (Module as any)._nodeModulePaths = function (from: string): string[] {
    const paths = originalNodeModulePaths.call(this, from);
    //  node_modules 
    for (let i = appNodeModulesPaths.length - 1; i >= 0; i--) {
      const p = appNodeModulesPaths[i];
      if (!paths.includes(p)) {
        paths.unshift(p);
      }
    }
    return paths;
  };
  try {
    // 
    delete require.cache[require.resolve(modulePath)];
    return require(modulePath);
  } finally {
    // 
    (Module as any)._nodeModulePaths = originalNodeModulePaths;
  }
}

let mainWindow: BrowserWindow | null = null;
let loadingWindow: BrowserWindow | null = null;

const loadingHtml = `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:#fff;color:#333;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  user-select:none;-webkit-app-region:drag}
.spinner{width:48px;height:48px;border:4px solid rgba(0,0,0,.1);
  border-top-color:#000;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
p{margin-top:20px;font-size:14px;opacity:.6}
</style></head><body><div class="spinner"></div><p>…</p></body></html>`)}`;

function showLoading(): void {
  loadingWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    show: true,
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#ffffff",
      symbolColor: "#333333",
      height: 36,
    },
  });
  loadingWindow.setMenuBarVisibility(false);
  loadingWindow.removeMenu();
  loadingWindow.on("closed", () => {
    loadingWindow = null;
  });
  void loadingWindow.loadURL(loadingHtml);
}

function closeLoading(): void {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.close();
    loadingWindow = null;
  }
}

function createMainWindow(): Promise<void> {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 500,
      frame: false,
      show: false,
      autoHideMenuBar: true,
      resizable: true,
      thickFrame: true,
    });
    mainWindow = win;
    win.setMenuBarVisibility(false);
    win.removeMenu();

    win.on("closed", () => {
      mainWindow = null;
    });

    win.once("ready-to-show", () => {
      closeLoading();
      win.show();
      resolve();
    });

    const isDev = process.env.NODE_ENV === "dev" || !app.isPackaged;
    if (process.env.VITE_DEV) {
      void win.loadURL("http://localhost:50188");
    } else {
      const htmlPath = isDev
        ? path.join(process.cwd(), "data", "web", "index.html")
        : path.join(app.getPath("userData"), "data", "web", "index.html");
      void win.loadFile(htmlPath);
    }
  });
}

let closeServeFn: (() => Promise<void>) | undefined;

protocol.registerSchemesAsPrivileged([
  {
    scheme: "toonflow",
    privileges: {
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

app.whenReady().then(async () => {
  // （data URL + backgroundColor，）
  showLoading();

  try {
    let servePath: string;
    if (app.isPackaged) {
      // ：， loading 
      await new Promise((r) => setTimeout(r, 0));
      initializeData();
      servePath = path.join(app.getPath("userData"), "data", "serve", "app.js");
    } else {
      // ：（tsx  -r tsx  require ）
      servePath = path.join(process.cwd(), "src", "app.ts");
    }
    // 
    const mod = requireWithCustomPaths(servePath);
    closeServeFn = mod.closeServe;
    const port = await mod.default(true);
    process.env.PORT = port;
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
    // 
    protocol.handle("toonflow", (request) => {
      const url = new URL(request.url);
      const pathname = url.hostname.toLowerCase();
      const handlers: Record<string, () => object> = {
        getappurl: () => ({ url: process.env.URL ?? `http://localhost:${port}/api` }),
        windowminimize: () => {
          mainWindow?.minimize();
          return { ok: true };
        },
        windowmaximize: () => {
          if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
          } else {
            mainWindow?.maximize();
          }
          return { ok: true };
        },
        windowclose: () => {
          app.exit(0);
          return { ok: true };
        },
        apprestart: () => {
          // ，
          setTimeout(() => {
            app.relaunch();
            app.exit(0);
          }, 500);
          return { ok: true, message: "" };
        },
        windowismaximized: () => ({
          maximized: mainWindow?.isMaximized() ?? false,
        }),
        opendevtool: () => {
          mainWindow?.webContents.openDevTools();
          return { ok: true };
        },
        openurlwithbrowser: () => {
          const search = url.searchParams;
          const targetUrl = search.get("url");
          if (targetUrl) {
            const { shell } = require("electron");
            shell.openExternal(targetUrl);
            return { ok: true };
          } else {
            return { ok: false, error: "url" };
          }
        },
      };
      const handler = handlers[pathname];
      const responseData = handler ? handler() : { error: "" };
      return new Response(JSON.stringify(responseData), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    });

    // ，（ ready-to-show loading）
    await createMainWindow();
  } catch (err) {
    console.error("[]:", err);
    await createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("before-quit", async (event) => {
  if (closeServeFn) await closeServeFn();
});
