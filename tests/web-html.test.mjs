import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, chmodSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { parse } from './html-parser/node_modules/parse5/dist/index.js';
import { inspectHtml, validateScripts, injectAtDocumentEnd, prepareHtml, repairKnownBundle } from '../scripts/web-html.mjs';
import { prepareWebFile } from '../scripts/prepare-web.mjs';
import { generateI18nScript, generateLangSwitchHTML } from '../src/lib/i18n-client.ts';

const realHtml = readFileSync(new URL('../data/web/index.html', import.meta.url), 'utf8');
const sourceRepair = repairKnownBundle(realHtml);
const prepared = prepareHtml(realHtml, generateI18nScript(), generateLangSwitchHTML()).html;

function descendants(node) {
  return [node, ...(node.childNodes ?? []).flatMap(descendants)];
}

function visibleText(node) {
  if (['script', 'style'].includes(node.tagName)) return '';
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes ?? []).map(visibleText).join('');
}

test('HTML5 ayrıştırıcısı kaynak çıktının hasarlı veya düzeltilmiş durumunu doğrular', () => {
  const nodes = descendants(parse(realHtml));
  const body = nodes.find(node => node.tagName === 'body');
  assert.ok(sourceRepair.repaired ? visibleText(body).length > 1_000_000 : visibleText(body).length < 5_000);
});

test('HTML5 ayrıştırıcısı, onarılan uygulama kodunu bütünüyle gerçek betikte tutar', () => {
  const nodes = descendants(parse(prepared, { sourceCodeLocationInfo: true }));
  const head = nodes.find(node => node.tagName === 'head');
  const body = nodes.find(node => node.tagName === 'body');
  const scripts = nodes.filter(node => node.tagName === 'script');
  assert.equal(scripts.length, 5);
  const main = scripts.find(node => node.attrs.some(attr => attr.name === 'type' && attr.value === 'module'));
  const expected = inspectHtml(prepared).scripts.find(script => /type="module"/.test(script.attrs));
  assert.equal(main.childNodes.map(node => node.value ?? '').join(''), expected.code);
  assert.ok(main.sourceCodeLocation.endOffset <= head.sourceCodeLocation.endOffset);
  assert.ok(visibleText(body).length < 5_000);
  assert.ok(!visibleText(body).includes('const En=w'));
  const menu = nodes.find(node => node.attrs?.some(attr => attr.name === 'id' && attr.value === 'lang-switch-container'));
  assert.equal(menu.parentNode.tagName, 'body');
  const seo = nodes.find(node => node.nodeName === '#comment' && node.data.trim() === 'release-readiness:start');
  const footer = nodes.find(node => node.nodeName === '#comment' && node.data.trim() === 'release-legal-footer:start');
  assert.equal(seo.parentNode.tagName, 'head');
  assert.equal(footer.parentNode.tagName, 'body');
});

test('Başlık/gövde ekleme, betik ve stil içindeki HTML metnine dokunmaz', () => {
  const input = '<html><head><meta data-value="</head>"><script>const x="</head></body>";</script><style>.x:after{content:"</head>"}</style><!-- </head> --></head><body><div id="app"></div></body></html>';
  const output = injectAtDocumentEnd(input, '<meta name="test">', '<footer>Son</footer>');
  assert.ok(output.includes('const x="</head></body>";'));
  assert.ok(output.includes('<!-- </head> --><meta name="test"></head>'));
  assert.ok(output.endsWith('<footer>Son</footer></body></html>'));
  validateScripts(output);
});

test('Büyük/küçük harf, tırnaklı etiketler ve ham metin alanları ayrıştırılır', () => {
  const input = '<HTML><HEAD><title>x </body></title></HEAD><BODY><textarea></head></textarea></BODY></HTML>';
  const output = injectAtDocumentEnd(input, 'BAŞLIK', 'GÖVDE');
  assert.ok(output.includes('BAŞLIK</HEAD>'));
  assert.ok(output.includes('GÖVDE</BODY>'));
});

test('Gerçek kaynak çıktısındaki bilinen hasar yakalanır; düzeltilmiş kaynak kabul edilir', () => {
  if (sourceRepair.repaired) assert.throws(() => validateScripts(realHtml), /JavaScript sözdizimi/);
  else validateScripts(realHtml);
});

test('Bilinen sarmalayıcı hasarı küçük bağımsız örnekte de onarılır', () => {
  const broken = '<html><head><script type="module">let st="",w=null;if(true) (' +
    `st='<html xmlns="http://www.w3.org/1999/xhtml"><head>` +
    '<script>console.log("i18n system initialized")</script><div id="lang-switch-container"></div>' +
    `</head><body>'+st+"</body></html>");const En=w?w.createHTML(st):st;` +
    '</script></head><body></body></html>';
  assert.throws(() => validateScripts(broken), /sözdizimi/);
  const restored = repairKnownBundle(broken);
  assert.equal(restored.repaired, true);
  validateScripts(restored.html);
});

