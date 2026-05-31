import fs from "fs";
import path from "path";
import getPath from "./getPath";

/**
 * specifiedPathNamespecifiedfilenamegetfilereturncontent
 * @param styleName - style directory name, e.g. "chinese_sweet_romance"
 * @param fileName - filenamenot .md "art_character""prefix"
 * @returns filecontentnot foundwhenreturnempty string
 */
export function getArtPrompt(styleName: string, source: string, fileName: string): string {
 const baseDir = getPath(["skills", source, styleName]);

 if (!fs.existsSync(baseDir)) {
 return "";
 }

 // get prefix.md content
 const prefixFile = findFileRecursive(baseDir, "prefix.md");
 const prefixContent = prefixFile ? fs.readFileSync(prefixFile, "utf-8") : "";

 const target = fileName.endsWith(".md") ? fileName : `${fileName}.md`;
 const found = findFileRecursive(baseDir, target);

 if (!found) {
 return prefixContent;
 }

 const fileContent = fs.readFileSync(found, "utf-8");
 return prefixContent ? `${prefixContent}\n${fileContent}` : fileContent;
}
/**
 * directorygetunderall .md filecontent,byfilenamemappingreturn
 * @param styleName - style directory name, e.g. "chinese_sweet_romance"
 * @returns Record<filename(without extension), filecontent>
 */
export function getAllArtPrompts(styleName: string, source: string): Record<string, string> {
 const baseDir = getPath(["skills", source, styleName]);

 if (!fs.existsSync(baseDir)) {
 return {};
 }

 const result: Record<string, string> = {};
 collectMdFiles(baseDir, result);
 return result;
}

/**
 * recursively find file with specified namereturnfirst matching fullPath
 */
function findFileRecursive(dir: string, targetName: string): string | null {
 const entries = fs.readdirSync(dir, { withFileTypes: true });

 for (const entry of entries) {
 const fullPath = path.join(dir, entry.name);

 if (entry.isFile() && entry.name === targetName) {
 return fullPath;
 }

 if (entry.isDirectory()) {
 const found = findFileRecursive(fullPath, targetName);
 if (found) return found;
 }
 }

 return null;
}

/**
 * directoryunderall .md filecontent
 */
function collectMdFiles(dir: string, result: Record<string, string>): void {
 const entries = fs.readdirSync(dir, { withFileTypes: true });

 for (const entry of entries) {
 const fullPath = path.join(dir, entry.name);

 if (entry.isFile() && entry.name.endsWith(".md")) {
 const key = entry.name.replace(/\.md$/, "");
 result[key] = fs.readFileSync(fullPath, "utf-8");
 }

 if (entry.isDirectory()) {
 collectMdFiles(fullPath, result);
 }
 }
}
