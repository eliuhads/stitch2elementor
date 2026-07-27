const fs = require('fs');
const script = fs.readFileSync('inject_theme_templates.js', 'utf8');

// Extract HEADER_DATA and FOOTER_DATA using regex
const headerMatch = script.match(/const HEADER_DATA = (\[[\s\S]*?\n\]);/);
const footerMatch = script.match(/const FOOTER_DATA = (\[[\s\S]*?\n\]);/);

if (headerMatch) {
  eval('var hd = ' + headerMatch[1]);
  fs.writeFileSync('v9_json_payloads/header_template.json', JSON.stringify(hd));
  console.log('✅ Header JSON written, size:', JSON.stringify(hd).length);
} else {
  console.log('❌ Header not found');
}

if (footerMatch) {
  eval('var fd = ' + footerMatch[1]);
  fs.writeFileSync('v9_json_payloads/footer_template.json', JSON.stringify(fd));
  console.log('✅ Footer JSON written, size:', JSON.stringify(fd).length);
} else {
  console.log('❌ Footer not found');
}
