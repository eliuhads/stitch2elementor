#!/usr/bin/env bash
# s2e_deploy.sh — stitch2elementor v27 · E4 (transporte Out-of-Band R23)
# Uso: ./s2e_deploy.sh <payload.json> <post_id>
# El payload debe estar ya subido a /uploads/s2e_payloads/ en el servidor.
set -euo pipefail
PAYLOAD="${1:?falta payload}"; POST_ID="${2:?falta post_id}"
SHA=$(sha256sum "$PAYLOAD" | awk '{print $1}')
BASE=$(basename "$PAYLOAD")
echo "sha256 local: $SHA"
echo "==> Ejecutar vía novamira/run-wp-cli:"
echo "wp eval \"var_dump(s2e_deploy((int)$POST_ID, 'wp-content/uploads/s2e_payloads/$BASE', '$SHA'));\""
echo "==> Si el retorno no es 'deployed', NO continuar: revisar hash/ruta."
