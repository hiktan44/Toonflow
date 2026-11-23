import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PLACEHOLDER_VALUE = /^(?:YOUR_COOLIFY_(?:API_)?TOKEN|YOUR_COOLIFY_API_KEY|your_fal_ai_api_key_here|YOUR_FAL_(?:API_)?KEY)$/i;
export const FORBIDDEN_SECRET_FILES = ['DEPLOYMENT.docx', 'DEPLOYMENT.pdf', '.env.production'];
export const MONITORED_DEPLOYMENT_FILES = ['DEPLOYMENT.md', 'docker-compose.yml', '.env.example'];

export function findDeploymentSecrets(content) {
  const rules = [
    ['Somut yetkilendirme anahtarı', /\b(?:Bearer|Basic)\s+["']?([A-Za-z0-9_.|/+~=-]{20,})/gi],
    ['Somut Coolify anahtar ataması', /\b(?:COOLIFY(?:_API)?_TOKEN|COOLIFY_API_KEY)\s*[:=]\s*["']?([A-Za-z0-9_.|/+~=-]{20,})/gi],
    ['Somut FAL_KEY ataması', /\bFAL_KEY\s*(?::(?!-)|=)\s*["']?([A-Za-z0-9_.|:~/-]{20,})/gi],
    ['Somut FAL_KEY varsayılan değeri', /\$\{\s*FAL_KEY\s*:-\s*([^}\s]{8,})\s*\}/gi],
  ];
  const found = [];
  for (const [kind, expression] of rules) {
    for (const match of content.matchAll(expression)) {
      if (PLACEHOLDER_VALUE.test(match[1])) continue;
      found.push({ kind, line: content.slice(0, match.index).split('\n').length });
    }
  }
  return found;
}

export function checkDeploymentFile(filename = resolve('DEPLOYMENT.md')) {
  return findDeploymentSecrets(readFileSync(filename, 'utf8'));
}

export function checkDeploymentRepo(rootDir = process.cwd()) {
  const root = resolve(rootDir);
  const findings = [];
  for (const rel of FORBIDDEN_SECRET_FILES) {
    if (existsSync(resolve(root, rel))) {
      findings.push({ file: rel, kind: 'Yasaklı sır taşıyan dağıtım/ortam dosyası', line: 0 });
    }
  }
  for (const rel of MONITORED_DEPLOYMENT_FILES) {
    const full = resolve(root, rel);
    if (rel === 'DEPLOYMENT.md' || existsSync(full)) {
      for (const item of checkDeploymentFile(full)) {
        findings.push({ file: rel, ...item });
      }
    }
  }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv[2]) {
      const found = checkDeploymentFile(resolve(process.argv[2]));
      if (found.length) {
        for (const item of found) console.error(item.kind + '; belge satırı: ' + item.line);
        process.exitCode = 1;
      } else console.log('Dağıtım belgesi anahtar kontrolünden geçti.');
    } else {
      const found = checkDeploymentRepo(process.cwd());
      if (found.length) {
        for (const item of found) {
          const loc = item.line > 0 ? '; belge satırı: ' + item.line : '';
          console.error(item.file + ': ' + item.kind + loc);
        }
        process.exitCode = 1;
      } else console.log('Dağıtım belgeleri ve yapılandırma dosyaları anahtar kontrolünden geçti.');
    }
  } catch {
    console.error('Dağıtım belgesi okunamadı; kontrol başarısız.');
    process.exitCode = 1;
  }
}
