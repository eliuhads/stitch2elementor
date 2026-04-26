const fs = require('fs');
const path = require('path');

const files = [
    'scripts/fix_500_schema.php',
    'scripts/fix_500_nuclear.php',
    'scripts/fase3_og_config.php',
    'scripts/fase2_schema_og.php',
    'scripts/fase2_patch_comercial.php',
    'scripts/fase2_alt_media.php',
    'scripts/diagnose_500.php',
    'scripts/deep_diagnose.php',
    'scripts/seo_injector_native.php',
    'scripts/rankmath_installer.php',
    'scripts/patch_encoding_title.php'
];

files.forEach(f => {
    if(!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');
    let original = content;

    // A very loose regex targeting $secret = isset($_GET['secret'])
    let regex1 = /\$secret = isset\(\\?\$_GET\['secret'\]\).*?die\(json_encode\(\['success' => false, 'error' => 'Forbidden'\]\)\);\s*\}/s;
    content = content.replace(regex1, '');
    
    // Another variation
    let regex2 = /\$expected = getenv\('INJECT_SECRET'\) \?: \(defined\('WP_SCRIPT_TOKEN'\) \? WP_SCRIPT_TOKEN : ''\);/g;
    content = content.replace(regex2, '');

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Updated: ' + f);
    }
});
