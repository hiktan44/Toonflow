/**
 * Adds the interface-language bootstrap (head) and the language switch + localized legal
 * footer (end of body) to data/web/index.html. Idempotent: existing blocks are replaced.
 *
 * The 26 MB bundle embeds HTML templates inside JS strings, so the FIRST '</head>' / '</body>'
 * is inside a string literal. Always work on the LAST occurrence and slice (String.replace would
 * also interpret '$' patterns in the replacement).
 */
const fs = require('fs');
const path = require('path');

const INDEX = path.resolve(process.cwd(), 'data', 'web', 'index.html');
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8').trim() + '\n';

function between(html, start, end) {
  const s = html.lastIndexOf(start);
  if (s === -1) return null;
  const e = html.indexOf(end, s);
  return e === -1 ? null : [s, e + end.length];
}

function put(html, snippet, start, end, anchorTag, legacy) {
  let range = between(html, start, end);
  if (!range && legacy) range = between(html, legacy[0], legacy[1]);
  if (range) return html.slice(0, range[0]) + snippet.trim() + html.slice(range[1]);
  const at = html.lastIndexOf(anchorTag);
  if (at === -1) throw new Error(anchorTag + ' not found in index.html');
  return html.slice(0, at) + snippet + html.slice(at);
}

let html = fs.readFileSync(INDEX, 'utf8');
html = put(html, read('lang-snippet.html'), '<!-- toonflow-lang:start -->', '<!-- toonflow-lang:end -->', '</head>');
html = put(html, read('lang-footer.html'), '<!-- toonflow-lang-footer:start -->', '<!-- toonflow-lang-footer:end -->', '</body>',
  ['<!-- release-legal-footer:start -->', '<!-- release-legal-footer:end -->']);
fs.writeFileSync(INDEX, html);
console.log('language bootstrap injected into', INDEX);
