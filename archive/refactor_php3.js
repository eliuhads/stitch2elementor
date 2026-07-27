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

    // Remove the authentication block. We find where it starts and where it ends.
    // Usually starts with "$token = isset($_GET['token'])" or "// --- Authentication ---"
    // and ends with "die(json_encode(...));\n}"
    
    // Pattern 1: With the file_exists fallback
    let p1 = /\/\/ --- Authentication ---\s*\$token = isset\(\\?\$_GET\['token'\]\) \? \\?\$_GET\['token'\] : '';\s*\$expected = .*?\s*if \(empty\(\$expected\)\) \{\s*\/\/ Try reading.*?\}\s*\}\s*if \(empty\(\$token\) \|\| empty\(\$expected\).*?die\(json_encode\(\['success' => false, 'error' => 'Forbidden.*?\}\n/s;
    content = content.replace(p1, '');

    // Pattern 2: Without the fallback
    let p2 = /\$token = isset\(\\?\$_GET\['token'\]\) \? \\?\$_GET\['token'\] : '';\s*\$expected = .*?\s*if \(empty\(\$token\).*?die\(json_encode\(\['success' => false, 'error' => 'Forbidden.*?\}\n/s;
    content = content.replace(p2, '');

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Updated: ' + f);
    }
});
