const ftp = require("basic-ftp");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

async function uploadSVG() {
    const client = new ftp.Client();
    client.ftp.verbose = false;

    const host = process.env.FTP_HOST;
    const user = process.env.FTP_USER;
    const password = process.env.FTP_PASSWORD;

    try {
        console.log(`[FTP] Connecting to ${host}...`);
        await client.access({
            host: host,
            user: user,
            password: password,
            secure: false
        });
        
        const remoteDir = "/public_html/wp-content/uploads/2026/04/";
        console.log(`[FTP] Navigating to ${remoteDir}...`);
        await client.ensureDir(remoteDir);
        
        const localPath = path.join(__dirname, "INFO_BrandBook_Evegreen/LOGOS/logo_evergreen_rectangular_completo.svg");
        const fileName = "logo_evergreen_rectangular_completo.svg";
        
        console.log(`[FTP] Uploading ${fileName}...`);
        await client.uploadFrom(localPath, fileName);
        console.log(`[FTP] Upload successful: ${remoteDir}${fileName}`);
        
    } catch (err) {
        console.error("[FTP] Error:", err);
    } finally {
        client.close();
    }
}

uploadSVG();
