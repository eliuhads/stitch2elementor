/**
 * scripts/verify_ftp_images.mjs
 * 
 * Lists all uploaded stitch WebP images in the remote /wp-content/uploads/stitch/
 * directory to verify if any media asset is missing.
 */

import { Client } from 'basic-ftp';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '..', '.env'), override: true });
dotenv.config({ path: path.join(ROOT, '.env'), override: true });

const env = process.env;

const FTP_HOST = env.FTP_HOST;
const FTP_USER = env.FTP_USER;
const FTP_PASSWORD = env.FTP_PASSWORD || env.FTP_PASS;

if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
  console.error('❌ Missing credentials!');
  process.exit(1);
}

async function run() {
  const client = new Client();
  try {
    console.log(`🔗 Connecting to FTP: ${FTP_HOST}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: true,
      secureOptions: { rejectUnauthorized: false }
    });
    console.log('✅ FTP connected');

    const remoteDir = '/wp-content/uploads/stitch/';
    console.log(`📂 Listing files in remote directory: ${remoteDir}...`);
    
    let list = [];
    try {
      list = await client.list(remoteDir);
    } catch (e) {
      console.log('❌ Stitch upload directory does not exist or is empty!');
      client.close();
      process.exit(0);
    }
    
    console.log(`\n📊 Found ${list.length} files:`);
    console.log('═══════════════════════════════════════════════════════');
    list.forEach(file => {
      console.log(`  - ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    });
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.close();
  }
}

run();
