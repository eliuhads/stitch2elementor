const fs = require('fs');
const map = JSON.parse(fs.readFileSync('screen_map.json', 'utf8'));
let phpArray = '[\n';
for (const item of map) {
    if (item.slug) {
        phpArray += `    ['slug' => '${item.slug}', 'title' => '${item.title.replace(/'/g, "\\'")}', 'file' => '${item.slug}.json'],\n`;
    }
}
phpArray += ']';

let php = fs.readFileSync('inject_all_pages.php', 'utf8');
php = php.replace(/\$pages = \[[^;]+\]/, '$pages = ' + phpArray);
fs.writeFileSync('inject_all_pages.php', php);
console.log('Updated inject_all_pages.php successfully.');
