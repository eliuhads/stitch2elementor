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

    // Remove old INJECT_SECRET blocks
    content = content.replace(/\/\/ --- Authentication ---\s*\$token = isset\(\$_GET\['token'\]\) \? \$_GET\['token'\] : '';\s*\$expected = getenv\('INJECT_SECRET'\).*?\}\n/s, '');
    
    // Sometimes it's without "// --- Authentication ---"
    content = content.replace(/\$token = isset\(\\?\$_GET\['token'\]\) \? \\?\$_GET\['token'\] : '';\s*\$expected = getenv\('INJECT_SECRET'\).*?die\(json_encode\(\['success' => false, 'error' => 'Forbidden.*?\}\n/s, '');

    // Remove the WP_SCRIPT_TOKEN variants if they still exist (just in case)
    content = content.replace(/\$token = isset\(\\?\$_GET\['token'\]\) \? \\?\$_GET\['token'\] : '';\s*\$expected = getenv\('INJECT_SECRET'\) \?: \(defined\('WP_SCRIPT_TOKEN'\) \? WP_SCRIPT_TOKEN : ''\);\s*if \(empty\(\$token\).*?\}\n/s, '');

    // For scripts that just have the block directly without comment
    content = content.replace(/\$token = isset\(\$_GET\['token'\]\).*?die\(json_encode\(\['success' => false, 'error' => 'Forbidden.*?\}\n/s, '');

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Updated: ' + f);
    }
});
