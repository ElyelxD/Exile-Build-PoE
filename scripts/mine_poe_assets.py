#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def status_payload(status: str, **extra: object) -> dict[str, object]:
    payload: dict[str, object] = {"status": status}
    payload.update(extra)
    return payload


def looks_like_poe_install(install_dir: Path) -> bool:
    expected = [
        install_dir / "PathOfExile.exe",
        install_dir / "PathOfExileSteam.exe",
        install_dir / "Content.ggpk",
        install_dir / "Bundles2" / "Index.bin",
        install_dir / "Bundles2" / "_.index.bin",
    ]
    return any(candidate.exists() for candidate in expected)


def ensure_output_dir(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)


def write_manifest(out_dir: Path, payload: dict[str, object]) -> Path:
    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return manifest_path


def configure_library_path(lib_path: str | None) -> None:
    if lib_path:
        sys.path.insert(0, lib_path)


def detect_extractor() -> tuple[bool, str]:
    for module_name in ("PyPoE", "pydds", "pyooz"):
        if importlib.util.find_spec(module_name):
            return True, module_name

    return False, "PyPoE"


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare local PoE asset mining cache.")
    parser.add_argument("--poe-dir", required=True, help="Path of Exile install directory")
    parser.add_argument("--out-dir", required=True, help="Output cache directory")
    parser.add_argument("--lib-path", default="", help="Optional local library checkout path")
    args = parser.parse_args()

    poe_dir = Path(args.poe_dir).expanduser().resolve()
    out_dir = Path(args.out_dir).expanduser().resolve()

    ensure_output_dir(out_dir)

    if not looks_like_poe_install(poe_dir):
      print(
          json.dumps(
              status_payload(
                  "missing-install",
                  lastError="The chosen folder does not appear to be a valid Path of Exile installation.",
              )
          )
      )
      return 2

    configure_library_path(args.lib_path or None)
    extractor_available, extractor_name = detect_extractor()

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "local-poe-install",
        "installPath": str(poe_dir),
        "extractorName": extractor_name if extractor_available else None,
        "gemIcons": {},
        "itemIcons": {},
    }
    manifest_path = write_manifest(out_dir, manifest)

    if not extractor_available:
        print(
            json.dumps(
                status_payload(
                    "missing-extractor",
                    extractorName=extractor_name,
                    lastError=(
                        "No compatible extractor was found in the current Python installation. "
                        "Install PyPoE/pydds/pyooz or point to a local compatible library folder."
                    ),
                    manifestPath=str(manifest_path),
                )
            )
        )
        return 3

    print(
        json.dumps(
            status_payload(
                "ready",
                extractorName=extractor_name,
                manifestPath=str(manifest_path),
            )
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
