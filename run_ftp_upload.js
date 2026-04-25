const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'veclas.env') });

async function uploadDir(client, localDir, remoteDir) {
    console.log(`[FTP] Creating remote dir: ${remoteDir}`);
    await client.ensureDir(remoteDir);
    await client.clearWorkingDir();
    
    const count = fs.readdirSync(localDir).length;
    console.log(`[FTP] Uploading ${count} files from ${localDir}...`);
    // Basic FTP uploadFromDir is amazing
    await client.uploadFromDir(localDir);
    await client.cd('/');
}

async function main() {
    const client = new ftp.Client();
    try {
        console.log(`[FTP] Connecting to ${process.env.FTP_HOST}...`);
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: false
        });

        await uploadDir(client, path.join(__dirname, 'v9_json_payloads'), '/v9_json_payloads');
        await uploadDir(client, path.join(__dirname, 'v9_images_temp'), '/wp-content/uploads/v9_images_temp');

        console.log(`[FTP] Uploading process_media.php...`);
        await client.uploadFrom(path.join(__dirname, 'process_media.php'), '/process_media.php');

        console.log("\n🎉 All assets uploaded successfully!");
        console.log("🔗 Executing soon via node...");
    } catch (e) {
        console.error("FTP Error: ", e);
    } finally {
        client.close();
    }
}

main();
