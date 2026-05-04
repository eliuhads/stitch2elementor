#!/usr/bin/env node
/**
 * Quick FTP directory explorer
 */
import 'dotenv/config';
import { Client } from 'basic-ftp';

const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS;
const FTP_REMOTE_PATH = process.env.FTP_REMOTE_PATH;

async function main() {
  const client = new Client();
  await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: false });
  
  // Check root
  console.log('=== FTP ROOT ===');
  let list = await client.list('/');
  for (const f of list) console.log(`  ${f.type === 2 ? '📁' : '📄'} ${f.name}`);
  
  // Check FTP_REMOTE_PATH
  console.log(`\n=== ${FTP_REMOTE_PATH} ===`);
  await client.cd(FTP_REMOTE_PATH);
  list = await client.list();
  const wpFiles = list.filter(f => f.name.startsWith('wp-') || f.name === 'index.php');
  for (const f of wpFiles) console.log(`  ${f.type === 2 ? '📁' : '📄'} ${f.name}`);
  
  // Check current PWD
  const pwd = await client.pwd();
  console.log(`\nPWD: ${pwd}`);
  
  // Check if wp-load.php exists anywhere
  const hasWpLoad = list.find(f => f.name === 'wp-load.php');
  console.log(`wp-load.php in ${FTP_REMOTE_PATH}: ${!!hasWpLoad}`);
  
  // Maybe it's in a subdomain or subfolder
  const dirs = list.filter(f => f.type === 2);
  console.log('\nSubdirectories:');
  for (const d of dirs.slice(0, 15)) {
    console.log(`  📁 ${d.name}/`);
    try {
      const sub = await client.list(`${FTP_REMOTE_PATH}/${d.name}`);
      const subWp = sub.find(f => f.name === 'wp-load.php');
      if (subWp) console.log(`     ✅ wp-load.php FOUND HERE!`);
    } catch(e) {}
  }

  client.close();
}

main().catch(console.error);
