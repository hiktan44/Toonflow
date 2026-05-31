import isPathInside from "is-path-inside";
import getPath, { isEletron } from "@/utils/getPath";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// PathremovePathconvert toSystem
function normalizeUserPath(userPath: string): string {
 // removeof / \
 const trimmedPath = userPath.replace(/^[/\\]+/, "");
 // convert all / SystemPathpath.sep
 // at Windows convert to \at Unix /
 return trimmedPath.split("/").join(path.sep);
}

// validatePath
function resolveSafeLocalPath(userPath: string, rootDir: string): string {
 const safePath = normalizeUserPath(userPath);
 const absPath = path.join(rootDir, safePath);
 if (!isPathInside(absPath, rootDir)) {
 throw new Error(`${userPath} not in OSS directory`);
 }
 return absPath;
}

class OSS {
 private rootDir: string;
 private initPromise: Promise<void>;

 constructor() {
 this.rootDir = getPath("oss");
 // auto-create root directory on init
 this.initPromise = fs.mkdir(this.rootDir, { recursive: true }).then(() => {});
 }

 /**
 * directorystartCompleteallfileatdirectoryalreadycreate
 * @private
 */
 private async ensureInit() {
 await this.initPromise;
 }

 /**
 * getspecifiedPathfileof URL
 * @param userRelPath relativefilePathuse / 
 * @returns fileof http 
 */
 async getFileUrl(userRelPath: string, prefix?: string): Promise<string> {
 if (!prefix) prefix = "oss";
 await this.ensureInit();
 const safePath = normalizeUserPath(userRelPath);
 // URL startuse /needSystemconvert to /
 let url = `/${prefix}/`;
 if (process.env.ossURL && process.env.ossURL !== "") url = process.env.ossURL + `/${prefix}/`;
 if (process.env.NODE_ENV == "dev") url = `http://localhost:10588/${prefix}/`;
 if (isEletron()) url = `http://localhost:${process.env.PORT}/${prefix}/`;
 return `${url}${safePath.split(path.sep).join("/")}`;
 }

 /**
 * readspecifiedPathoffilecontent Buffer
 * @param userRelPath relativefilePathuse / 
 * @returns filecontentof Buffer
 * @throws Pathnot in OSS directoryFile not foundError
 */
 async getFile(userRelPath: string): Promise<Buffer> {
 await this.ensureInit();
 return fs.readFile(resolveSafeLocalPath(userRelPath, this.rootDir));
 }

 /**
 * read image file and convert to base64 encoded Data URL
 * @param userRelPath relativefilePathuse / 
 * @returns base64 encoded Data URL (: data:image/png;base64,iVBORw0KGgo...)
 * @throws Pathnot in OSS directoryFile not foundnotisimagefileError
 */
 async getImageBase64(userRelPath: string): Promise<string> {
 await this.ensureInit();
 const absPath = resolveSafeLocalPath(userRelPath, this.rootDir);

 // checkfilewhetherexistsfile
 const stat = await fs.stat(absPath);
 if (!stat.isFile()) {
 throw new Error(`${userRelPath} notisfile`);
 }

 // getfileOK MIME Type
 const ext = path.extname(userRelPath).toLowerCase();
 const mimeTypes: Record<string, string> = {
 ".jpg": "image/jpeg",
 ".jpeg": "image/jpeg",
 ".png": "image/png",
 ".gif": "image/gif",
 ".webp": "image/webp",
 ".bmp": "image/bmp",
 ".svg": "image/svg+xml",
 ".ico": "image/x-icon",
 ".tiff": "image/tiff",
 ".tif": "image/tiff",
 ".mp4": "video/mp4",
 ".mp3": "audio/mpeg",
 };

 const mimeType = mimeTypes[ext];
 if (!mimeType) {
 throw new Error(`Not supportedofimage: ${ext}supportsof: ${Object.keys(mimeTypes).join(", ")}`);
 }

 // read file and convert to base64
 const data = await fs.readFile(absPath);
 const base64 = data.toString("base64");

 // returnof Data URL
 return `data:${mimeType};base64,${base64}`;
 }
 /**
 * DeletespecifiedPathoffile
 * @param userRelPath relativefilePathuse / 
 * @throws Pathnot in OSS directoryFile not foundError
 */
 async deleteFile(userRelPath: string): Promise<void> {
 await this.ensureInit();
 await fs.unlink(resolveSafeLocalPath(userRelPath, this.rootDir));
 }

