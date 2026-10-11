import { readFileSync, writeFileSync, statSync, renameSync, unlinkSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { generateI18nScript, generateLangSwitchHTML } from '../src/lib/i18n-client.ts';
import { prepareHtml } from './web-html.mjs';

export function prepareWebFile(filename = resolve('data/web/index.html')) {
  const input = readFileSync(filename, 'utf8');
  const result = prepareHtml(input, generateI18nScript(), generateLangSwitchHTML());
  if (result.html === input) return { changed: false, repaired: false };
  const temporary = resolve(dirname(filename), '.' + basename(filename) + '.' + randomUUID() + '.tmp');
  try {
    writeFileSync(temporary, result.html, { encoding: 'utf8', flag: 'wx', mode: statSync(filename).mode & 0o777 });
    renameSync(temporary, filename);
  } catch (error) {
    try { unlinkSync(temporary); } catch { /* Yazılamayan geçici dosya olmayabilir. */ }
    throw error;
  }
  return { changed: true, repaired: result.repaired };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = prepareWebFile(process.argv[2] ? resolve(process.argv[2]) : undefined);
    console.log(result.changed ? 'Web arayüzü hazırlandı; HTML ve JavaScript kontrolleri geçti.' : 'Web arayüzü zaten hazır; kontroller geçti.');
  } catch (error) {
    console.error('Web arayüzü hazırlanamadı: ' + error.message);
    process.exitCode = 1;
  }
}
