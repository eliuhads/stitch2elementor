#!/usr/bin/env python3
"""
elementor_schema_probe.py — Introspección y Regeneración del Esquema Real de Elementor.
Consulta la instalación real de WordPress vía Novamira MCP para actualizar la whitelist de widgets del linter.
"""

import os
import sys
import json
import argparse
import subprocess
from datetime import datetime, timezone
from pathlib import Path

WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_TARGETS = [
    os.path.join(WORKSPACE_ROOT, ".agents", "skills", "stitch2elementor", "scripts", "elementor_schema.json"),
    os.path.join(WORKSPACE_ROOT, "FLOYDIA", "SUBTOOLS", "STITCH2ELEMENTOR", "repo", "pipeline", "elementor_schema.json"),
    os.path.join(WORKSPACE_ROOT, "CLIENTES", "EVERGREEN_3.0", ".agent", "skills", "stitch2elementor", "pipeline", "elementor_schema.json"),
    os.path.join(WORKSPACE_ROOT, "CLIENTES", "EVERGREEN_3.0", ".agent", "github_sync", "stitch2elementor", "pipeline", "elementor_schema.json"),
]

MCP_REMOTE_BIN = "/home/tec/.npm-global/bin/mcp-wordpress-remote"
ENV_PATH = os.path.join(WORKSPACE_ROOT, ".env")

def get_env_var(var_name: str) -> str:
    val = os.environ.get(var_name, "")
    if val:
        return val
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith(f"{var_name}="):
                    val_str = line.split("=", 1)[1].strip().strip('"').strip("'")
                    return val_str
    return ""

def probe_elementor_installation() -> dict:
    api_url = get_env_var("CLIENT_WATTSAVER_NOVAMIRA_API_URL") or "https://wattsaver.com/wp-json/mcp/novamira"
    user = get_env_var("CLIENT_WATTSAVER_USER") or "admin"
    password = get_env_var("CLIENT_WATTSAVER_NOVAMIRA_APLIC_PASS") or get_env_var("CLIENT_WATTSAVER_PASS")
    
    env = os.environ.copy()
    env["WP_API_URL"] = api_url
    env["WP_API_USERNAME"] = user
    env["WP_API_PASSWORD"] = password
    
    cmd = [MCP_REMOTE_BIN] if os.path.exists(MCP_REMOTE_BIN) else ["mcp-wordpress-remote"]
    
    p = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )
    
    # 1. Initialize
    init_req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "schema_probe", "version": "1.0"}
        }
    }
    p.stdin.write(json.dumps(init_req) + "\n")
    p.stdin.flush()
    p.stdout.readline()
    
    # 2. Execute PHP probe
    php_code = """
    if (!class_exists('\\Elementor\\Plugin')) {
        return ['error' => 'Elementor plugin class not found'];
    }
    $widgets_manager = \\Elementor\\Plugin::$instance->widgets_manager;
    $widget_types = array_keys($widgets_manager->get_widget_types());
    sort($widget_types);
    return [
        'elementor_version' => ELEMENTOR_VERSION,
        'widget_types_count' => count($widget_types),
        'widget_types' => $widget_types
    ];
    """
    
    call_req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "mcp-adapter-execute-ability",
            "arguments": {
                "ability_name": "novamira/execute-php",
                "parameters": {
                    "code": php_code
                }
            }
        }
    }
    p.stdin.write(json.dumps(call_req) + "\n")
    p.stdin.flush()
    
    resp_line = p.stdout.readline()
    p.kill()
    
    if not resp_line:
        raise RuntimeError("No se recibió respuesta desde mcp-wordpress-remote")
        
    resp_json = json.loads(resp_line)
    result_content = resp_json.get("result", {}).get("content", [])
    if result_content and result_content[0].get("type") == "text":
        data_text = result_content[0].get("text", "")
        outer = json.loads(data_text)
        ret_val = outer.get("data", {}).get("return_value", {})
        return ret_val
        
    return {}

def main():
    parser = argparse.ArgumentParser(description="Introspecciona y regenera elementor_schema.json.")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra el resultado sin escribir")
    args = parser.parse_args()
    
    print("[*] Conectando a WordPress vía Novamira MCP...")
    try:
        data = probe_elementor_installation()
    except Exception as e:
        sys.stderr.write(f"ERROR al introspeccionar Elementor: {e}\n")
        sys.exit(1)
        
    version = data.get("elementor_version", "unknown")
    widget_types = data.get("widget_types", [])
    
    if not widget_types:
        sys.stderr.write("ERROR: No se obtuvieron widget_types de Elementor.\n")
        sys.exit(2)
        
    print(f"[✓] Versión de Elementor detectada: {version}")
    print(f"[✓] Widgets registrados: {len(widget_types)}")
    
    schema = {
        "_version_comment": f"Auto-generated by elementor_schema_probe.py from live Elementor {version}",
        "elementor_version": version,
        "probed_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "id_pattern": "^[a-f0-9]{7,8}$",
        "allowed_elTypes": ["container", "section", "column", "widget"],
        "allowed_widgetTypes": widget_types,
        "root_container_rules": {
            "boxed_width_min_px": 1140,
            "boxed_width_max_px": 1440
        },
        "dimension_rules_R4": {
            "logo_height_px": {"min": 36, "max": 56}
        }
    }
    
    if args.dry_run:
        print(json.dumps(schema, indent=2))
        sys.exit(0)
        
    for target in SCHEMA_TARGETS:
        p = Path(target)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
        print(f"[✓] Schema actualizado en: {target}")
        
    print("✓ Introspección completada con éxito.")
    sys.exit(0)

if __name__ == "__main__":
    main()
