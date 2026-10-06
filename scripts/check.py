"""Exécute les mêmes contrôles Python en local et en CI, sur Windows ou Linux."""

import subprocess
import sys
from pathlib import Path

# La racine est calculée depuis ce fichier, quel que soit le terminal de lancement.
ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    """Sans paramètre, retourne 0 si tout passe, sinon le code du premier échec."""
    # L'ordre évite de lancer les tests lorsqu'un problème de lint ou de format existe.
    checks = [
        ("Lint Python", ["ruff", "check", "."]),
        ("Format Python", ["ruff", "format", "--check", "."]),
        ("Tests API", ["pytest"]),
    ]
    for label, arguments in checks:
        print(f"\n{label}", flush=True)
        # Le même interpréteur que celui de uv exécute chaque outil dans le bon dossier.
        # check=False permet de transmettre le code d'échec sans masquer la sortie.
        result = subprocess.run([sys.executable, "-m", *arguments], cwd=ROOT, check=False)
        if result.returncode != 0:
            return result.returncode
    return 0


if __name__ == "__main__":
    # Le code de retour devient celui du processus, utilisé par le terminal et la CI.
    raise SystemExit(main())
