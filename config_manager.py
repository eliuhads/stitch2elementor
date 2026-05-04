#!/usr/bin/env python3
"""
LiteLLM Config Manager — Interfaz web para gestionar modelos y pesos
Puerto: 4001   Acceso: http://IP_LXC:4001
"""

import os, json, yaml, subprocess, shutil, datetime, requests
from flask import Flask, request, jsonify, render_template_string

app = Flask(__name__)

CONFIG_PATH = "/home/litellm/litellm-proxy/config.yaml"
ENV_PATH    = "/home/litellm/litellm-proxy/.env"
BACKUP_DIR  = "/home/litellm/litellm-proxy/backups"
LITELLM_URL = "http://localhost:4000"

os.makedirs(BACKUP_DIR, exist_ok=True)

# ── Modelos gratuitos verificados (Abril 2026) ──────────────────────────────
KNOWN_MODELS = [
    # OpenRouter — Gratis y activos
    {"model": "openrouter/openai/gpt-oss-120b:free",               "name": "GPT-OSS 120B (OpenAI open-weight)",   "provider": "openrouter", "free": True,  "ctx": 131072,  "score": 90, "tier": "S", "in_price": 0, "out_price": 0, "why": "18 providers, el más resiliente free"},
    {"model": "openrouter/mistralai/devstral-2512:free",            "name": "Devstral 2512 ⚠️ ya no free",        "provider": "openrouter", "free": False, "ctx": 262144,  "score": 50, "tier": "C", "in_price": 0, "out_price": 0, "why": "⚠️ Período gratuito terminado — no usar"},
    {"model": "openrouter/qwen/qwen3-coder:free",                   "name": "Qwen3-Coder 480B",                    "provider": "openrouter", "free": True,  "ctx": 262144,  "score": 87, "tier": "A", "in_price": 0, "out_price": 0, "why": "480B params, ID estable"},
    {"model": "openrouter/deepseek/deepseek-r1:free",               "name": "DeepSeek R1 Free",                    "provider": "openrouter", "free": True,  "ctx": 131072,  "score": 85, "tier": "A", "in_price": 0, "out_price": 0, "why": "Razonamiento chain-of-thought — inestable"},
    {"model": "openrouter/meta-llama/llama-4-maverick:free",        "name": "Llama 4 Maverick Free",               "provider": "openrouter", "free": True,  "ctx": 1048576, "score": 82, "tier": "A", "in_price": 0, "out_price": 0, "why": "1M ctx, robusto"},
    {"model": "openrouter/google/gemma-3-27b-it:free",              "name": "Gemma 3 27B",                         "provider": "openrouter", "free": True,  "ctx": 131072,  "score": 72, "tier": "B", "in_price": 0, "out_price": 0, "why": "Fallback ligero de Google"},
    {"model": "openrouter/openrouter/free",                         "name": "OpenRouter Auto-Free",                "provider": "openrouter", "free": True,  "ctx": 200000,  "score": 70, "tier": "B", "in_price": 0, "out_price": 0, "why": "Meta-router, nunca da 404"},
    # Groq — Gratis siempre (LPU ultrarrápido)
    {"model": "groq/llama-3.3-70b-versatile",                       "name": "Llama 3.3 70B Versatile",            "provider": "groq",       "free": True,  "ctx": 128000,  "score": 88, "tier": "S", "in_price": 0, "out_price": 0, "why": "~6000 tok/s, confirmado estable ✅"},
    {"model": "groq/llama-3.1-70b-versatile",                       "name": "Llama 3.1 70B Versatile",            "provider": "groq",       "free": True,  "ctx": 128000,  "score": 78, "tier": "B", "in_price": 0, "out_price": 0, "why": "Fallback estable en Groq"},
    {"model": "groq/llama-3.1-8b-instant",                          "name": "Llama 3.1 8B Instant",               "provider": "groq",       "free": True,  "ctx": 128000,  "score": 65, "tier": "C", "in_price": 0, "out_price": 0, "why": "Muy rápido, menor calidad — fallback"},
    {"model": "groq/compound-beta",                                  "name": "Compound Beta (Groq agéntico)",       "provider": "groq",       "free": True,  "ctx": 128000,  "score": 80, "tier": "A", "in_price": 0, "out_price": 0, "why": "Diseñado para agentes como Cline"},
    # Gemini — Free tier (2 RPM, quota diaria baja)
    {"model": "gemini/gemini-2.5-pro",                              "name": "Gemini 2.5 Pro",                      "provider": "gemini",     "free": True,  "ctx": 1048576, "score": 92, "tier": "S", "in_price": 0, "out_price": 0, "why": "1M ctx — quota diaria muy baja"},
    {"model": "gemini/gemini-2.0-flash",                            "name": "Gemini 2.0 Flash",                    "provider": "gemini",     "free": True,  "ctx": 1048576, "score": 75, "tier": "B", "in_price": 0, "out_price": 0, "why": "Más cuota free, menor calidad"},
    # OpenRouter — De pago (referencia)
    {"model": "openrouter/anthropic/claude-3.5-sonnet",             "name": "Claude 3.5 Sonnet (PAGO)",            "provider": "openrouter", "free": False, "ctx": 200000,  "score": 95, "tier": "S", "in_price": 3.0,  "out_price": 15.0,  "why": "El mejor para coding — requiere créditos"},
    {"model": "openrouter/deepseek/deepseek-r1",                    "name": "DeepSeek R1 (PAGO)",                  "provider": "openrouter", "free": False, "ctx": 131072,  "score": 90, "tier": "S", "in_price": 0.55, "out_price": 2.19,  "why": "Razonamiento top, costo bajo"},
]

