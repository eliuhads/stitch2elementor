import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const c = new Client();
await c.access({ host: process.env.FTP_HOST, user: process.env.FTP_USER, password: process.env.FTP_PASS || process.env.FTP_PASSWORD, secure: false });

const tmpPath = path.join(ROOT, 'temp', 'post-1771-regen.css');
await c.downloadTo(tmpPath, '/public_html/wp-content/uploads/elementor/css/post-1771.css');
c.close();

const css = fs.readFileSync(tmpPath, 'utf8');
console.log('Size:', css.length);
console.log('Has body.elementor-page:', css.includes('body.elementor-page'));
console.log('Has Space Grotesk:', css.includes('Space Grotesk'));
console.log('Has #0E1320:', css.includes('0E1320'));
console.log('Has Work Sans:', css.includes('Work Sans'));
console.log('Has #76dc8a:', css.includes('76dc8a'));

const idx = css.indexOf('body.elementor-page');
if (idx > -1) {
  console.log('\nCustom CSS at char:', idx);
  console.log('Preview:', css.substring(idx, idx + 400));
} else {
  console.log('\n❌ body.elementor-page NOT found in generated CSS');
  // Check if custom_css content is embedded differently
  const idx2 = css.indexOf('Work Sans');
  if (idx2 > -1) {
    console.log('Work Sans found at:', idx2);
    console.log('Context:', css.substring(Math.max(0, idx2 - 100), idx2 + 200));
  }
}
