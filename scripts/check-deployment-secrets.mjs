import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function findDeploymentSecrets(content) {
  const rules = [
    ['Somut yetkilendirme anahtarı', /\b(?:Bearer|Basic)\s+["']?([A-Za-z0-9_.|/+~=-]{20,})/gi],
    ['Somut Coolify anahtar ataması', /\b(?:COOLIFY(?:_API)?_TOKEN|COOLIFY_API_KEY)\s*[:=]\s*["']?([A-Za-z0-9_.|/+~=-]{20,})/gi],
  ];
  const found = [];
  for (const [kind, expression] of rules) {
    for (const match of content.matchAll(expression)) {
      if (/^(?:YOUR_COOLIFY_(?:API_)?TOKEN|YOUR_COOLIFY_API_KEY)$/.test(match[1])) continue;
      found.push({ kind, line: content.slice(0, match.index).split('\n').length });
    }
  }
  return found;
}

export function checkDeploymentFile(filename = resolve('DEPLOYMENT.md')) {
  return findDeploymentSecrets(readFileSync(filename, 'utf8'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const found = checkDeploymentFile(process.argv[2] ? resolve(process.argv[2]) : undefined);
    if (found.length) {
      for (const item of found) console.error(item.kind + '; belge satırı: ' + item.line);
      process.exitCode = 1;
    } else console.log('Dağıtım belgesi anahtar kontrolünden geçti.');
  } catch {
    console.error('Dağıtım belgesi okunamadı; kontrol başarısız.');
    process.exitCode = 1;
  }
}