ROUTER_DEFAULTS = {
    "routing_strategy": "simple-shuffle",
    "num_retries": 3,
    "timeout": 60,
    "retry_after": 0,
    "allowed_fails": 2,
    "cooldown_time": 60
}

LITELLM_DEFAULTS = {
    "num_retries": 3,
    "request_timeout": 120,
    "drop_params": True,
    "set_verbose": False
}

# ── Helpers ─────────────────────────────────────────────────────────────────

HOOK_PATH = "/home/litellm/litellm-proxy/strip_images_callback.py"

# ── Pre-call hook: elimina imágenes de mensajes para modelos sin visión ──────
# LiteLLM envía el contenido como lista [{type:"image_url",...},{type:"text",...}]
# cuando Cline adjunta screenshots. Groq y la mayoría de modelos free NO aceptan
# ese formato → 400 "messages[1].content must be a string".
# Este hook convierte la lista a string de texto puro antes del envío.
STRIP_IMAGES_HOOK = '''
from litellm.integrations.custom_logger import CustomLogger

VISION_MODELS = {
    "gemini/gemini-2.5-pro",
    "gemini/gemini-2.0-flash",
    "openrouter/meta-llama/llama-4-maverick:free",
    "openrouter/anthropic/claude-3.5-sonnet",
    "openrouter/anthropic/claude-3.5-sonnet:beta",
}

class StripImagesForNonVisionModels(CustomLogger):
    """Convierte content-list a string para modelos que no soportan imágenes."""

    async def async_pre_call_hook(self, user_api_key_dict, cache, data, call_type):
        model = data.get("model", "")
        if model in VISION_MODELS:
            return data  # Soporta visión → no tocar
        messages = data.get("messages", [])
        for msg in messages:
            content = msg.get("content")
            if isinstance(content, list):
                text_parts = [
                    part.get("text", "")
                    for part in content
                    if isinstance(part, dict) and part.get("type") == "text"
                ]
                msg["content"] = "\\n".join(text_parts)
        return data

proxy_handler_instance = StripImagesForNonVisionModels()
'''

def write_hook_file():
    """Escribe el hook en disco. Se llama al guardar cualquier config."""
    import os
    os.makedirs(os.path.dirname(HOOK_PATH), exist_ok=True)
    with open(HOOK_PATH, "w") as f:
        f.write(STRIP_IMAGES_HOOK)

def load_config():
    try:
        with open(CONFIG_PATH) as f:
            return yaml.safe_load(f) or {}
    except:
        return {}

