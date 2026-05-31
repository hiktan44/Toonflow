// import "./logger";
import "./err";
import "./env";
import express, { Request, Response, NextFunction } from "express";
import { Server } from "socket.io";
import http from "node:http";
import expressWs from "express-ws";
import logger from "morgan";
import cors from "cors";
import buildRoute from "@/core";
import path from "path";
import fs from "fs";
import u from "@/utils";
import jwt from "jsonwebtoken";
import socketInit from "@/socket/index";
import { isEletron } from "@/utils/getPath";

const app = express();
const server = http.createServer(app);

async function checkPermissions() {
 if (!isEletron()) return true;
 const userDataPath = u.getPath();
 try {
 fs.mkdirSync(userDataPath, { recursive: true });
 const testFile = path.join(userDataPath, ".access_test");
 fs.writeFileSync(testFile, "test");
 fs.unlinkSync(testFile);
 } catch (e) {
 const { dialog, app } = require("electron");
 const { response } = await dialog.showMessageBox({
 type: "warning",
 title: "Insufficient permissions",
 message: "Application cannot access data directory",
 detail: `Cannot read/write the following directory: \n${userDataPath}\n\nPlease contact the administrator to grant permissions, or run this program as administrator.`,
 buttons: ["Confirm Exit"],
 defaultId: 0,
 });
 if (response === 0) {
 app.quit();
 }
 }
}

export default async function startServe(randomPort: Boolean = false) {
 await checkPermissions();

 await u.writeVersion();
 const io = new Server(server, { cors: { origin: "*" } });
 socketInit(io);

 if (process.env.NODE_ENV == "dev") await buildRoute();

 expressWs(app);

 app.use(logger("dev"));
 app.use(cors({ origin: "*" }));
 app.use(express.json({ limit: "100mb" }));
 app.use(express.urlencoded({ extended: true, limit: "100mb" }));

 // OSS static resources
 const ossDir = u.getPath("oss");
 if (!fs.existsSync(ossDir)) {
 fs.mkdirSync(ossDir, { recursive: true });
 }
 console.log("File directory:", ossDir);
 app.use("/oss", express.static(ossDir, { acceptRanges: false }));
 // Skills static resources
 const skillsDir = u.getPath("skills");
 if (!fs.existsSync(skillsDir)) {
 fs.mkdirSync(skillsDir, { recursive: true });
 }
 console.log("File directory:", skillsDir);
 // openly image files are allowed
 app.use(
 "/skills",
 (req, res, next) => {
 /\.(jpe?g|png|gif|webp|svg|ico|bmp)$/i.test(req.path) ? next() : res.status(403).end();
 },
 express.static(skillsDir, { acceptRanges: false }),
 );

 // Assets static resources
 const assetsDir = u.getPath("assets");
 if (!fs.existsSync(assetsDir)) {
 fs.mkdirSync(assetsDir, { recursive: true });
 }
 console.log("File directory:", assetsDir);
 app.use("/assets", express.static(assetsDir, { acceptRanges: false }));

 // data/web static website
 const webDir = u.getPath("web");
 if (fs.existsSync(webDir)) {
 console.log("Static website directory:", webDir);
 // Redirect /web/* to root (static files are served from root)
 app.use("/web", (req, res) => {
 res.redirect(req.path === "/" ? "/index.html" : req.path);
 });
 app.use(express.static(webDir, { acceptRanges: false }));
 } else {
 console.warn("Static website directory not found:", webDir);
 }

 // Auth middleware - only for /api/* routes
 app.use("/api", async (req, res, next) => {
 const setting = await u.db("o_setting").where("key", "tokenKey").select("value").first();
 if (!setting) return res.status(444).send({ message: "Server secret key not configured, please contact administrator" });
 const { value: tokenKey } = setting;
 // Get token from header or query params
 const rawToken = req.headers.authorization || (req.query.token as string) || "";
 const token = rawToken.replace("Bearer ", "");
 // Whitelisted paths
 if (req.path === "/login/login") return next();

 if (!token) return res.status(401).send({ message: "Token not provided" });
 try {
 const decoded = jwt.verify(token, tokenKey as string);
 (req as any).user = decoded;
 next();
 } catch (err) {
 return res.status(401).send({ message: "Invalid token" });
 }
 });

 const router = await import("@/router");
 await router.default(app);

 // SPA fallback - serve index.html for non-API routes (Vue Router support)
 const webDirFallback = u.getPath("web");
 if (fs.existsSync(webDirFallback)) {
 app.use((req, res, next) => {
 // Only handle GET requests for SPA fallback
 if (req.method !== "GET") return next();
 // Don't serve index.html for API routes or static asset requests
 if (req.path.startsWith("/api/") || req.path.startsWith("/oss/") || req.path.startsWith("/assets/") || req.path.startsWith("/skills/")) {
  return next();
 }
 res.sendFile(path.join(webDirFallback, "index.html"));
 });
 }

 // 404 handle for API routes
 app.use((_, res, next: NextFunction) => {
 return res.status(404).send({ message: "API 404 Not Found" });
 });

 // Error handling
 app.use((err: any, _: Request, res: Response, __: NextFunction) => {
 res.locals.message = err.message;
 res.locals.error = err;
 console.error(err);
 res.status(err.status || 500).send(err);
 });

 const port = randomPort ? 0 : (parseInt(process.env.PORT || "10588", 10));
 return await new Promise((resolve) => {
 server.listen(port, async () => {
 const address = server.address();
 const realPort = typeof address === "string" ? address : address?.port;
 console.log(`[Server started successfully]: http://localhost:${realPort}`);
 resolve(realPort);
 });
 });
}

// Support async close
export function closeServe(): Promise<void> {
 return new Promise((resolve, reject) => {
 if (server) {
 server.close((err?: Error) => {
 if (err) return reject(err);
 console.log("[Server closed]");
 resolve();
 });
 } else {
 resolve();
 }
 });
}

const isElectron = typeof process.versions?.electron !== "undefined";
if (!isElectron) startServe();
