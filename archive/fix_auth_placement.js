const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
        const p = path.join(dir, file);
        if (fs.statSync(p).isDirectory()) {
            results = results.concat(walk(p));
        } else if (p.endsWith('.php') && file !== 'auth_helper.php') {
            results.push(p);
        }
    });
    return results;
}

walk('.').forEach(f => {
    if (f.includes('node_modules') || f.includes('mcp-servers') || f.includes('.agent')) return;
    
    let c = fs.readFileSync(f, 'utf8');
    if (c.includes('verify_api_token()')) {
        // Remove the existing auth block that might be at the top
        c = c.replace(/\$auth_path = file_exists\(__DIR__ \. '\/auth_helper\.php'\) \? __DIR__ \. '\/auth_helper\.php' : __DIR__ \. '\/\.\.\/auth_helper\.php';\nrequire_once\(\$auth_path\);\nverify_api_token\(\);\n*/g, '');
        c = c.replace(/require_once\(__DIR__ \. '\/(\.\.\/)*auth_helper\.php'\);\nverify_api_token\(\);\n*/g, '');
        
        // Find wp-load.php require
        const regex = /(require_once\([^)]*wp-load\.php'[^)]*\);\n*)/g;
        if (regex.test(c)) {
            // Insert after wp-load.php
            c = c.replace(regex, `$1\n$auth_path = file_exists(__DIR__ . '/auth_helper.php') ? __DIR__ . '/auth_helper.php' : __DIR__ . '/../auth_helper.php';\nrequire_once($auth_path);\nverify_api_token();\n\n`);
            fs.writeFileSync(f, c);
            console.log('Fixed ' + f);
        } else {
            console.log('Skipped (no wp-load.php): ' + f);
        }
    }
});
