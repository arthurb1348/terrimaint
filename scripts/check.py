"""Run the same checks locally and in CI, on Windows or Linux."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    checks = [
        ("Lint Python", ["ruff", "check", "."]),
        ("Format Python", ["ruff", "format", "--check", "."]),
        ("Tests API", ["pytest"]),
    ]
    for label, arguments in checks:
        print(f"\n{label}", flush=True)
        result = subprocess.run([sys.executable, "-m", *arguments], cwd=ROOT, check=False)
        if result.returncode != 0:
            return result.returncode
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
