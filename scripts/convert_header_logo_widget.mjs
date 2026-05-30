import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const headerPath = path.join(ROOT, 'elementor_jsons/header.json');

if (!fs.existsSync(headerPath)) {
  console.error('❌ Header JSON not found!');
  process.exit(1);
}

const headerData = JSON.parse(fs.readFileSync(headerPath, 'utf8'));

// Helper function to recursively find and replace the logo widget
function convertLogoWidget(elements) {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.widgetType === 'theme-site-logo') {
      console.log('Found theme-site-logo widget. Converting to image widget...');
      elements[i] = {
        id: el.id || 'c6b7d037',
        elType: 'widget',
        widgetType: 'image',
        isInner: false,
        settings: {
          image: {
            url: 'https://evergreenvzla.com/wp-content/uploads/2026/05/Logo_evergreen_rectang_no_text_svg.svg',
            id: 15
          },
          image_size: 'full',
          align: 'left',
          link_to: 'custom',
          link: {
            url: 'https://evergreenvzla.com/',
            is_external: '',
            nofollow: '',
            custom_attributes: ''
          }
        },
        elements: []
      };
      return true;
    }
    if (el.elements && el.elements.length > 0) {
      if (convertLogoWidget(el.elements)) {
        return true;
      }
    }
  }
  return false;
}

const success = convertLogoWidget(headerData);

if (success) {
  fs.writeFileSync(headerPath, JSON.stringify(headerData), 'utf8');
  console.log('✅ Success: elementor_jsons/header.json updated.');
} else {
  console.log('⚠️ Logo widget not found or already converted.');
}
