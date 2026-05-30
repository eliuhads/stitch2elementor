/**
 * scripts/fix_trust_bar_labels.mjs
 * Corrects the Trust Bar inline style text color from white (#FFFFFF) to charcoal (#1A1A2E)
 * so it is perfectly readable on the light theme homepage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const jsonPath = path.join(ROOT, 'elementor_jsons/homepage.json');

if (!fs.existsSync(jsonPath)) {
  console.error(`❌ homepage.json not found at: ${jsonPath}`);
  process.exit(1);
}

let content = fs.readFileSync(jsonPath, 'utf8');

// Replace the inline white colors with dark charcoal in the Trust Bar elements
const originalStr = 'color:#FFFFFF;font-family:Montserrat,sans-serif;font-weight:600;font-size:12px;letter-spacing:2px;text-transform:uppercase;';
const replacedStr = 'color:#1A1A2E;font-family:Montserrat,sans-serif;font-weight:600;font-size:12px;letter-spacing:2px;text-transform:uppercase;';

let occurrences = 0;
while (content.includes(originalStr)) {
  content = content.replace(originalStr, replacedStr);
  occurrences++;
}

fs.writeFileSync(jsonPath, content, 'utf8');
console.log(`✅ Corrected ${occurrences} Trust Bar label style occurrences to dark charcoal in homepage.json.`);
