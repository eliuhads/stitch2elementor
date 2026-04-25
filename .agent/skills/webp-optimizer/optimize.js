import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const inputFolder = process.argv[2] || '.';
const outputFolder = process.argv[3] || inputFolder;

async function processImages() {
  try {
    const files = await fs.readdir(inputFolder);
    const images = files.filter(file => /\.(png|jpe?g)$/i.test(file));
    
    if (images.length === 0) {
      console.log('No se encontraron imágenes JPG/PNG en el directorio especificado.');
      return;
    }
    
    // Check if output exists
    await fs.mkdir(outputFolder, { recursive: true });

    for (const file of images) {
      const inputPath = path.join(inputFolder, file);
      const filenameBase = path.parse(file).name;
      const outputPath = path.join(outputFolder, `${filenameBase}.webp`);
      
      console.log(`Convirtiendo ${file} a WebP...`);
      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 })
        .toFile(outputPath);
      console.log(`✅ Guardado en ${outputPath}`);
    }
  } catch (error) {
    console.error('Error al procesar imágenes:', error);
  }
}

processImages();