def save_config(cfg):
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    shutil.copy2(CONFIG_PATH, f"{BACKUP_DIR}/config_{ts}.yaml")
    with open(CONFIG_PATH, "w") as f:
        yaml.dump(cfg, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

def load_env():
    env = {}
    try:
        with open(ENV_PATH) as f:
            for line in f:
                line = line.strip()
                if line and "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    except:
        pass
    return env

def get_master_key():
    return load_env().get("LITELLM_MASTER_KEY", "")

def restart_litellm():
    result = subprocess.run(
        ["systemctl", "restart", "litellm-proxy"],
        capture_output=True, text=True, timeout=15
    )
    return result.returncode == 0

def health_check():
    key = get_master_key()
    try:
        r = requests.get(
            f"{LITELLM_URL}/health",
            headers={"Authorization": f"Bearer {key}"},
            timeout=10
        )
        if r.status_code == 200:
            return r.json()
    except:
        pass
    return None

def list_backups():
    try:
        files = sorted(os.listdir(BACKUP_DIR), reverse=True)
        return [f for f in files if f.endswith(".yaml")][:10]
    except:
        return []

def build_deployment(model_id, api_key_var, weight, rpm, alias="code-expert-unificado"):
    provider = model_id.split("/")[0] if "/" in model_id else "unknown"
    entry = {
        "model_name": alias,
        "litellm_params": {
            "model": model_id,
            "api_key": f"os.environ/{api_key_var}",
        },
        "weight": weight,
        "rpm": rpm
    }
    if provider == "openrouter":
        entry["litellm_params"]["api_base"] = "https://openrouter.ai/api/v1"
        entry["litellm_params"]["extra_body"] = {"provider": {"ignore": ["Targon"]}}
    return entry

# ── API Routes ───────────────────────────────────────────────────────────────
@app.route("/api/config")
def api_config():
    cfg = load_config()
    models = cfg.get("model_list", [])
    env = load_env()
    result = []
    for i, m in enumerate(models):
        lp = m.get("litellm_params", {})
        model_id = lp.get("model", "")
        api_key_var = lp.get("api_key", "").replace("os.environ/", "")
        result.append({
            "index": i,
            "model_name": m.get("model_name", ""),
            "model": model_id,
            "api_key_var": api_key_var,
            "api_key_set": bool(env.get(api_key_var, "")),
            "weight": m.get("weight", 5),
            "rpm": m.get("rpm", 20),
        })
    return jsonify({"deployments": result, "count": len(result)})

@app.route("/api/known_models")
def api_known_models():
    return jsonify(KNOWN_MODELS)

@app.route("/api/add", methods=["POST"])
def api_add():
    data = request.json
    model_id   = data.get("model", "").strip()
    api_key_var = data.get("api_key_var", "").strip()
    weight     = int(data.get("weight", 8))
    rpm        = int(data.get("rpm", 20))
    alias      = data.get("alias", "code-expert-unificado").strip()

    if not model_id or not api_key_var:
        return jsonify({"ok": False, "error": "model y api_key_var son obligatorios"})

    cfg = load_config()
    if "model_list" not in cfg:
        cfg["model_list"] = []

    cfg["model_list"].append(build_deployment(model_id, api_key_var, weight, rpm, alias))
    _ensure_router(cfg)
    save_config(cfg)
    return jsonify({"ok": True, "total": len(cfg["model_list"])})

@app.route("/api/remove/<int:idx>", methods=["DELETE"])
def api_remove(idx):
    cfg = load_config()
    models = cfg.get("model_list", [])
    if 0 <= idx < len(models):
        removed = models.pop(idx)
        save_config(cfg)
        return jsonify({"ok": True, "removed": removed.get("litellm_params", {}).get("model")})
    return jsonify({"ok": False, "error": "índice inválido"})

@app.route("/api/update_weight", methods=["POST"])
def api_update_weight():
    data = request.json
    idx    = int(data.get("index", -1))
    weight = int(data.get("weight", 8))
    rpm    = int(data.get("rpm", -1))
    cfg = load_config()
    models = cfg.get("model_list", [])
    if 0 <= idx < len(models):
        models[idx]["weight"] = weight
        if rpm >= 0:
            models[idx]["rpm"] = rpm
        save_config(cfg)
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "índice inválido"})

@app.route("/api/deploy", methods=["POST"])
def api_deploy():
    ok = restart_litellm()
    return jsonify({"ok": ok, "message": "Servicio reiniciado ✅" if ok else "Error al reiniciar ❌"})

@app.route("/api/health")
def api_health():
    data = health_check()
    if data is None:
        return jsonify({"ok": False, "healthy": 0, "unhealthy": 0, "endpoints": []})
    healthy   = data.get("healthy_endpoints", [])
    unhealthy = data.get("unhealthy_endpoints", [])
    endpoints = []
    for h in healthy:
        endpoints.append({"model": h.get("model","?"), "status": "ok", "provider": h.get("litellm_provider","?")})
    for u in unhealthy:
        endpoints.append({"model": u.get("model","?"), "status": "error", "error": u.get("error","?")[:120]})
    return jsonify({"ok": True, "healthy": len(healthy), "unhealthy": len(unhealthy), "endpoints": endpoints})

@app.route("/api/preview")
def api_preview():
    cfg = load_config()
    return jsonify({"yaml": yaml.dump(cfg, default_flow_style=False, allow_unicode=True, sort_keys=False)})

@app.route("/api/backups")
def api_backups():
    return jsonify({"backups": list_backups()})

@app.route("/api/restore/<filename>", methods=["POST"])
def api_restore(filename):
    path = os.path.join(BACKUP_DIR, filename)
    if os.path.exists(path) and filename.endswith(".yaml"):
        shutil.copy2(path, CONFIG_PATH)
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "Backup no encontrado"})

