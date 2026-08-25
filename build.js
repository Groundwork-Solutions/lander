/* Inlines styles.css + script.js into two self-contained outputs:
     dist/index.html   — standalone page, open it anywhere
     dist/artifact.html — body-only fragment for publishing as an Artifact
   Run: node build.js */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const js = fs.readFileSync('script.js', 'utf8');

const inlined = html
  .replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')
  .replace('<script src="script.js"></script>', '<script>\n' + js + '\n</script>');

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', 'index.html'), inlined);

// Artifact fragment: keep <title>, the font link and the styles, drop the shell tags.
const head = inlined.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = inlined.match(/<body>([\s\S]*?)<\/body>/)[1];
const styleBlock = head.match(/<style>[\s\S]*?<\/style>/)[0];
const links = head
  .split('\n')
  .filter((l) => /<title|fonts\.googleapis|fonts\.gstatic/.test(l))
  .join('\n');

fs.writeFileSync(path.join('dist', 'artifact.html'), links + '\n' + styleBlock + '\n' + body);
console.log('dist/index.html', fs.statSync('dist/index.html').size, 'bytes');
console.log('dist/artifact.html', fs.statSync('dist/artifact.html').size, 'bytes');
