const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file.includes('.agent') || file.includes('mcp-servers')) return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.endsWith('.php') && file !== 'auth_helper.php') {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk('.');

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    // A very loose regex: find from // --- Authentication --- up to the first die(json_encode(...)); }
    let regex1 = /\/\/ --- Authentication ---[\s\S]*?die\(json_encode\(\['success' => false, 'error' => 'Forbidden — invalid or missing token'\]\)\);\s*\}/g;
    content = content.replace(regex1, '');
    
    // Also remove the alternate version used in some scripts without the comment:
    let regex2 = /\$token = isset\(\$_GET\['token'\]\) \? \$_GET\['token'\] : '';\s*\$expected = getenv\('INJECT_SECRET'\)[\s\S]*?die\(json_encode\(\['success' => false, 'error' => 'Forbidden — invalid or missing token'\]\)\);\s*\}/g;
    content = content.replace(regex2, '');
    
    // Another variant checking WP_SCRIPT_TOKEN
    let regex3 = /\$token = isset\(\$_GET\['token'\]\) \? \$_GET\['token'\] : '';\s*\$expected = getenv\('INJECT_SECRET'\)[\s\S]*?die\(json_encode\(\['error' => 'Forbidden — invalid or missing token\.'\]\)\);\s*\}/g;
    content = content.replace(regex3, '');

    // A variant for scripts/fix_500_schema.php
    let regex4 = /\$expected = getenv\('INJECT_SECRET'\) \?: \(defined\('WP_SCRIPT_TOKEN'\) \? WP_SCRIPT_TOKEN : ''\);[\s\S]*?die\(json_encode\(\['success' => false, 'error' => 'Forbidden — invalid or missing token'\]\)\);\s*\}/g;
    content = content.replace(regex4, '');

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Updated: ' + f);
    }
});