@app.route("/api/apply_recommended", methods=["POST"])
def api_apply_recommended():
    """Config recomendada: solo modelos 100% confirmados activos y gratuitos."""
    env = load_env()
    or_keys   = sorted([k for k in env if k.startswith("OPENROUTER_KEY_")])
    groq_keys = sorted([k for k in env if k.startswith("GROQ_KEY_")])

    deployments = []

    # OpenRouter: solo gpt-oss-120b (18 providers, el más resiliente)
    for key in or_keys:
        deployments.append(build_deployment(
            "openrouter/openai/gpt-oss-120b:free", key, weight=10, rpm=15))

    # Groq: solo llama-3.3-70b-versatile (confirmado estable)
    for key in groq_keys:
        deployments.append(build_deployment(
            "groq/llama-3.3-70b-versatile", key, weight=7, rpm=30))

    cfg = load_config()
    cfg["model_list"] = deployments
    _ensure_router(cfg)
    save_config(cfg)
    return jsonify({"ok": True, "total": len(deployments)})

def _ensure_router(cfg):
    if "router_settings" not in cfg:
        cfg["router_settings"] = ROUTER_DEFAULTS
    if "litellm_settings" not in cfg:
        cfg["litellm_settings"] = dict(LITELLM_DEFAULTS)
    # Agregar hook que elimina imágenes para modelos sin visión
    ls = cfg["litellm_settings"]
    if HOOK_PATH not in ls.get("callbacks", []):
        ls.setdefault("callbacks", [])
        ls["callbacks"].append(HOOK_PATH)
    if "general_settings" not in cfg:
        cfg["general_settings"] = {"master_key": "os.environ/LITELLM_MASTER_KEY"}
    # Escribir el hook en disco cada vez que se actualiza la config
    write_hook_file()

