/**
 * scripts/deploy_tailwind_global.mjs
 * 
 * Creates and deploys a global WordPress MU-Plugin that:
 * 1. Enqueues the Tailwind CSS CDN script and the specific theme configuration
 *    in the <head> of ALL pages to ensure Tailwind styles render properly.
 * 2. Injects the custom specific style rules (glass-panel, tech-grid-line, etc.) for the site.
 * 3. Safely clears LiteSpeed and Elementor caches using WordPress APIs.
 */

import { Client } from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '..', '.env'), override: true });
dotenv.config({ path: path.join(ROOT, '.env'), override: true });

const env = process.env;

const FTP_HOST = env.FTP_HOST;
const FTP_USER = env.FTP_USER;
const FTP_PASSWORD = env.FTP_PASSWORD || env.FTP_PASS;
const INJECT_SECRET = env.INJECT_SECRET;
const WP_URL = env.WP_URL || env.SITE_URL;

console.log('╔═════════════════════════════════════════════════════════════════╗');
console.log('║  DEPLOY TAILWIND GLOBAL — WordPress MU-Plugin Deployer          ║');
console.log('╚═════════════════════════════════════════════════════════════════╝\n');

if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD || !INJECT_SECRET || !WP_URL) {
  console.error('❌ Missing credentials in .env file!');
  process.exit(1);
}

// 1. Generate the MU-Plugin code
const muPluginContent = `<?php
/**
 * Plugin Name: Evergreen Global Tailwind & Parity override
 * Description: Dynamically injects Tailwind CSS CDN and custom theme layout rules in head.
 * Version: 5.1.0
 */

add_action('wp_head', function() {
    // 1. Enqueue Tailwind CDN
    echo '<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>';
    
    // 2. Inject precise Tailwind configuration mapping Brandbook design tokens
    echo '<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary": "#1D8A43",
                        "primary-dark": "#14692F",
                        "primary-light": "#27A352",
                        "on-background": "#1a1a2e",
                        "charcoal": "#1A1A2E",
                        "titanium-dark": "#0E1320",
                        "light-slate": "#94A3B8",
                        "border-light": "#E5E7EB",
                        "surface": "#fcf8ff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "container-max": "1140px",
                        "gutter": "1.5rem",
                        "section-padding-y": "8rem",
                        "stack-md": "1rem",
                        "stack-sm": "0.5rem",
                        "stack-lg": "2rem"
                    },
                    "fontFamily": {
                        "headline": ["Montserrat", "sans-serif"],
                        "body": ["Work Sans", "sans-serif"]
                    },
                    "fontSize": {
                        "headline-xl": ["64px", { "lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "900" }],
                        "headline-lg": ["40px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "headline-md": ["28px", { "lineHeight": "1.3", "fontWeight": "700" }]
                    }
                }
            }
        }
    </script>';
    
    // 3. Inject visual enhancement styles & 1140px global alignment constraints
    echo '<style>
        .material-symbols-outlined {
            font-variation-settings: \\\'FILL\\\' 0, \\\'wght\\\' 400, \\\'GRAD\\\' 0, \\\'opsz\\\' 24;
        }
        .material-symbols-outlined.fill {
            font-variation-settings: \\\'FILL\\\' 1;
        }
        .glass-panel {
            background: rgba(14, 19, 32, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .tech-grid-line {
            background: linear-gradient(90deg, rgba(29, 138, 67, 0) 0%, rgba(29, 138, 67, 0.5) 50%, rgba(29, 138, 67, 0) 100%);
        }
        
        /* 1140px Unification and margin alignment overrides */
        .elementor-location-header .e-con-boxed,
        .elementor-location-footer .e-con-boxed,
        body.elementor-page .max-w-container-max,
        body.elementor-page .max-w-7xl,
        body.elementor-page .lg\\:max-w-7xl {
            max-width: 1140px !important;
            margin-left: auto !important;
            margin-right: auto !important;
            width: 100% !important;
        }
        .elementor-location-header .e-con-boxed,
        .elementor-location-footer .e-con-boxed,
        body.elementor-page .max-w-container-max {
            padding-left: 24px !important;
            padding-right: 24px !important;
        }
    </style>';
}, 1);
`;

const localPluginPath = path.join(ROOT, 'temp/evergreen-tailwind-global.php');
fs.writeFileSync(localPluginPath, muPluginContent, 'utf8');

// 2. Generate the safe cache-flusher
const uniqueName = `wp_tailwind_flush_${Date.now()}.php`;
const flushPHP = `<?php
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403); die('forbidden');
}
header('Content-Type: application/json');
require_once(__DIR__ . '/wp-load.php');

delete_option('_elementor_global_css');
delete_option('elementor_remote_info_library');
if (function_exists('wp_cache_flush')) wp_cache_flush();

if (class_exists('LiteSpeed_Cache_API') && method_exists('LiteSpeed_Cache_API', 'purge_all')) {
    LiteSpeed_Cache_API::purge_all();
    $r = ['status' => 'success', 'litespeed' => 'purged_api'];
} else {
    do_action('litespeed_purge_all');
    $r = ['status' => 'success', 'litespeed' => 'action_fired'];
}

@unlink(__FILE__);
echo json_encode($r);
?>`;

const localFlushPath = path.join(ROOT, 'temp', uniqueName);
fs.writeFileSync(localFlushPath, flushPHP, 'utf8');

async function deploy() {
  const client = new Client();
  client.ftp.verbose = false;

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

    // 1. Upload MU-Plugin (using relative path to mu-plugins)
    const remotePluginPath = '/wp-content/mu-plugins/evergreen-tailwind-global.php';
    console.log(`📤 Uploading MU-Plugin to ${remotePluginPath}...`);
    await client.uploadFrom(localPluginPath, remotePluginPath);
    console.log('✅ MU-Plugin uploaded');

    // 2. Upload Cache Flusher
    console.log(`📤 Uploading Cache Flusher to /${uniqueName}...`);
    await client.uploadFrom(localFlushPath, uniqueName);
    console.log('✅ Cache Flusher uploaded');
    client.close();

    // 3. Trigger Cache Flush via HTTP
    const triggerUrl = `${WP_URL}/${uniqueName}?token=${INJECT_SECRET}`;
    console.log(`🚀 Executing cache flush: ${WP_URL}/${uniqueName}?token=***`);
    
    const response = await fetch(triggerUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cache-Control': 'no-cache, no-store',
      },
      signal: AbortSignal.timeout(30000),
    });

    const resultText = await response.text();
    console.log('📊 Result:', resultText);

    // Verify self-delete
    const c2 = new Client();
    await c2.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: true, secureOptions: { rejectUnauthorized: false } });
    const files = await c2.list('/');
    const stillExists = files.find(f => f.name === uniqueName);
    console.log(`\n🗑️ PHP self-deleted: ${stillExists ? '❌ STILL EXISTS' : '✅'}`);
    if (stillExists) {
      await c2.remove(uniqueName);
      console.log('   → Manually removed the script.');
    }
    c2.close();

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    try { fs.unlinkSync(localPluginPath); } catch {}
    try { fs.unlinkSync(localFlushPath); } catch {}
  }
}

deploy();
