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
let authLogic = `require_once(__DIR__ . '/auth_helper.php');
verify_api_token();

`;

// Different scripts are nested differently. If they are in archive/ or scripts/, __DIR__ is different.
function getAuthLogic(filePath) {
    const depth = filePath.split(path.sep).length - 1;
    let relativePath = "'.'";
    if (depth === 1) relativePath = "dirname(__DIR__)";
    else if (depth === 2) relativePath = "dirname(dirname(__DIR__))";
    
    // Simplest way is to just use standard path traversal string
    let backStr = '';
    for(let i=0; i<depth; i++) backStr += '../';
    
    return `require_once(__DIR__ . '/${backStr}auth_helper.php');
verify_api_token();

`;
}


files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    // Remove old auth blocks
    content = content.replace(/\/\/ ============================================================\s*\/\/ SECURITY: Token-based authentication\s*\/\/ ============================================================\s*\$expected_token.*?; \}\s*\$provided_token.*?; \}\s*\/\/ ============================================================/g, '');
    
    // Remove the other old auth block format
    content = content.replace(/\$provided = isset\(\\?\$_GET\['secret'\]\).*?wp_die\('Unauthorized'\);\s*\}/s, '');
    content = content.replace(/\$expected_token = defined\('WP_SCRIPT_TOKEN'\).*?die\(json_encode\(\['error' => 'Server misconfiguration.*?\}\s*\$provided_token = isset\(\\?\$_GET\['token'\]\).*?die\(json_encode\(\['error' => 'Forbidden.*?\}\n?/s, '');

    // Check if we already inserted the helper
    if (!content.includes('verify_api_token()')) {
        // Insert right after <?php
        content = content.replace(/^<\?php\s*/, '<?php\n' + getAuthLogic(f));
    }
    
    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Updated: ' + f);
    }
});
