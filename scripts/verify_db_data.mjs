#!/usr/bin/env node
/**
 * verify_db_data.mjs
 * Verifica directamente en la DB si _elementor_data ya fue actualizado
 */
import 'dotenv/config';
import { Client } from 'basic-ftp';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const WP_URL = process.env.WP_URL;
const FTP_HOST = process.env.FTP_HOST;
const FTP_USER_FTP = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD || process.env.FTP_PASS;
const INJECT_SECRET = process.env.INJECT_SECRET || process.env.WP_SCRIPT_TOKEN;

const BANNED = ['solar', 'fotovoltaic', 'fotoceld', 'monocristalino', 'bifacial', 'albedo'];
const PAGE_IDS = [1668, 1666, 1665, 1660, 1651];

const PHP_SCRIPT = `<?php
header('Content-Type: application/json');
if (!isset($_GET['token']) || $_GET['token'] !== '${INJECT_SECRET}') {
    http_response_code(403);
    die(json_encode(['error' => 'Unauthorized']));
}
require_once(__DIR__ . '/wp-load.php');

$pages = [${PAGE_IDS.join(',')}];
$banned = ${JSON.stringify(BANNED)};
$results = [];

foreach ($pages as $pid) {
    $data = get_post_meta($pid, '_elementor_data', true);
    $title = get_the_title($pid);
    $found = [];
    
    if ($data) {
        $lower = strtolower($data);
        foreach ($banned as $term) {
            $count = substr_count($lower, $term);
            if ($count > 0) {
                // Find context
                $pos = strpos($lower, $term);
                $ctx = substr($data, max(0, $pos - 30), strlen($term) + 60);
                $found[] = ['term' => $term, 'count' => $count, 'context' => $ctx];
            }
        }
    }
    
    $results[$pid] = [
        'title' => $title,
        'data_length' => strlen($data),
        'clean' => empty($found),
        'issues' => $found
    ];
}

@unlink(__FILE__);
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
`;

async function main() {
  console.log('━━━ Verificando datos directamente en la DB ━━━\n');
  const client = new Client();
  const scriptName = 'evg-verify-db.php';
  const localPath = join(process.cwd(), 'temp', scriptName);

  try {
    writeFileSync(localPath, PHP_SCRIPT);
    await client.access({ host: FTP_HOST, user: FTP_USER_FTP, password: FTP_PASSWORD, secure: false });
    await client.cd('/');
    await client.uploadFrom(localPath, scriptName);

    const resp = await fetch(`${WP_URL}/${scriptName}?token=${INJECT_SECRET}`);
    const result = await resp.json();

    for (const [pid, info] of Object.entries(result)) {
      console.log(`Page ${pid}: ${info.title}`);
      if (info.clean) {
        console.log('  ✅ DB LIMPIA');
      } else {
        for (const issue of info.issues) {
          console.log(`  ❌ "${issue.term}" ×${issue.count}: ...${issue.context}...`);
        }
      }
    }
  } catch(err) {
    console.error(err.message);
    try { await client.cd('/'); await client.remove(scriptName); } catch(e) {}
  } finally {
    client.close();
    try { unlinkSync(localPath); } catch(e) {}
  }
}

main().catch(console.error);
