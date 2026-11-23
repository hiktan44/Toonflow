import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findDeploymentSecrets, checkDeploymentFile, checkDeploymentRepo } from '../scripts/check-deployment-secrets.mjs';

const fictionalToken = 'FICTITIOUS_TEST_VALUE_' + '0'.repeat(28);
const fictionalFalKey = '00000000-0000-4000-8000-000000000000:' + 'a'.repeat(32);
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const documentFile = fileURLToPath(new URL('../DEPLOYMENT.md', import.meta.url));
const tool = fileURLToPath(new URL('../scripts/check-deployment-secrets.mjs', import.meta.url));

test('50 karakterlik somut Bearer değeri satırıyla yakalanır, değer sonuçta bulunmaz', () => {
  assert.equal(fictionalToken.length, 50);
  const found = findDeploymentSecrets('Örnek\nAuthorization: Bearer ' + fictionalToken);
  assert.deepEqual(found, [{ kind: 'Somut yetkilendirme anahtarı', line: 2 }]);
  assert.ok(!JSON.stringify(found).includes(fictionalToken));
});

test('Coolify numara/anahtar biçimi ve Basic değeri de reddedilir', () => {
  assert.equal(findDeploymentSecrets('bearer 123|' + fictionalToken).length, 1);
  assert.equal(findDeploymentSecrets('Authorization: Basic ' + fictionalToken).length, 1);
});

test('Somut Coolify ortam ve yapılandırma atamaları reddedilir', () => {
  for (const key of ['COOLIFY_TOKEN', 'COOLIFY_API_TOKEN', 'COOLIFY_API_KEY']) {
    assert.equal(findDeploymentSecrets(key + '="' + fictionalToken + '"').length, 1);
    assert.equal(findDeploymentSecrets(key + ': ' + fictionalToken).length, 1);
  }
});

test('Ortam genişletme, değişken adı ve açık yer tutucular kabul edilir', () => {
  for (const example of ['Bearer ${COOLIFY_TOKEN}', 'Bearer $COOLIFY_TOKEN', 'Bearer <COOLIFY_TOKEN>', 'Bearer YOUR_COOLIFY_API_TOKEN', 'COOLIFY_TOKEN=${SECRET_FROM_STORE}', 'COOLIFY_API_KEY=YOUR_COOLIFY_API_KEY']) {
    assert.deepEqual(findDeploymentSecrets(example), []);
  }
});

test('Gerçek belge anahtarsızdır ve genişletilebilir başlık kullanır', () => {
  const content = readFileSync(documentFile, 'utf8');
  assert.deepEqual(checkDeploymentFile(documentFile), []);
  assert.equal(content.split('-H "Authorization: Bearer ${COOLIFY_TOKEN}"').length - 1, 2);
  assert.ok(content.includes('${COOLIFY_TOKEN:?'));
  assert.ok(!content.includes("'Authorization: Bearer ${COOLIFY_TOKEN}'"));
});

test('CLI sızıntıda başarısız olur ve kurgusal anahtar değerini çıktıya basmaz', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toonflow-doc-test-'));
  try {
    const file = join(directory, 'DEPLOYMENT.md');
    writeFileSync(file, 'Authorization: Bearer ' + fictionalToken);
    const result = spawnSync(process.execPath, [tool, file], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('satırı: 1'));
    assert.ok(!(result.stdout + result.stderr).includes(fictionalToken));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('CLI eksik belgeyi başarılı kabul etmez', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toonflow-doc-test-'));
  try {
    const result = spawnSync(process.execPath, [tool, join(directory, 'missing.md')], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('okunamadı'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('CLI güvenli belgeyi değiştirmeden başarılı tamamlar', () => {
  const before = readFileSync(documentFile, 'utf8');
  const result = spawnSync(process.execPath, [tool, documentFile], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(readFileSync(documentFile, 'utf8'), before);
});

test('Somut FAL_KEY ataması ve docker-compose varsayılan değeri reddedilir, değer sızmaz', () => {
  const direct = findDeploymentSecrets('FAL_KEY=' + fictionalFalKey);
  assert.equal(direct.length, 1);
  assert.ok(!JSON.stringify(direct).includes(fictionalFalKey));

  const fallback = findDeploymentSecrets('      - FAL_KEY=${FAL_KEY:-' + fictionalFalKey + '}');
  assert.equal(fallback.length, 1);
  assert.ok(!JSON.stringify(fallback).includes(fictionalFalKey));

  for (const safe of ['FAL_KEY=your_fal_ai_api_key_here', 'FAL_KEY=${FAL_KEY:-}', 'FAL_KEY=${FAL_KEY}']) {
    assert.deepEqual(findDeploymentSecrets(safe), []);
  }
});

test('Depo dağıtım kontrolü temiz depoda geçer ve yasaklı/sızıntılı dosyada başarısız olur', () => {
  assert.deepEqual(checkDeploymentRepo(repoRoot), []);
  const directory = mkdtempSync(join(tmpdir(), 'toonflow-repo-test-'));
  try {
    writeFileSync(join(directory, 'DEPLOYMENT.md'), '# Temiz belge\n');
    writeFileSync(join(directory, 'docker-compose.yml'), 'environment:\n  - FAL_KEY=${FAL_KEY:-' + fictionalFalKey + '}\n');
    writeFileSync(join(directory, 'DEPLOYMENT.pdf'), 'placeholder');
    const result = spawnSync(process.execPath, [tool], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('DEPLOYMENT.pdf'));
    assert.ok(result.stderr.includes('docker-compose.yml'));
    assert.ok(!(result.stdout + result.stderr).includes(fictionalFalKey));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
