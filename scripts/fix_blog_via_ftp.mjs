#!/usr/bin/env node
/**
 * fix_blog_via_ftp.mjs
 * Uploads a mu-plugin that registers _elementor_data as REST-editable,
 * then updates the page, then removes the mu-plugin.
 */
import 'dotenv/config';
import { Client } from 'basic-ftp';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const WP_URL  = process.env.WP_URL;
const WP_USER = process.env.WP_USER;
const WP_PASS = process.env.WP_APP_PASSWORD?.replace(/"/g, '');
const AUTH = 'Basic ' + Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
const headers = { 'Authorization': AUTH, 'Content-Type': 'application/json' };

const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS;
const FTP_REMOTE_PATH = process.env.FTP_REMOTE_PATH;

const MU_PLUGIN_CONTENT = `<?php
/**
 * Plugin Name: Temp Elementor Meta Fix
 * Description: Temporarily registers _elementor_data as REST-editable
 */
add_action('init', function() {
    register_post_meta('page', '_elementor_data', [
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function() { return current_user_can('edit_posts'); }
    ]);
});
`;

async function main() {
  console.log('━━━ Fix Blog Page 1664 via FTP + REST ━━━\n');

  const client = new Client();
  const muPluginPath = `${FTP_REMOTE_PATH}/wp-content/mu-plugins`;
  const pluginFile = 'temp-elementor-meta-fix.php';
  const localPath = join(process.cwd(), 'temp', pluginFile);

  try {
    // 1. Write plugin locally
    writeFileSync(localPath, MU_PLUGIN_CONTENT);
    console.log('📝 Plugin temporal creado localmente');

    // 2. Upload via FTP
    console.log(`📤 Conectando a FTP ${FTP_HOST}...`);
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: false });
    
    // Ensure mu-plugins dir exists
    try { await client.ensureDir(muPluginPath); } catch(e) { /* exists */ }
    await client.cd(muPluginPath);
    await client.uploadFrom(localPath, pluginFile);
    console.log('✅ mu-plugin subido');

    // 3. Wait for WP to load the plugin
    await new Promise(r => setTimeout(r, 2000));

    // 4. Now try updating the page via REST
    console.log('📡 Actualizando página 1664 via REST...');
    const { readFileSync } = await import('fs');
    const fixedData = readFileSync('temp/blog_1664_fixed_elementor_data.json', 'utf8');

    const resp = await fetch(`${WP_URL}/wp-json/wp/v2/pages/1664`, {
      method: 'POST', headers,
      body: JSON.stringify({ meta: { _elementor_data: fixedData } })
    });

    if (resp.ok) {
      console.log('✅ Página 1664 actualizada exitosamente!');
    } else {
      const err = await resp.text();
      console.log(`❌ Error: ${resp.status} — ${err.slice(0, 300)}`);
    }

    // 5. Remove the mu-plugin
    console.log('🧹 Removiendo mu-plugin temporal...');
    await client.remove(pluginFile);
    console.log('✅ mu-plugin removido');

  } catch (err) {
    console.error(`Error: ${err.message}`);
  } finally {
    client.close();
    try { unlinkSync(localPath); } catch(e) {}
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
