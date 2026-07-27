const fs = require('fs');
const https = require('https');
const path = require('path');

const outputDir = path.join(__dirname, 'assets_originales');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const steps = [302, 306, 310, 314, 318];
const pageNames = ['homepage', 'nosotros', 'soluciones-solares', 'iluminacion-led', 'proyectos'];

steps.forEach((step, index) => {
  const filePath = `C:/Users/TEC/.gemini/antigravity/brain/7b6402b9-00f7-4549-970a-49c9ed8598fa/.system_generated/steps/${step}/output.txt`;
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const screens = data.outputComponents.find(c => c.design)?.design?.screens;
      if (screens && screens.length > 0) {
        const downloadUrl = screens[0].htmlCode.downloadUrl;
        const pageName = pageNames[index];
        const dest = path.join(outputDir, pageName + '.html');
        
        console.log(`Downloading ${pageName} from ${downloadUrl}`);
        https.get(downloadUrl, (response) => {
          const file = fs.createWriteStream(dest);
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Saved ${pageName}.html`);
          });
        }).on('error', (err) => {
          console.error(`Error downloading ${pageName}:`, err);
        });
      } else {
        console.error('No screens found for step ' + step);
      }
    } catch (e) {
      console.error('Error processing step ' + step, e.message);
    }
  } else {
    console.error('File not found: ' + filePath);
  }
});
