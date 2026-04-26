const ftp = require("basic-ftp");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function run() {
    const host = process.env.FTP_HOST || process.argv[2];
    const user = process.env.FTP_USER || process.argv[3];
    const password = process.env.FTP_PASSWORD || process.argv[4];
    const remotePath = process.env.FTP_REMOTE_PATH || process.argv[5] || "/public_html";
    const httpUrl = process.env.SITE_URL || process.argv[6];

    if (!host || !user || !password || !httpUrl) {
        console.error("❌ ERROR: Missing FTP credentials or SITE_URL. Please set in .env or pass as arguments.");
        console.error("Usage: node ftp_injector.js <host> <user> <password> <remote_path> <site_url>");
        process.exit(1);
    }

    const localPayloadsDir = path.resolve(process.cwd(), "v9_json_payloads");
    const localPHPFile = path.resolve(process.cwd(), "inject_all_pages.php");

    if (!fs.existsSync(localPayloadsDir)) {
        console.error(`❌ ERROR: Could not find local payloads dir at ${localPayloadsDir}`);
        process.exit(1);
    }

    if (!fs.existsSync(localPHPFile)) {
        console.error(`❌ ERROR: Could not find local PHP injector script at ${localPHPFile}`);
        process.exit(1);
    }

    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        console.log(`\n🔌 Connecting to FTP: ${host}...`);
        await client.access({
            host: host,
            user: user,
            password: password,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });

        console.log(`\n📂 Navigating to remote path: ${remotePath}...`);
        await client.cd(remotePath);

        // Upload JSON payloads
        console.log(`\n⬆️ Uploading 'v9_json_payloads' directory to remote server...`);
        const remotePayloadsDir = "v9_json_payloads";
        await client.ensureDir(remotePayloadsDir);
        await client.uploadFromDir(localPayloadsDir);
        await client.cd(".."); // return to root public_html

        // Upload PHP Script
        console.log(`\n⬆️ Uploading 'inject_all_pages.php' to the root...`);
        await client.uploadFrom(localPHPFile, "inject_all_pages.php");

        console.log(`\n✅ FTP Upload Complete.`);

        const triggerUrl = `${httpUrl.replace(/\/$/, '')}/inject_all_pages.php`;
        console.log(`\n=============================================================`);
        console.log(`🌐 ACCIÓN REQUERIDA (AUTENTICACIÓN WORDPRESS) 🌐`);
        console.log(`\nPara ejecutar la inyección con tus permisos de sesión WordPress,`);
        console.log(`abre exactamente el siguiente enlace en tu navegador (donde estés logueado):`);
        console.log(`\n👉 ${triggerUrl}`);
        console.log(`\n=============================================================`);

        // Wait for user to confirm they clicked the link
        const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout
        });

        await new Promise(resolve => {
            readline.question(`\n⚠️  PRESIONA [ENTER] SÓLO CUANDO HAYAS VISTO EL MENSAJE DE ÉXITO EN TU NAVEGADOR PARA ELIMINAR EL SCRIPT...\n`, () => {
                readline.close();
                resolve();
            });
        });

        // Cleanup
        console.log(`\n🧹 Reconectando al FTP para limpieza de seguridad...`);
        await client.access({
            host: host,
            user: user,
            password: password,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });
        await client.cd(remotePath);
        console.log(`🗑️ Deleting remote 'inject_all_pages.php'...`);
        await client.remove("inject_all_pages.php");
        console.log(`✅ Cleanup Complete. Exiting.`);

    } catch (err) {
        console.error(`\n❌ SCRIPT ERROR: ${err.message}`);
    } finally {
        client.close();
    }
}

run();
