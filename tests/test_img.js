const fs = require('fs');
const cheerio = require('cheerio');
const compiler = require('./compiler_v4.js');

const html = fs.readFileSync('stitch_html/calculadora-de-consumo-energ-tico.html', 'utf8');
const $ = cheerio.load(html);

console.log('Images in HTML:');
$('img').each((i, el) => {
  console.log(i, $(el).attr('class'), $(el).attr('src').substring(0, 50));
  
  // also let's manually invoke compiler's image matching logic if possible
  // we can't easily exports but we can just check parent
  console.log('  Parent classes:', $(el).parent().attr('class'));
});
