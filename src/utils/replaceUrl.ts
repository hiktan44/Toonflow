import path from "node:path";

export default function replaceUrl(url: string): string {
 if (typeof url !== 'string' || !url.trim()) return '';
 let cleanedPath = '';
 try {
 const pathname = new URL(url).pathname;
 cleanedPath = pathname.replace(/^\/oss/, '').replace(/^\/smallImage/, '');
 } catch (e) {
 // notisValidofURLuse
 cleanedPath = url;
 }

 // PathPathensurenot
 // use posix normalize (keep / separator), remove all .. and .
 const normalized = path.posix.normalize(cleanedPath);

 // Path ../ openprefix or equals .. Pathreturnempty string
 if (normalized.startsWith('../') || normalized === '..') {
 return '';
 }

 // remove leading slash, ensurereturnofisPath
 return normalized.replace(/^\/+/, '');
}