 /**
 * DeletespecifiedPathoffolderallcontent
 * @param userRelPath relativefolderPathuse / 
 * @throws Pathnot in OSS directoryfoldernotexistsisfilenon-folderError
 */
 async deleteDirectory(userRelPath: string): Promise<void> {
 await this.ensureInit();
 const absPath = resolveSafeLocalPath(userRelPath, this.rootDir);
 const stat = await fs.stat(absPath);
 if (!stat.isDirectory()) {
 throw new Error(`${userRelPath} notisfolder`);
 }
 await fs.rm(absPath, { recursive: true, force: true });
 }

 /**
 * dataspecifiedPathoffilealreadyfile
 * createoffolder
 * @param userRelPath relativefilePathuse / 
 * @param data ofdata Buffer 
 * @throws Pathnot in OSS directoryError
 */
 async writeFile(userRelPath: string, data: Buffer | string): Promise<void> {
 await this.ensureInit();
 const absPath = resolveSafeLocalPath(userRelPath, this.rootDir);
 await fs.mkdir(path.dirname(absPath), { recursive: true });
 // data is string base64 
 // removeexistsof Data URL "data:image/png;base64,"
 const buffer = typeof data === "string" ? Buffer.from(data.replace(/^data:[^;]+;base64,/, ""), "base64") : data;
 await fs.writeFile(absPath, buffer);
 }

 /**
 * checkspecifiedPathfilewhetherexists
 * @param userRelPath relativefilePathuse / 
 * @returns fileexistsreturn trueNo false
 */
 async fileExists(userRelPath: string): Promise<boolean> {
 await this.ensureInit();
 try {
 const stat = await fs.stat(resolveSafeLocalPath(userRelPath, this.rootDir));
 return stat.isFile();
 } catch {
 return false;
 }
 }

 /**
 * Get imageofimage URLnot 512px
 * imageSaveatPathdirectoryunderof smallImage childfolder
 * imagealreadyexistsreturn URLnotexistsSavereturnimage URL
 * Generation failedwhenreturnimage URL
 * @param userRelPath relativefilePathuse / 
 * @returns image URLalreadyexistsGenerated successfullyimage URLGeneration failedwhen
 */
 async getSmallImageUrl(userRelPath: string): Promise<string> {
 // imagePathatPathofdirectory smallImage directory
 // 123/abc.jpg => smallImage/123/abc.jpg
 const smallImageRelPath = `smallImage/${userRelPath.replace(/^[/\\]+/, "")}`;

 if (await this.fileExists(smallImageRelPath)) {
 return this.getFileUrl(smallImageRelPath);
 }

 // imagenotexistsGeneration failedreturnimage URL
 const originalUrl = await this.getFileUrl(userRelPath);

 try {
 await this.ensureInit();
 const srcAbsPath = resolveSafeLocalPath(userRelPath, this.rootDir);
 const dstAbsPath = resolveSafeLocalPath(smallImageRelPath, this.rootDir);
 await fs.mkdir(path.dirname(dstAbsPath), { recursive: true });
 await sharp(srcAbsPath)
 .resize(512, 512, { fit: "inside", withoutEnlargement: true })
 .toFile(dstAbsPath);
 console.info(`[${dstAbsPath}]imageSuccess`);
 return this.getFileUrl(smallImageRelPath);
 } catch (e) {
 // Generation failedreturnimage
 console.warn("[OSS] imageFailed:", e);
 return originalUrl;
 }
 }
}

export default new OSS();
