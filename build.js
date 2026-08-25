/* Inlines styles.css + script.js into two self-contained outputs:
     dist/index.html    — standalone page, open it anywhere
     dist/artifact.html — body-only fragment for publishing as an Artifact
   Run: node build.js

   The document is split on its structural tags BEFORE any CSS or JS is
   inlined. That ordering matters: an earlier version inlined first and then
   searched the result for <body>, which meant the literal text "<body>"
   inside a stylesheet comment was picked up as the document's own body tag
   and half the stylesheet ended up in the fragment. Parse the source, then
   inline into the parts. */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const js = fs.readFileSync('script.js', 'utf8');

function section(name, source) {
  // greedy on purpose — the source document has exactly one of each, so this
  // takes the outermost pair rather than stopping at a lookalike inside it
  const m = source.match(new RegExp('<' + name + '>([\\s\\S]*)</' + name + '>'));
  if (!m) throw new Error('build.js: could not find <' + name + '> in index.html');
  return m[1];
}

const rawHead = section('head', html);
const rawBody = section('body', html);

const headInlined = rawHead.replace(
  '<link rel="stylesheet" href="styles.css">',
  '<style>\n' + css + '\n</style>'
);
const bodyInlined = rawBody.replace(
  '<script src="script.js"></script>',
  '<script>\n' + js + '\n</script>'
);

if (headInlined === rawHead) throw new Error('build.js: stylesheet link not found — did the href change?');
if (bodyInlined === rawBody) throw new Error('build.js: script tag not found — did the src change?');

fs.mkdirSync('dist', { recursive: true });

// 1. the standalone page, reassembled around the inlined parts
const standalone =
  '<!doctype html>\n<html lang="en">\n<head>' + headInlined + '</head>\n<body>' +
  bodyInlined + '</body>\n</html>\n';
fs.writeFileSync(path.join('dist', 'index.html'), standalone);

// 2. the fragment: title, font links, styles, then the body content — no shell
const styleBlock = headInlined.match(/<style>[\s\S]*<\/style>/)[0];
const links = rawHead
  .split('\n')
  .filter((l) => /<title|fonts\.googleapis|fonts\.gstatic/.test(l))
  .join('\n');
fs.writeFileSync(path.join('dist', 'artifact.html'), links + '\n' + styleBlock + '\n' + bodyInlined);

// sanity: the fragment must not carry a document shell, and must be smaller
const frag = fs.readFileSync(path.join('dist', 'artifact.html'), 'utf8');
['<html', '<head>', '<body'].forEach((t) => {
  if (frag.includes(t)) throw new Error('build.js: fragment still contains ' + t);
});
const a = fs.statSync('dist/index.html').size;
const b = fs.statSync('dist/artifact.html').size;
if (b >= a) throw new Error('build.js: fragment (' + b + ') is not smaller than the page (' + a + ')');

console.log('dist/index.html   ', a, 'bytes');
console.log('dist/artifact.html', b, 'bytes');