# ── Frontend ─────────────────────────────────────────────────────────────────
HTML = r"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LiteLLM Config Manager</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
<style>
:root{--bg:#0d1117;--card:#161b22;--border:#30363d;--accent:#58a6ff;--green:#3fb950;--red:#f85149;--yellow:#d29922;}
body{background:var(--bg);color:#e6edf3;font-family:'Segoe UI',system-ui,sans-serif;}
.card{background:var(--card);border:1px solid var(--border);border-radius:10px;}
.badge-S{background:#7c3aed;}
.badge-A{background:#1d4ed8;}
.badge-B{background:#065f46;}
.badge-C{background:#374151;}
.score-bar{height:6px;border-radius:3px;background:var(--accent);transition:.3s;}
.weight-badge{background:#2d333b;border:1px solid #6e7681;border-radius:5px;padding:3px 10px;font-size:.82em;font-family:monospace;color:#e6edf3;font-weight:700;min-width:36px;text-align:center;display:inline-block;}
.model-row:hover{background:rgba(88,166,255,.07);}
.tag-free{background:#0d3321;color:#56d364;border:1px solid #3fb950aa;font-size:.7em;padding:2px 7px;border-radius:4px;font-weight:600;}
.tag-paid{background:#3d1010;color:#ff7b72;border:1px solid #f85149aa;font-size:.7em;padding:2px 7px;border-radius:4px;font-weight:600;}
.status-ok{color:#56d364;}
.status-err{color:#ff7b72;}
.status-unk{color:#e3b341;}
.btn-action{padding:3px 10px;font-size:.78em;}
pre{background:#010409;border:1px solid var(--border);border-radius:8px;padding:12px;font-size:.78em;max-height:320px;overflow-y:auto;color:#c9d1d9;}
input[type=range]{accent-color:var(--accent);}
.provider-badge-openrouter{background:#1a2744;color:#a5c8ff;border:1px solid #388bfd;font-size:.72em;padding:2px 8px;border-radius:4px;font-weight:600;}
.provider-badge-groq{background:#162b16;color:#7ee787;border:1px solid #3fb950;font-size:.72em;padding:2px 8px;border-radius:4px;font-weight:600;}
.provider-badge-gemini{background:#2a1015;color:#ffa8b0;border:1px solid #f85149;font-size:.72em;padding:2px 8px;border-radius:4px;font-weight:600;}
td{color:#e6edf3;vertical-align:middle;}
th{color:#b1bac4 !important;}
.form-control,.form-select{color:#e6edf3 !important;background-color:#21262d !important;border-color:#6e7681 !important;}
.form-control::placeholder{color:#6e7681 !important;}
.list-group-item{background:#21262d !important;color:#e6edf3 !important;border-color:#30363d !important;}
.list-group-item:hover{background:#2d333b !important;}
</style>
</head>
<body>
<div class="container-fluid px-4 py-3">

<!-- Header -->
<div class="d-flex align-items-center gap-3 mb-4">
  <div>
    <h4 class="mb-0 fw-bold" style="color:var(--accent)"><i class="bi bi-cpu me-2"></i>LiteLLM Config Manager</h4>
    <div class="small text-secondary">Proxy: <code>http://localhost:4000</code> · UI: puerto 4001</div>
  </div>
  <div class="ms-auto d-flex gap-2">
    <button class="btn btn-sm btn-outline-warning" onclick="applyRecommended()"><i class="bi bi-stars me-1"></i>Config recomendada</button>
    <button class="btn btn-sm btn-outline-info"    onclick="checkHealth()"><i class="bi bi-heart-pulse me-1"></i>Health Check</button>
    <button class="btn btn-sm btn-success"         onclick="deploy()"><i class="bi bi-rocket-takeoff me-1"></i>Deploy &amp; Restart</button>
  </div>
</div>

<div id="alert-box"></div>

<div class="row g-3">
<!-- LEFT: deployments actuales -->
<div class="col-xl-8">
  <div class="card p-3 mb-3">
    <div class="d-flex align-items-center mb-3 gap-2">
      <h6 class="mb-0 fw-semibold"><i class="bi bi-list-ul me-2"></i>Deployments activos</h6>
      <span class="badge bg-secondary ms-1" id="deploy-count">0</span>
      <div class="ms-auto d-flex gap-2">
        <select id="filter-provider" class="form-select form-select-sm" style="width:auto;background:#21262d;color:#e6edf3;border-color:var(--border)" onchange="renderDeployments()">
          <option value="">Todos</option>
          <option value="openrouter">OpenRouter</option>
          <option value="groq">Groq</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>
    </div>
    <div class="table-responsive">
    <table class="table table-sm mb-0" style="color:#e6edf3">
      <thead style="color:#8b949e;font-size:.78em">
        <tr>
          <th>#</th><th>Modelo</th><th>Provider</th><th>API Key Var</th>
          <th>Weight</th><th>RPM</th><th>Estado</th><th></th>
        </tr>
      </thead>
      <tbody id="deploy-body"></tbody>
    </table>
    </div>
  </div>

  <!-- Health panel -->
  <div class="card p-3" id="health-panel" style="display:none">
    <h6 class="fw-semibold mb-3"><i class="bi bi-heart-pulse me-2"></i>Estado de endpoints</h6>
    <div id="health-body"></div>
  </div>
</div>

<!-- RIGHT: añadir modelo + ranking -->
<div class="col-xl-4">
  <!-- Añadir -->
  <div class="card p-3 mb-3">
    <h6 class="fw-semibold mb-3"><i class="bi bi-plus-circle me-2"></i>Añadir deployment</h6>
    <div class="mb-2">
      <label class="form-label small text-secondary mb-1">Modelo</label>
      <input id="add-model" type="text" class="form-control form-control-sm" placeholder="openrouter/openai/gpt-oss-120b:free"
             style="background:#21262d;color:#e6edf3;border-color:var(--border)" oninput="filterModels(this.value)">
      <div id="model-suggestions" class="list-group mt-1" style="display:none;max-height:200px;overflow-y:auto;font-size:.8em;background:#21262d;border-color:var(--border)"></div>
      <div id="model-hint" class="small mt-1" style="color:#8b949e"></div>
    </div>
    <div class="mb-2">
      <label class="form-label small text-secondary mb-1">Variable API Key (.env)</label>
      <input id="add-key" type="text" class="form-control form-control-sm" placeholder="OPENROUTER_KEY_1"
             style="background:#21262d;color:#e6edf3;border-color:var(--border)">
    </div>
    <div class="row g-2 mb-2">
      <div class="col">
        <label class="form-label small text-secondary mb-1">Weight: <span id="w-val">9</span></label>
        <input type="range" class="form-range" id="add-weight" min="1" max="20" value="9" oninput="document.getElementById('w-val').textContent=this.value">
      </div>
      <div class="col-auto">
        <label class="form-label small text-secondary mb-1">RPM</label>
        <input id="add-rpm" type="number" class="form-control form-control-sm" value="20" min="1" max="200"
               style="width:70px;background:#21262d;color:#e6edf3;border-color:var(--border)">
      </div>
    </div>
    <button class="btn btn-primary btn-sm w-100" onclick="addDeployment()"><i class="bi bi-plus me-1"></i>Agregar</button>
  </div>

  <!-- Ranking -->
  <div class="card p-3">
    <div class="d-flex align-items-center mb-2">
      <h6 class="fw-semibold mb-0"><i class="bi bi-trophy me-2"></i>Ranking modelos</h6>
      <select id="ranking-sort" class="form-select form-select-sm ms-auto" style="width:auto;background:#21262d;color:#e6edf3;border-color:var(--border)" onchange="renderRanking()">
        <option value="score_desc">Score ↓</option>
        <option value="tier_asc">Tier</option>
        <option value="context_desc">Contexto ↓</option>
        <option value="name_asc">Nombre A-Z</option>
      </select>
    </div>
    <div id="ranking-list" style="max-height:420px;overflow-y:auto"></div>
  </div>
</div>
</div>

<!-- YAML Preview -->
<div class="card p-3 mt-3">
  <div class="d-flex align-items-center mb-2">
    <h6 class="fw-semibold mb-0"><i class="bi bi-code-slash me-2"></i>Preview config.yaml</h6>
    <button class="btn btn-sm btn-outline-secondary ms-auto" onclick="loadPreview()"><i class="bi bi-arrow-clockwise me-1"></i>Refrescar</button>
  </div>
  <pre id="yaml-preview" class="text-secondary">— Haz clic en Refrescar —</pre>
</div>

<!-- Footer -->
<footer class="mt-3 mb-2">
  <div class="card p-3">
    <div class="row g-3">
      <div class="col-md-4">
        <div class="small fw-semibold mb-1"><i class="bi bi-bookmark-star me-1"></i>Tiers</div>
        <div class="small text-secondary">S = top absoluto · A = excelente · B = sólido · C = fallback</div>
      </div>
      <div class="col-md-4">
        <div class="small fw-semibold mb-1"><i class="bi bi-clock-history me-1"></i>Backups</div>
        <select id="backup-sel" class="form-select form-select-sm mb-1" style="background:#21262d;color:#e6edf3;border-color:var(--border)"></select>
        <button class="btn btn-sm btn-outline-secondary" onclick="restoreBackup()"><i class="bi bi-arrow-counterclockwise me-1"></i>Restaurar</button>
      </div>
      <div class="col-md-4">
        <div class="small fw-semibold mb-1"><i class="bi bi-exclamation-diamond me-1"></i>Nota</div>
        <div class="small text-secondary">Los scores son heurísticas internas. Los límites gratuitos cambian sin aviso.</div>
      </div>
    </div>
  </div>
</footer>
</div><!-- /container -->

<script>
let deployments = [];
let knownModels = [];

// ── Init ──────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadDeployments(), loadKnownModels(), loadBackups()]);
  renderRanking();
});

// ── Deployments ───────────────────────────────────────────────────────────
async function loadDeployments(){
  const r = await fetch('/api/config');
  const data = await r.json();
  deployments = data.deployments;
  renderDeployments();
}

function renderDeployments(){
  const filter = document.getElementById('filter-provider').value;
  const body = document.getElementById('deploy-body');
  const shown = filter ? deployments.filter(d => d.model.startsWith(filter)) : deployments;
  document.getElementById('deploy-count').textContent = deployments.length;

  if(!shown.length){
    body.innerHTML = '<tr><td colspan="8" class="text-center text-secondary py-3">Sin deployments</td></tr>';
    return;
  }

  body.innerHTML = shown.map((d,i) => {
    const provider = d.model.split('/')[0];
    const modelShort = d.model.replace('openrouter/','').replace(':free',' <span class="tag-free">free</span>');
    const keyOk = d.api_key_set
      ? '<i class="bi bi-check-circle-fill status-ok"></i>'
      : '<i class="bi bi-x-circle-fill status-err" title="Key no encontrada en .env"></i>';
    const pbadge = `<span class="provider-badge-${provider}">${provider}</span>`;
    return `<tr class="model-row">
      <td class="text-secondary small">${d.index+1}</td>
      <td style="font-size:.78em"><code style="color:var(--accent)">${modelShort}</code></td>
      <td>${pbadge}</td>
      <td><code class="small text-secondary">${d.api_key_var}</code></td>
      <td>
        <div class="d-flex align-items-center gap-1">
          <input type="range" class="form-range" min="1" max="20" value="${d.weight}" style="width:70px"
            onchange="updateWeight(${d.index},this.value,${d.rpm})" oninput="this.nextElementSibling.textContent=this.value">
          <span style="background:#2d333b;border:1px solid #6e7681;border-radius:5px;padding:3px 10px;font-size:.85em;font-family:monospace;color:#e6edf3;font-weight:700;min-width:32px;text-align:center;display:inline-block">${d.weight}</span>
        </div>
      </td>
      <td><span style="background:#2d333b;border:1px solid #6e7681;border-radius:5px;padding:3px 10px;font-size:.85em;font-family:monospace;color:#e6edf3;font-weight:700;min-width:36px;text-align:center;display:inline-block">${d.rpm}</span></td>
      <td>${keyOk}</td>
      <td>
        <button class="btn btn-outline-danger btn-action" onclick="removeDeployment(${d.index})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

async function removeDeployment(idx){
  if(!confirm('¿Eliminar este deployment?')) return;
  await fetch(`/api/remove/${idx}`, {method:'DELETE'});
  await loadDeployments();
  showAlert('Deployment eliminado — haz Deploy para aplicar','warning');
}

async function updateWeight(idx, weight, rpm){
  await fetch('/api/update_weight',{method:'POST',headers:{'Content-Type':'application/json'},
    body: JSON.stringify({index:idx, weight:parseInt(weight), rpm:rpm})});
}

async function addDeployment(){
  const model = document.getElementById('add-model').value.trim();
  const key   = document.getElementById('add-key').value.trim();
  const weight= document.getElementById('add-weight').value;
  const rpm   = document.getElementById('add-rpm').value;

  if(!model || !key){ showAlert('Completa el modelo y la variable de API key','danger'); return; }

  const r = await fetch('/api/add',{method:'POST',headers:{'Content-Type':'application/json'},
    body: JSON.stringify({model, api_key_var:key, weight:parseInt(weight), rpm:parseInt(rpm)})});
  const data = await r.json();
  if(data.ok){
    await loadDeployments();
    showAlert(`Deployment añadido (total: ${data.total}) — haz Deploy para aplicar','success`);
    document.getElementById('add-model').value='';
    document.getElementById('add-key').value='';
    document.getElementById('model-suggestions').style.display='none';
  } else {
    showAlert(data.error,'danger');
  }
}

// ── Known Models / Autocomplete ───────────────────────────────────────────
async function loadKnownModels(){
  const r = await fetch('/api/known_models');
  knownModels = await r.json();
}

function filterModels(val){
  const box = document.getElementById('model-suggestions');
  const hint = document.getElementById('model-hint');
  if(!val || val.length < 3){ box.style.display='none'; hint.textContent=''; return; }
  const lv = val.toLowerCase();
  const matches = knownModels.filter(m => m.model.toLowerCase().includes(lv) || m.name.toLowerCase().includes(lv)).slice(0,8);
  if(!matches.length){ box.style.display='none'; return; }
  box.style.display='block';
  box.innerHTML = matches.map(m => {
    const tag = m.free ? '<span class="tag-free ms-1">free</span>' : '<span class="tag-paid ms-1">pago</span>';
    return `<button class="list-group-item list-group-item-action py-1 px-2"
      style="background:#21262d;color:#e6edf3;border-color:var(--border)"
      onclick="selectModel('${m.model}')">
      <div class="d-flex align-items-center gap-1">
        <code style="color:var(--accent);font-size:.75em">${m.model}</code>${tag}
        <span class="badge badge-${m.tier} ms-1" style="font-size:.6em">${m.tier}</span>
      </div>
      <div class="small text-secondary">${m.name} · ${fmtCtx(m.ctx)}</div>
    </button>`;
  }).join('');
}

function selectModel(model){
  document.getElementById('add-model').value = model;
  document.getElementById('model-suggestions').style.display='none';
  const info = knownModels.find(m => m.model === model);
  if(info){
    const hint = document.getElementById('model-hint');
    const tag = info.free ? '🟢 Gratis' : '🔴 De pago';
    hint.innerHTML = `${tag} · Ctx: ${fmtCtx(info.ctx)} · Score: ${info.score} · ${info.why}`;
    // Autosugerir RPM
    if(model.startsWith('gemini')) document.getElementById('add-rpm').value=2;
    else if(model.startsWith('groq')) document.getElementById('add-rpm').value=30;
    else document.getElementById('add-rpm').value=15;
  }
}

function fmtCtx(n){ n=Number(n||0); return n>=1000?`${Math.round(n/1000)}K`:String(n); }
function fmtPrice(n){ n=Number(n||0); return n===0?'free':`$${n.toFixed(2)}`; }

// ── Ranking ───────────────────────────────────────────────────────────────
const tierOrder = {S:1,A:2,B:3,C:4,'?':9};

function sortRanking(items){
  const mode = document.getElementById('ranking-sort').value;
  const arr = [...items];
  if(mode==='name_asc')    arr.sort((a,b)=>(a.name||a.model).localeCompare(b.name||b.model));
  else if(mode==='context_desc') arr.sort((a,b)=>Number(b.ctx||0)-Number(a.ctx||0));
  else if(mode==='tier_asc')    arr.sort((a,b)=>(tierOrder[a.tier]||9)-(tierOrder[b.tier]||9));
  else arr.sort((a,b)=>Number(b.score||0)-Number(a.score||0));
  return arr;
}

function tbadge(t){ return `badge-${t||'?'}`; }

function renderRanking(){
  if(!knownModels.length) return;
  const sorted = sortRanking(knownModels);
  const inUseSet = new Set(deployments.map(d=>d.model));
  document.getElementById('ranking-list').innerHTML = sorted.map((r,i) => {
    const inUse = inUseSet.has(r.model);
    const w = r.tier==='S'?10:r.tier==='A'?8:r.tier==='B'?6:4;
    return `<div class="d-flex align-items-start gap-2 py-2" style="border-bottom:1px solid var(--border)">
      <div class="text-secondary small" style="min-width:18px">${i+1}</div>
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-1 flex-wrap">
          <code style="font-size:.72em;color:var(--accent)">${r.model}</code>
          ${inUse?'<span class="badge bg-success" style="font-size:.6em">EN USO</span>':''}
          <span class="badge ${tbadge(r.tier)}" style="font-size:.6em">${r.tier}</span>
          ${r.free?'<span class="tag-free">free</span>':'<span class="tag-paid">pago</span>'}
        </div>
        <div class="d-flex align-items-center gap-2 mt-1">
          <div class="score-bar" style="width:${Math.max(6,r.score)}%;max-width:120px"></div>
          <span class="small text-secondary">${r.score}</span>
        </div>
        <div class="small text-secondary">${fmtCtx(r.ctx)} ctx · ${r.why}</div>
      </div>
      <button class="btn btn-outline-primary btn-action flex-shrink-0" title="Autocompletar modelo"
        onclick="document.getElementById('add-model').value='${r.model}';selectModel('${r.model}')">
        <i class="bi bi-arrow-up-right-circle"></i>
      </button>
    </div>`;
  }).join('');
}

// ── Actions ───────────────────────────────────────────────────────────────
async function deploy(){
  showAlert('Reiniciando LiteLLM...','info');
  const r = await fetch('/api/deploy',{method:'POST'});
  const d = await r.json();
  showAlert(d.message, d.ok?'success':'danger');
}

async function checkHealth(){
  showAlert('Consultando health endpoints...','info');
  const r = await fetch('/api/health');
  const d = await r.json();
  const panel = document.getElementById('health-panel');
  panel.style.display='block';
  if(!d.ok){
    document.getElementById('health-body').innerHTML='<div class="text-danger">No se pudo conectar al proxy. ¿Está corriendo?</div>';
    return;
  }
  showAlert(`✅ Healthy: ${d.healthy}  ❌ Unhealthy: ${d.unhealthy}`,'info');
  document.getElementById('health-body').innerHTML = d.endpoints.map(e =>
    `<div class="d-flex align-items-center gap-2 py-1" style="border-bottom:1px solid var(--border);font-size:.8em">
      <i class="bi ${e.status==='ok'?'bi-check-circle-fill status-ok':'bi-x-circle-fill status-err'}"></i>
      <code style="color:var(--accent)">${e.model}</code>
      ${e.status==='error'?`<span class="text-danger ms-auto small">${e.error||''}</span>`:''}
    </div>`
  ).join('') || '<div class="text-secondary">Sin endpoints</div>';
}

async function applyRecommended(){
  if(!confirm('Esto reemplazará TODOS los deployments actuales con el config recomendado (GPT-OSS-120B + Kimi K2 + Devstral). ¿Continuar?')) return;
  const r = await fetch('/api/apply_recommended',{method:'POST'});
  const d = await r.json();
  if(d.ok){
    await loadDeployments();
    showAlert(`Config recomendada aplicada — ${d.total} deployments. Haz Deploy para activar.`,'success');
  }
}

async function loadPreview(){
  const r = await fetch('/api/preview');
  const d = await r.json();
  document.getElementById('yaml-preview').textContent = d.yaml;
}

async function loadBackups(){
  const r = await fetch('/api/backups');
  const d = await r.json();
  const sel = document.getElementById('backup-sel');
  sel.innerHTML = d.backups.length
    ? d.backups.map(b=>`<option value="${b}">${b}</option>`).join('')
    : '<option>Sin backups</option>';
}

async function restoreBackup(){
  const sel = document.getElementById('backup-sel');
  const file = sel.value;
  if(!file || file==='Sin backups') return;
  if(!confirm(`¿Restaurar ${file}?`)) return;
  const r = await fetch(`/api/restore/${file}`,{method:'POST'});
  const d = await r.json();
  if(d.ok){ await loadDeployments(); showAlert('Backup restaurado — haz Deploy para aplicar','success'); }
}

function showAlert(msg, type='info'){
  const box = document.getElementById('alert-box');
  box.innerHTML = `<div class="alert alert-${type} alert-dismissible py-2 small" role="alert">
    ${msg}<button type="button" class="btn-close btn-sm" data-bs-dismiss="alert"></button>
  </div>`;
  setTimeout(()=>{if(box.firstChild)box.firstChild.remove();},5000);
}
</script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>"""

@app.route("/")
def index():
    return render_template_string(HTML)

if __name__ == "__main__":
    print("=" * 52)
    print("  LiteLLM Config Manager")
    print("  http://192.168.1.252:4001")
    print("=" * 52)
    app.run(host="0.0.0.0", port=4001, debug=False)
