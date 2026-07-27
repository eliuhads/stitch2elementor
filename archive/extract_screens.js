const fs = require('fs');
const path = require('path');

const stepsDir = path.join(
  'C:\\Users\\TEC\\.gemini\\antigravity\\brain\\f6eea6e1-3683-400b-bb37-42debc3366ef\\.system_generated\\steps'
);

const screens = [];

const stepDirs = fs.readdirSync(stepsDir)
  .filter(d => fs.statSync(path.join(stepsDir, d)).isDirectory())
  .sort((a, b) => parseInt(a) - parseInt(b));

for (const dir of stepDirs) {
  const outputFile = path.join(stepsDir, dir, 'output.txt');
  if (!fs.existsSync(outputFile)) continue;
  
  const content = fs.readFileSync(outputFile, 'utf8');
  if (!content.includes('htmlCode') || !content.includes('1852703175046546529')) continue;
  
  try {
    const data = JSON.parse(content);
    if (data.outputComponents) {
      for (const comp of data.outputComponents) {
        if (comp.design && comp.design.screens) {
          for (const screen of comp.design.screens) {
            screens.push({
              step: dir,
              id: screen.id,
              title: screen.title || 'Untitled',
              htmlUrl: screen.htmlCode?.downloadUrl || '',
              width: screen.width,
              height: screen.height
            });
          }
        }
      }
    }
  } catch (e) {
    // not valid JSON, skip
  }
}

console.log(`Found ${screens.length} screens:\n`);
screens.forEach((s, i) => {
  console.log(`${i+1}. [${s.id}] ${s.title} (step ${s.step})`);
});

// Save screen map
const mapFile = path.join(process.cwd(), 'screen_map.json');
fs.writeFileSync(mapFile, JSON.stringify(screens, null, 2));
console.log(`\nSaved to ${mapFile}`);
