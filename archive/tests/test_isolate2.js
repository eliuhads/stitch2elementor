const fs = require('fs');
const cheerio = require('cheerio');
const compilerSrc = fs.readFileSync('compiler_v4.js', 'utf8');

// Instead of evaling locally, we can just require the compiler_v4
// and add a hook or expose it.
// The easiest way is to modify compiler_v4.js string and eval it globally.
const scriptToRun = compilerSrc 
  + `
const htmlTest = fs.readFileSync('stitch_html/calculadora-de-consumo-energ-tico.html', 'utf8');
const $test = cheerio.load(htmlTest, { decodeEntities: false });

const imgNode = $test('img').first()[0];
console.log('--- Processing Img Node ---');
const imgResult = processElement($test, imgNode);
console.log(JSON.stringify(imgResult, null, 2));

const parentNode = $test('img').first().parent()[0];
console.log('\\n--- Processing Parent Node ---');
const parentResult = processElement($test, parentNode);
console.log(JSON.stringify(parentResult, null, 2));
`;

try {
  eval(scriptToRun.replace(/const fs = require\('fs'\);/, ''));
} catch (e) {
  console.log(e);
}
