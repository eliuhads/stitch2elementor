const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('stitch_html/calculadora-de-consumo-energ-tico.html', 'utf8');
const $ = cheerio.load(html, { decodeEntities: false });

// Expose the compiler internals to manually execute
const compilerSrc = fs.readFileSync('compiler_v4.js', 'utf8');
// This is a hacky way to run the local functions and see what they return for our img node
let extractContainerSettings, buildImage, processElement;
eval(compilerSrc.replace(/const fs = require.*/, '').replace(/htmlToElementorSegment/g, ''));

const imgNode = $('img').first()[0];
console.log('--- Processing Img Node ---');
const imgResult = processElement($, imgNode);
console.log(JSON.stringify(imgResult, null, 2));

const parentNode = $('img').first().parent()[0];
console.log('\n--- Processing Parent Node ---');
const parentResult = processElement($, parentNode);
console.log(JSON.stringify(parentResult, null, 2));
