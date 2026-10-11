import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { findDeploymentSecrets, checkDeploymentFile } from '../scripts/check-deployment-secrets.mjs';

const fictionalToken = 'FICTITIOUS_TEST_VALUE_' + '0'.repeat(28);
const documentFile = new URL('../DEPLOYMENT.md', import.meta.url);
const tool = new URL('../scripts/check-deployment-secrets.mjs', import.meta.url);

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
    const result = spawnSync(process.execPath, [tool.pathname, file], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('satırı: 1'));
    assert.ok(!(result.stdout + result.stderr).includes(fictionalToken));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('CLI eksik belgeyi başarılı kabul etmez', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toonflow-doc-test-'));
  try {
    const result = spawnSync(process.execPath, [tool.pathname, join(directory, 'missing.md')], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('okunamadı'));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('CLI güvenli belgeyi değiştirmeden başarılı tamamlar', () => {
  const before = readFileSync(documentFile, 'utf8');
  const result = spawnSync(process.execPath, [tool.pathname, documentFile.pathname], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(readFileSync(documentFile, 'utf8'), before);
});
