const fs = require('fs');
const jsonText = fs.readFileSync('elementor_json/calculadora-de-consumo-energ-tico.json', 'utf8');
const data = JSON.parse(jsonText);

let imagesFound = 0;
function findImages(nodes) {
  if (!nodes) return;
  for (const node of nodes) {
    if (node.widgetType === 'image' || node.elType === 'widget' && node.widgetType === 'image') {
      imagesFound++;
      console.log('Image Widget:', node.settings.image.url.substring(0, 50));
    }
    if (node.elements) {
      findImages(node.elements);
    }
  }
}

findImages(data.content);
console.log('Total img widgets in JSON:', imagesFound);
