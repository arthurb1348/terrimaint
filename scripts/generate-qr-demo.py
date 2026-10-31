"""Régénérer les exemples : Python avec segno==1.6.6, sans dépendance du produit."""

from pathlib import Path

import segno

root = Path(__file__).resolve().parents[1] / "frontend/public/qr-demo"
for reference in ("EQ-OUT-0001", "EQ-VEH-0042", "EQ-OUT-9999"):
    qr = segno.make(reference, micro=False, error="m", boost_error=False)
    qr.save(root / f"{reference}.png", scale=10, border=4)
    qr.save(root / f"{reference}.svg", scale=10, border=4, xmldecl=False)
