import { spawnSync } from 'node:child_process';

const XML_PREFIX = `st='<html xmlns="http://www.w3.org/1999/xhtml"><head>`;
const XML_SUFFIX = '</body></html>");const En=w?w.createHTML(st):st;';
const HEAD_MARKER = 'toonflow-i18n';
const BODY_MARKER = 'toonflow-language';

function tagEnd(html, start) {
  let quote = null;
  for (let index = start; index < html.length; index++) {
    const char = html[index];
    if (quote) { if (char === quote) quote = null; }
    else if (char === '"' || char === "'") quote = char;
    else if (char === '>') return index + 1;
  }
  throw new Error('HTML etiketi tamamlanmamış.');
}

// Betik, stil ve metin alanlarının içindeki HTML benzeri metinlere dokunmaz.
export function inspectHtml(html) {
  const result = { headEnd: null, bodyEnd: null, scripts: [], comments: [], raw: [] };
  let index = 0;
  while (index < html.length) {
    const start = html.indexOf('<', index);
    if (start < 0) break;
    if (html.startsWith('<!--', start)) {
      const end = html.indexOf('-->', start + 4);
      if (end < 0) throw new Error('HTML yorumu tamamlanmamış.');
      result.comments.push({ start, end: end + 3, text: html.slice(start, end + 3) });
      index = end + 3;
      continue;
    }
    const token = /^<(\/?)([a-z][\w:-]*)(?=[\s/>])/i.exec(html.slice(start, start + 120));
    if (!token) { index = start + 1; continue; }
    const end = tagEnd(html, start);
    const name = token[2].toLowerCase();
    const closing = token[1] === '/';
    if (closing && name === 'head') result.headEnd = start;
    if (closing && name === 'body') result.bodyEnd = start;
    if (!closing && ['script', 'style', 'textarea', 'title'].includes(name)) {
      const expression = new RegExp('</' + name + '(?=[\\s/>])', 'gi');
      expression.lastIndex = end;
      const close = expression.exec(html);
      if (!close) throw new Error('HTML ham metin etiketi kapanmamış: ' + name);
      const closeEnd = tagEnd(html, close.index);
      const item = { start, end: closeEnd, codeStart: end, codeEnd: close.index, attrs: html.slice(start + token[0].length, end - 1), code: html.slice(end, close.index), name };
      result.raw.push(item);
      if (name === 'script') result.scripts.push(item);
      index = closeEnd;
    } else index = end;
  }
  return result;
}

export function validateScripts(html) {
  const layout = inspectHtml(html);
  if (layout.headEnd === null || layout.bodyEnd === null) throw new Error('Gerçek HTML head/body kapanışı bulunamadı.');
  for (const [index, script] of layout.scripts.entries()) {
    if (/\bsrc\s*=/i.test(script.attrs) || !script.code.trim()) continue;
    const type = /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(script.attrs);
    const kind = (type?.[1] ?? type?.[2] ?? type?.[3] ?? '').toLowerCase();
    if (['application/ld+json', 'application/json', 'importmap'].includes(kind)) {
      try { JSON.parse(script.code); } catch { throw new Error('HTML JSON betiği geçersiz: ' + (index + 1)); }
      continue;
    }
    if (kind && !['module', 'text/javascript', 'application/javascript'].includes(kind)) continue;
    const args = ['--check', '--input-type=' + (kind === 'module' ? 'module' : 'commonjs')];
    const checked = spawnSync(process.execPath, args, { input: script.code, encoding: 'utf8', maxBuffer: 256 * 1024, timeout: 30000 });
    if (checked.status !== 0 || checked.error) throw new Error('HTML JavaScript sözdizimi kontrolü başarısız: ' + (index + 1));
  }
  return layout;
}

function removeManaged(html, marker) {
  const comments = inspectHtml(html).comments;
  const starts = comments.filter(c => c.text === `<!-- ${marker}:start -->`);
  const ends = comments.filter(c => c.text === `<!-- ${marker}:end -->`);
  if (!starts.length && !ends.length) return html;
  if (starts.length !== 1 || ends.length !== 1 || starts[0].start >= ends[0].start) throw new Error('Dil bloğu işaretleri tutarsız.');
  return html.slice(0, starts[0].start) + html.slice(ends[0].end);
}

export function injectAtDocumentEnd(html, head, body) {
  const layout = inspectHtml(html);
  if (layout.headEnd === null || layout.bodyEnd === null || layout.headEnd >= layout.bodyEnd) throw new Error('Geçerli HTML head/body yapısı bulunamadı.');
  return html.slice(0, layout.headEnd) + head + html.slice(layout.headEnd, layout.bodyEnd) + body + html.slice(layout.bodyEnd);
}

export function repairKnownBundle(html) {
  const start = html.indexOf(XML_PREFIX);
  if (start < 0) return { html, head: '', body: '', repaired: false };
  const suffix = html.indexOf(XML_SUFFIX, start);
  if (suffix < 0) throw new Error('Bilinen HTML sarmalayıcısı tamamlanmamış.');
  const end = suffix + XML_SUFFIX.length;
  const region = html.slice(start, end);
  if (!region.includes('i18n system initialized')) return { html, head: '', body: '', repaired: false };
  if (html.indexOf(XML_PREFIX, start + XML_PREFIX.length) >= 0 || !region.includes('lang-switch-container')) throw new Error('Bilinen hasarlı HTML sarmalayıcısı tekil değil.');
  const head = /<!-- release-readiness:start -->[\s\S]*?<!-- release-readiness:end -->\n?/.exec(region)?.[0] ?? '';
  const footer = /<!-- release-legal-footer:start -->[\s\S]*?<!-- release-legal-footer:end -->\n?/.exec(region)?.[0] ?? '';
  const pwa = /\n  <script>\s*if \('serviceWorker' in navigator[\s\S]*?<\/script>\n?/.exec(region)?.[0] ?? '';
  const restored = XML_PREFIX + `</head><body>'+st+"` + XML_SUFFIX;
  return { html: html.slice(0, start) + restored + html.slice(end), head, body: footer + pwa, repaired: true };
}

export function prepareHtml(input, clientScript, languageSwitcher) {
  const repaired = repairKnownBundle(input);
  let html = removeManaged(removeManaged(repaired.html, HEAD_MARKER), BODY_MARKER);
  const head = repaired.head + `<!-- ${HEAD_MARKER}:start -->` + clientScript + `<!-- ${HEAD_MARKER}:end -->`;
  const body = repaired.body + `<!-- ${BODY_MARKER}:start -->` + languageSwitcher + `<!-- ${BODY_MARKER}:end -->`;
  html = injectAtDocumentEnd(html, head, body);
  validateScripts(html);
  return { html, repaired: repaired.repaired };
}
