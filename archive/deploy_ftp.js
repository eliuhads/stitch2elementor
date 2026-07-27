const { uploadFileToFTP } = require("./ftp_utils");
const path = require("path");
const fs = require("fs");

async function main() {
    const targetFile = process.argv[2];
    
    if (!targetFile) {
        console.error("Uso: node deploy_ftp.js <archivo_a_subir>");
        console.error("Ejemplo: node deploy_ftp.js evergreen_robust_inject.php");
        process.exit(1);
    }

    const localPath = path.resolve(process.cwd(), targetFile);

    if (!fs.existsSync(localPath)) {
        console.error(`Error: El archivo no existe: ${localPath}`);
        process.exit(1);
    }

    console.log(`Iniciando despliegue FTP para: ${path.basename(localPath)}...`);
    const result = await uploadFileToFTP(localPath);
    
    if (result.success) {
        console.log(`✅ ¡Despliegue completado! El archivo fue actualizado en remoto.`);
    } else {
        console.error("❌ El despliegue falló.");
        process.exit(1);
    }
}

main();
