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
 * Version: 5.2.0
 */

add_action('wp_head', function() {
    // 1. Enqueue Google Fonts & Material Symbols
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">';
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>';
    echo '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&family=Work+Sans:wght@300;400;700&display=swap" rel="stylesheet">';
    echo '<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet">';
    
    // 2. Enqueue Tailwind CDN
    echo '<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>';
    
    // 3. Inject precise Tailwind configuration mapping Brandbook design tokens
    echo '<script>
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "secondary-fixed": "#bbe9ff",
                        "graphite": "#374151",
                        "slate": "#6B7280",
                        "secondary-fixed-dim": "#60d4ff",
                        "paper-base": "#F8FAFC",
                        "on-secondary-fixed-variant": "#004d63",
                        "on-surface-variant": "#3f4a3e",
                        "on-tertiary": "#ffffff",
                        "on-primary-container": "#f7fff3",
                        "on-error": "#ffffff",
                        "secondary-container": "#53d2ff",
                        "on-primary-fixed": "#00210a",
                        "primary": "#006b2f",
                        "on-tertiary-fixed-variant": "#2c5000",
                        "border-light": "#E5E7EB",
                        "on-secondary-container": "#005870",
                        "primary-fixed": "#92f9a4",
                        "outline-variant": "#becabb",
                        "solar-copper": "#C07830",
                        "tertiary": "#3a6700",
                        "surface-tint": "#006d30",
                        "primary-fixed-dim": "#76dc8a",
                        "light-slate": "#94A3B8",
                        "surface-container": "#efecff",
                        "tertiary-fixed": "#aaf859",
                        "on-secondary": "#ffffff",
                        "primary-light": "#27A352",
                        "on-secondary-fixed": "#001f29",
                        "on-primary": "#ffffff",
                        "secondary": "#006782",
                        "on-tertiary-fixed": "#0e2000",
                        "background": "#fcf8ff",
                        "on-tertiary-container": "#f9ffeb",
                        "surface-container-high": "#e8e5ff",
                        "inverse-on-surface": "#f2efff",
                        "tertiary-container": "#4b8200",
                        "on-background": "#1a1a2e",
                        "titanium-dark": "#0E1320",
                        "tertiary-fixed-dim": "#90db3f",
                        "on-primary-fixed-variant": "#005322",
                        "inverse-primary": "#76dc8a",
                        "surface-container-low": "#f5f2ff",
                        "outline": "#6f7a6e",
                        "on-surface": "#1a1a2e",
                        "surface-variant": "#e2e0fc",
                        "error": "#ba1a1a",
                        "surface": "#fcf8ff",
                        "surface-container-highest": "#e2e0fc",
                        "surface-container-lowest": "#ffffff",
                        "on-error-container": "#93000a",
                        "surface-bright": "#fcf8ff",
                        "error-container": "#ffdad6",
                        "surface-dim": "#dad7f3",
                        "primary-container": "#168640",
                        "primary-dark": "#14692F",
                        "snow": "#F5F7FA",
                        "inverse-surface": "#2f2e43",
                        "charcoal": "#1A1A2E"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "gutter": "1.5rem",
                        "stack-md": "1rem",
                        "stack-lg": "2rem",
                        "container-max": "1140px",
                        "stack-sm": "0.5rem",
                        "section-padding-y": "5rem"
                    },
                    "fontFamily": {
                        "body-md": ["Work Sans", "sans-serif"],
                        "headline-xl": ["Montserrat", "sans-serif"],
                        "headline-md": ["Montserrat", "sans-serif"],
                        "headline-lg": ["Montserrat", "sans-serif"],
                        "body-sm": ["Work Sans", "sans-serif"],
                        "headline-xl-mobile": ["Montserrat", "sans-serif"],
                        "button": ["Montserrat", "sans-serif"],
                        "label-md": ["Montserrat", "sans-serif"],
                        "body-lg": ["Work Sans", "sans-serif"]
                    },
                    "fontSize": {
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "headline-xl": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "900" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "700" }],
                        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "700" }],
                        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "300" }],
                        "headline-xl-mobile": ["32px", { "lineHeight": "40px", "fontWeight": "900" }],
                        "button": ["16px", { "lineHeight": "20px", "fontWeight": "700" }],
                        "label-md": ["14px", { "lineHeight": "16px", "fontWeight": "500" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }]
                    }
                }
            }
        }
    </script>';
    
    // 4. Inject visual enhancement styles & 1140px global alignment constraints
    echo '<style>
        .material-symbols-outlined {
            font-family: \\\'Material Symbols Outlined\\\';
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-feature-settings: \\\'liga\\\';
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
