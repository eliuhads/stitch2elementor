const { Client } = require('basic-ftp');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(l => {
  const t = l.trim();
  if (!t || t.startsWith('#')) return;
  const i = t.indexOf('=');
  if (i === -1) return;
  let k = t.substring(0, i).trim();
  let v = t.substring(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[k] = v;
});

(async () => {
  const c = new Client();
  await c.access({ host: env.FTP_HOST, user: env.FTP_USER, password: env.FTP_PASSWORD, secure: false });

  console.log('=== ROOT ===');
  const rootList = await c.list('/');
  rootList.forEach(f => console.log(f.name, f.type === 2 ? '(dir)' : '', f.size || ''));

  console.log('\n=== ' + env.FTP_REMOTE_PATH + ' ===');
  const phList = await c.list(env.FTP_REMOTE_PATH);
  phList.filter(f => f.name.includes('inject') || f.name === 'wp-load.php' || f.name === 'wp-config.php' || f.name === '.htaccess' || f.name === 'index.php')
    .forEach(f => console.log(f.name, f.size + 'b'));

  c.close();
})().catch(e => console.error('ERROR:', e.message));
