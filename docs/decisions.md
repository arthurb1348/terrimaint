# Décisions techniques

## 2026-10-07 — Bilan versionné et validation humaine

GitHub constitue la source de vérité. `docs/project-status.md` synthétise l'état réel,
avec date, commit de référence et liens vers le code, les tests et la documentation.
Les intentions et PR ouvertes restent distinctes des capacités intégrées sur `main`.
Les futures documentations et présentations externes seront dérivées de ce bilan ;
aucun mécanisme de synchronisation externe n'est installé par cette décision.

Le workflow est pilotable depuis cloud/mobile comme depuis PC ; VS Code local est facultatif.
Chaque PR significative préparée par un agent inclut un compte rendu pédagogique et des
questions de compréhension. Le fonctionnement et les contrôles automatisés ne remplacent
pas la compréhension ni la validation humaine. Les commentaires expliquent les intentions
et comportements non évidents, et le guide porte les détails utiles à l'apprentissage.

## 2026-10-06 — Un seul dépôt

Regrouper backend, frontend et documentation. Pour un développeur solo et un MVP,
une PR peut ainsi réunir le contrat API, le code et les tests du même parcours.
Chaque partie conserve son propre emplacement et ses commandes de contrôle.

## Stack validée avant l'initialisation

Backend Python/FastAPI avec PostgreSQL, SQLAlchemy et Alembic ; frontend Angular/TypeScript.
La PWA couvrira des usages hors connexion ciblés sur le terrain.
Le backend Python soutient la trajectoire Data/IA ; le projet couvre aussi les compétences CDA.

## 2026-10-06 — Automatiser les contrôles, garder la fusion manuelle

Une issue par tâche, une branche courte et une PR. Codex prépare le code et les preuves de
vérification. Arthur relit et fusionne. La CI et les dépendances sont automatisées progressivement.
GitHub reste la source du suivi des tâches ; les décisions durables vivent ici.

## 2026-10-06 — Socle progressif

Premier incrément : API minimale et workflow vérifiable. Le socle utilise Python 3.12.
uv verrouille les versions effectives dans `uv.lock`. Angular et la persistance seront des PR
distinctes avec leurs propres critères. La CI initiale ne prétend pas vérifier ces parties à venir.

## 2026-10-06 — Accueil Angular et contrôles

Angular 22.2.1 stable et Node 24.21.0 LTS sont compatibles selon la documentation officielle.
Application strict/standalone avec routage, HttpClient et signals, sans Zone.js ni SSR.
Vitest/jsdom est le runner natif de cette CLI ; angular-eslint analyse TypeScript et templates.
Les dépendances sont verrouillées par npm et la CI utilise la même version de Node.

Le service de santé valide le JSON reçu et limite l'attente à cinq secondes. L'accueil
affiche un résultat lisible et permet de réessayer sans développer de parcours métier.
Le proxy local garde une URL relative, sans modifier le contrat backend ni ajouter CORS.
Les commentaires français et le guide du code servent la présentation orale du projet.
Le fichier ruleset prévoit Frontend ; son activation distante attend une tâche dédiée.
