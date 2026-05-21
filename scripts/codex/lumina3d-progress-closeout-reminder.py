#!/usr/bin/env python3
"""Lumina3D Stop hook reminder for progress.md closeout hygiene."""

from __future__ import annotations

import json
import sys
from pathlib import Path


PROJECT_ROOT = Path("/Volumes/KyleSSD/Documents/My Projects/My Games/Lumina3D")


def read_hook_input() -> dict[str, object]:
    try:
        if sys.stdin.isatty():
            return {}
        raw = sys.stdin.read()
    except Exception:
        return {}
    if not raw.strip():
        return {}
    try:
        data = json.loads(raw)
    except Exception:
        return {}
    return data if isinstance(data, dict) else {}


def is_inside_project(cwd: str | None) -> bool:
    if not cwd:
        return True
    try:
        Path(cwd).resolve().relative_to(PROJECT_ROOT.resolve())
        return True
    except Exception:
        return False


def main() -> int:
    hook_input = read_hook_input()
    cwd = hook_input.get("cwd")
    if isinstance(cwd, str) and not is_inside_project(cwd):
        return 0

    message = (
        "Lumina3D closeout: before final response, decide whether progress.md "
        "needs a concise DONE/VERIFY entry with changed files, commands run, "
        "and pass/fail outcomes. Do not auto-write it unless the turn's work "
        "actually changed project state."
    )
    print(
        json.dumps(
            {
                "continue": True,
                "systemMessage": message,
                "suppressOutput": False,
            },
            separators=(",", ":"),
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
