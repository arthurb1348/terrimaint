"""Vérifie les garde-fous de configuration dans des processus Django indépendants."""

import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]


@pytest.mark.parametrize(
    ("debug", "secret", "expected_code"),
    [("true", "", 0), ("false", "", 1), ("false", "test-only-secret", 0)],
)
def test_secret_is_required_outside_debug(debug: str, secret: str, expected_code: int) -> None:
    result = subprocess.run(
        [sys.executable, "backend/manage.py", "check"],
        cwd=ROOT,
        env={**os.environ, "DJANGO_DEBUG": debug, "DJANGO_SECRET_KEY": secret},
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == expected_code, result.stderr
    if expected_code:
        assert "DJANGO_SECRET_KEY est obligatoire" in result.stderr
