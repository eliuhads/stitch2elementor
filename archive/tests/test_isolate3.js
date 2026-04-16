const fs = require('fs');
const cheerio = require('cheerio');
const compilerSrc = fs.readFileSync('compiler_v4.js', 'utf8');

const scriptToRun = compilerSrc 
  + `
const htmlTest = fs.readFileSync('stitch_html/calculadora-de-consumo-energ-tico.html', 'utf8');
const $test = cheerio.load(htmlTest, { decodeEntities: false });

const imgNode = $test('img').first();
console.log('--- Processing Img Node ---');
const imgResult = processElement($test, imgNode[0]);
// console.log(imgResult ? "IMG PASS" : "IMG FAIL");

const parentNode = imgNode.parent();
console.log('\\n--- Processing Parent Node ---');
const parentResult = processElement($test, parentNode[0]);
// console.log(parentResult ? "PARENT PASS" : "PARENT FAIL");

const p2 = parentNode.parent();
const p2Result = processElement($test, p2[0]);
console.log(p2Result ? "P2 PASS : " + p2Result.elements.length : "P2 FAIL");

const p3 = p2.parent();
const p3Result = processElement($test, p3[0]);
console.log(p3Result ? "P3 PASS : " + p3Result.elements.length : "P3 FAIL");

const p4 = p3.parent();
const p4Result = processElement($test, p4[0]);
console.log(p4Result ? "P4 PASS : " + p4Result.elements.length : "P4 FAIL");

function jsonHasImg(node) {
  if (!node) return false;
  if (Array.isArray(node)) return node.some(jsonHasImg);
  if (node.widgetType === 'image') return true;
  if (node.elements) return node.elements.some(jsonHasImg);
  return false;
}

console.log("P2 has img:", jsonHasImg(p2Result));
console.log("P3 has img:", jsonHasImg(p3Result));
console.log("P4 has img:", jsonHasImg(p4Result));

// wait, how is it disappearing during the full compile?
// let's do processSection 
const section = p4.closest('section');
if (section.length > 0) {
    const secResult = processSection($test, section[0], false);
    console.log("Section has img:", jsonHasImg(secResult));
}
`;

try {
  eval(scriptToRun.replace(/const fs = require\('fs'\);/, ''));
} catch (e) {
  console.log(e);
}
