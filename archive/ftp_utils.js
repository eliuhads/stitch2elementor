const ftp = require("basic-ftp");
const path = require("path");
const dotenv = require("dotenv");

// Load variables from .env
dotenv.config({ path: path.join(__dirname, ".env") });

async function uploadFileToFTP(localFilePath, remoteFileName = null) {
    const client = new ftp.Client();
    // client.ftp.verbose = true; // Uncomment for debugging

    const host = process.env.FTP_HOST;
    const user = process.env.FTP_USER;
    const password = process.env.FTP_PASSWORD;
    const remoteDir = process.env.FTP_REMOTE_PATH || "/public_html/";

    if (!host || !user || !password) {
        throw new Error("FTP credentials not found in veclas.env");
    }

    try {
        console.log(`[FTP] Connecting to ${host} as ${user}...`);
        await client.access({
            host: host,
            user: user,
            password: password,
            secure: true,
            secureOptions: { rejectUnauthorized: process.env.FTP_REJECT_UNAUTHORIZED !== 'false' }
        });
        
        console.log(`[FTP] Navigating to ${remoteDir}...`);
        await client.ensureDir(remoteDir);
        
        const fileName = remoteFileName || path.basename(localFilePath);
        console.log(`[FTP] Uploading ${path.basename(localFilePath)} to ${fileName}...`);
        
        await client.uploadFrom(localFilePath, fileName);
        console.log(`[FTP] Upload successful: ${fileName}`);
        
        return { success: true, remotePath: remoteDir + fileName };
    } catch (err) {
        console.error("[FTP] Error during FTP operation:", err.message);
        return { success: false, error: err.message };
    } finally {
        client.close();
    }
}

module.exports = {
    uploadFileToFTP
};