test('Gerçek büyük uygulama çıktısındaki bütün betikler onarım sonrası geçerlidir', () => {
  const layout = validateScripts(prepared);
  assert.equal(layout.scripts.length, 5);
  const main = layout.scripts.find(script => /type="module"/.test(script.attrs));
  assert.ok(main.code.length > 20_000_000);
  assert.ok(!main.code.includes('release-readiness:start'));
  assert.ok(!main.code.includes('lang-switch-container'));
});

test('Dil ekleme, onarılan uygulama modülünü tekrar değiştirmez', () => {
  const restored = repairKnownBundle(realHtml);
  assert.equal(restored.repaired, sourceRepair.repaired);
  const main = html => inspectHtml(html).scripts.find(script => /type="module"/.test(script.attrs)).code;
  assert.equal(main(prepared), main(restored.html));
});

test('Tekrar hazırlama aynı çıktıyı üretir; dil blokları çoğalmaz', () => {
  assert.equal(prepareHtml(prepared, generateI18nScript(), generateLangSwitchHTML()).html, prepared);
  assert.equal(prepared.split('<!-- toonflow-i18n:start -->').length - 1, 1);
  assert.equal(prepared.split('<!-- toonflow-language:start -->').length - 1, 1);
});

test('Yasal bağlantılar, SEO açıklaması ve PWA kaydı gerçek belgeye taşınır', () => {
  const layout = inspectHtml(prepared);
  const seo = prepared.indexOf('<!-- release-readiness:start -->');
  const footer = prepared.indexOf('<!-- release-legal-footer:start -->');
  assert.ok(seo < layout.headEnd);
  assert.ok(footer > layout.headEnd && footer < layout.bodyEnd);
  assert.ok(prepared.includes('href="/gizlilik/"'));
  assert.ok(layout.scripts.some(script => script.code.includes("navigator.serviceWorker.register('/sw.js')")));
});

test('Betikteki işaret benzeri metin, yönetilen HTML yorumu sayılmaz', () => {
  const code = 'const x="<!-- toonflow-i18n:start -->";';
  const input = '<html><head><script>' + code + '</script></head><body></body></html>';
  const output = prepareHtml(input, '<script>const language="tr";</script>', '<div>Dil</div>').html;
  assert.equal(inspectHtml(output).scripts[0].code, code);
});

test('Eksik veya çelişkili dil işaretleri sessizce değiştirilmez', () => {
  const input = '<html><head><!-- toonflow-i18n:start --></head><body></body></html>';
  assert.throws(() => prepareHtml(input, '', ''), /işaretleri tutarsız/);
});

test('Geçersiz JavaScript bulunan dosya yazılmadan reddedilir', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toonflow-web-test-'));
  const file = join(directory, 'index.html');
  const input = '<html><head><script>const broken = ;</script></head><body></body></html>';
  try {
    writeFileSync(file, input);
    assert.throws(() => prepareWebFile(file), /sözdizimi/);
    assert.equal(readFileSync(file, 'utf8'), input);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('Gerçek dosya atomik hazırlanır; izinleri korunur ve ikinci çalıştırma yazmaz', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toonflow-web-test-'));
  const file = join(directory, 'index.html');
  try {
    writeFileSync(file, realHtml); chmodSync(file, 0o640);
    assert.deepEqual(prepareWebFile(file), { changed: prepared !== realHtml, repaired: sourceRepair.repaired });
    assert.equal(readFileSync(file, 'utf8'), prepared);
    assert.equal(statSync(file).mode & 0o777, 0o640);
    assert.deepEqual(prepareWebFile(file), { changed: false, repaired: false });
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

for (const initial of [null, 'en']) {
  test('Üretilen istemci gerçek koduyla dil tercihi çalışır: ' + (initial ?? 'Türkçe varsayılan'), () => {
    const values = new Map(initial ? [['ui_lang', initial]] : []);
    const document = { readyState: 'complete', documentElement: { lang: '' }, querySelectorAll() { return []; }, cookie: '' };
    const window = { addEventListener() {}, dispatchEvent() {} };
    const context = { document, window, localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }, console: { log() {}, warn() {} }, CustomEvent: class {}, fetch() { throw new Error('Dış ağ engelli'); } };
    new vm.Script(inspectHtml(generateI18nScript()).scripts[0].code).runInNewContext(context);
    assert.equal(window.i18n.getCurrentLang(), initial ?? 'tr');
    assert.equal(document.documentElement.lang, initial ?? 'tr');
    window.i18n.setLang(initial ? 'tr' : 'en');
    assert.equal(window.i18n.getCurrentLang(), initial ? 'tr' : 'en');
    assert.equal(document.documentElement.lang, initial ? 'tr' : 'en');
    assert.equal(values.get('ui_lang'), initial ? 'tr' : 'en');
  });
}
