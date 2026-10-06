# Contexte produit

## Besoin

TerriMaint aide les petites collectivités à relier les signalements du terrain aux décisions
de maintenance. Les incidents, les équipements et les interventions deviennent consultables
avec une traçabilité commune aux agents et au responsable.

## Parcours prioritaires

1. Agent : identifier un équipement, consulter sa fiche et déclarer un incident.
2. Responsable : consulter un incident, examiner les informations et programmer une intervention.

Le responsable doit aussi pouvoir déclarer un incident. Chaque rôle dispose d'une interface
responsive utilisable sur mobile et sur ordinateur ; le rôle ne détermine pas le type d'écran.

## Périmètre prévu du MVP

- Équipements et accès à leur fiche par QR code.
- Déclaration d'incidents, pièces jointes et localisation lorsque disponible.
- Suivi et priorisation des incidents ; historique.
- Création, affectation et planification d'interventions.
- Tableau de bord et indications de récurrence.

Cette liste fixe une direction. Chaque comportement, règle d'accès et donnée obligatoire
doit être précisé dans une issue avant implémentation.

## Hors connexion ciblé

Prévoir le shell de la PWA, les équipements utiles en cache, le scan QR et la consultation
basique d'une fiche, les brouillons et la déclaration d'incident avec photos.
La géolocalisation est utilisée si elle est disponible. Une file IndexedDB permettra
la synchronisation au retour du réseau, avec une stratégie explicite de reprise et de dédoublonnage.
Les actions de gestion qui exigent des données actualisées seront définies au cas par cas.

## Technologies retenues

- Python : FastAPI, PostgreSQL, SQLAlchemy, Alembic et pytest.
- Frontend : Angular et TypeScript, PWA.
- Qualité : Ruff, Git/GitHub et CI ; conteneurisation et déploiement introduits progressivement.

Python maintient la cohérence avec la trajectoire Data/IA d'Arthur. Java/Spring reste étudié
pendant la formation. Les fonctions IA, OCR, transcription ou détection d'anomalies
sont des extensions futures : elles ne sont pas des prérequis au MVP.

## Interface

Direction graphique : Inter, Source Serif 4, vert `#234E3F`, accent `#C3823E`,
surfaces `#E4ECE8` et `#F5F5F5`. Les maquettes validées priment lors de chaque tâche d'interface.
Accessibilité et lisibilité sur le terrain font partie des critères du parcours.
