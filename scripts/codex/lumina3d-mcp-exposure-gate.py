#!/usr/bin/env python3
"""Project-local Lumina3D MCP exposure gate for Codex SessionStart hooks.

The hook is intentionally lightweight by default. It validates the installed
Codex MCP config and writes a status file, but skips direct MCP smoke during
chat startup unless LUMINA3D_MCP_HOOK_SMOKE=1 is set.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path("/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D")
CODEX_CONFIG = Path("/Users/jonathanhobson/.codex/config.toml")
STATE_PATH = Path("/Users/jonathanhobson/.codex/state/lumina3d-mcp-exposure.json")
EXPECTED_COMMAND = "/usr/local/bin/npm"
EXPECTED_ARGS = ["run", "mcp:stdio"]
EXPECTED_TOOLS = [
    "lumina_explain_editor_patch",
    "lumina_get_archetype_contract",
    "lumina_get_current_editor_state",
    "lumina_get_level_manifest",
    "lumina_health",
    "lumina_list_archetypes",
    "lumina_list_level_objects",
    "lumina_list_levels",
    "lumina_project_summary",
    "lumina_run_build",
    "lumina_run_level_validation_suite",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_inside_project(cwd: Path) -> bool:
    try:
        cwd.resolve().relative_to(PROJECT_ROOT.resolve())
        return True
    except ValueError:
        return False


def read_hook_cwd() -> Path:
    try:
        if not sys.stdin.isatty():
            raw = sys.stdin.read()
            if raw.strip():
                payload = json.loads(raw)
                cwd = payload.get("cwd") if isinstance(payload, dict) else None
                if isinstance(cwd, str) and cwd.strip():
                    return Path(cwd)
    except Exception:
        pass
    return Path(os.getcwd())


def parse_scalar(value: str):
    value = value.strip().rstrip(",")
    if value == "true":
        return True
    if value == "false":
        return False
    if value.startswith('"') and value.endswith('"'):
        return value[1:-1]
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value


def parse_string_array(raw: str) -> list[str]:
    return re.findall(r'"([^"]*)"', raw)


def parse_lumina_server_block(text: str) -> dict:
    server: dict = {}
    in_block = False
    in_enabled_tools = False
    enabled_tools: list[str] = []

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        if stripped.startswith("[") and stripped.endswith("]"):
            if in_block:
                break
            in_block = stripped == "[mcp_servers.lumina3d]"
            continue

        if not in_block:
            continue

        if in_enabled_tools:
            if stripped.startswith("]"):
                server["enabled_tools"] = enabled_tools
                in_enabled_tools = False
            else:
                enabled_tools.extend(parse_string_array(stripped))
            continue

        if "=" not in stripped:
            continue
        key, value = [part.strip() for part in stripped.split("=", 1)]
        if key == "enabled_tools" and value.startswith("["):
            in_enabled_tools = True
            enabled_tools.extend(parse_string_array(value))
            if value.endswith("]"):
                server["enabled_tools"] = enabled_tools
                in_enabled_tools = False
            continue
        if value.startswith("[") and value.endswith("]"):
            server[key] = parse_string_array(value)
        else:
            server[key] = parse_scalar(value)

    if in_enabled_tools:
        server["enabled_tools"] = enabled_tools
    return server


def load_lumina_server_config() -> tuple[dict, str | None]:
    try:
        return parse_lumina_server_block(CODEX_CONFIG.read_text()), None
    except Exception as error:
        return {}, str(error)


def check_lumina_config(server: dict) -> tuple[dict, list[str]]:
    issues: list[str] = []
    if not server:
        issues.append("mcp_servers.lumina3d is missing.")
        return {"present": False}, issues

    actual_tools = server.get("enabled_tools") or []
    checks = {
        "present": True,
        "enabled": server.get("enabled") is True,
        "required_is_false": server.get("required") is False,
        "command_ok": server.get("command") == EXPECTED_COMMAND,
        "args_ok": server.get("args") == EXPECTED_ARGS,
        "cwd_ok": server.get("cwd") == str(PROJECT_ROOT),
        "enabled_tools_exact": actual_tools == EXPECTED_TOOLS,
        "startup_timeout_sec": server.get("startup_timeout_sec"),
        "tool_timeout_sec": server.get("tool_timeout_sec"),
    }

    if not checks["enabled"]:
        issues.append("mcp_servers.lumina3d.enabled is not true.")
    if not checks["required_is_false"]:
        issues.append("mcp_servers.lumina3d.required is not false.")
    if not checks["command_ok"]:
        issues.append("mcp_servers.lumina3d.command does not match /usr/local/bin/npm.")
    if not checks["args_ok"]:
        issues.append('mcp_servers.lumina3d.args does not match ["run", "mcp:stdio"].')
    if not checks["cwd_ok"]:
        issues.append("mcp_servers.lumina3d.cwd does not match the Lumina3D project root.")
    if not checks["enabled_tools_exact"]:
        missing = sorted(set(EXPECTED_TOOLS) - set(actual_tools))
        extra = sorted(set(actual_tools) - set(EXPECTED_TOOLS))
        issues.append(f"mcp_servers.lumina3d.enabled_tools mismatch. missing={missing} extra={extra}")
    return checks, issues


def check_project_shadow() -> dict:
    candidates = [
        PROJECT_ROOT / ".codex" / "config.toml",
        PROJECT_ROOT.parent / ".codex" / "config.toml",
        PROJECT_ROOT.parent.parent / ".codex" / "config.toml",
    ]
    present = [str(path) for path in candidates if path.exists()]
    return {
        "checked": [str(path) for path in candidates],
        "present": present,
        "status": "project_hook_config_present" if present else "none_found",
    }


def run_direct_smoke() -> dict:
    started = time.time()
    try:
        completed = subprocess.run(
            [EXPECTED_COMMAND, "run", "mcp:smoke"],
            cwd=PROJECT_ROOT,
            text=True,
            capture_output=True,
            timeout=25,
            check=False,
        )
        return {
            "ran": True,
            "ok": completed.returncode == 0,
            "exit_code": completed.returncode,
            "duration_ms": round((time.time() - started) * 1000),
            "stdout_preview": completed.stdout[-2000:],
            "stderr_preview": completed.stderr[-2000:],
        }
    except Exception as error:
        return {
            "ran": True,
            "ok": False,
            "exit_code": None,
            "duration_ms": round((time.time() - started) * 1000),
            "error": str(error),
        }


def write_state(payload: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")


def main() -> int:
    hook_cwd = read_hook_cwd()
    inside_project = is_inside_project(hook_cwd)
    smoke_requested = os.getenv("LUMINA3D_MCP_HOOK_SMOKE") == "1"
    payload = {
        "schema_version": "lumina3d.mcp.exposure.v1",
        "generated_at": now_iso(),
        "project_root": str(PROJECT_ROOT),
        "hook_cwd": str(hook_cwd),
        "inside_project": inside_project,
        "native_tool_search": {
            "query": "lumina_health lumina_list_levels lumina_get_current_editor_state",
            "status": "must_verify_in_chat",
        },
    }

    if not inside_project:
        payload.update({
            "classification": "yellow_not_lumina_project",
            "summary": "Lumina3D MCP gate skipped because cwd is outside the Lumina3D project.",
        })
        write_state(payload)
        return 0

    lumina_server_config, config_error = load_lumina_server_config()
    if config_error:
        payload.update({
            "classification": "red_config_invalid",
            "summary": "Codex config could not be parsed.",
            "config_error": config_error,
        })
        write_state(payload)
        return 1

    config_checks, issues = check_lumina_config(lumina_server_config)
    project_shadow = check_project_shadow()
    payload.update({
        "config_path": str(CODEX_CONFIG),
        "config_checks": config_checks,
        "config_issues": issues,
        "project_shadow_configs": project_shadow,
        "expected_tools": EXPECTED_TOOLS,
    })

    if issues:
        payload.update({
            "classification": "red_config_missing_or_wrong",
            "summary": "Lumina3D MCP config is missing or does not match the expected project-local shape.",
        })
        write_state(payload)
        return 1

    if smoke_requested:
        smoke = run_direct_smoke()
        payload["direct_smoke"] = smoke
        if not smoke.get("ok"):
            payload.update({
                "classification": "red_direct_smoke_failed",
                "summary": "Lumina3D MCP direct smoke failed.",
            })
            write_state(payload)
            return 1
        classification = "green_direct_smoke_ok_native_unverified"
        summary = "Lumina3D MCP config and direct smoke passed; native Codex tool exposure still requires in-chat verification."
    else:
        payload["direct_smoke"] = {
            "ran": False,
            "reason": "Skipped during SessionStart unless LUMINA3D_MCP_HOOK_SMOKE=1 is set.",
        }
        classification = "yellow_native_unverified"
        summary = "Lumina3D MCP config passed; direct smoke skipped for lightweight SessionStart behavior."

    payload.update({
        "classification": classification,
        "summary": summary,
    })
    write_state(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
