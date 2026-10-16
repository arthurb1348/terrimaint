# Décisions techniques

## 2026-10-16 — Architecture Angular par fonctionnalités (proposée)

Conserver Angular 22 strict/standalone, les signals, Vitest et l'accueil existant.
Le composant racine porte le shell responsive ; `shared/main-navigation` contient la
navigation commune sans état métier. Le service HTTP de santé et son test passent dans
`core/`. `home/` reste en place pour éviter une refonte sans bénéfice fonctionnel.

Les cinq pages `features/agent`, `responsable`, `equipements`, `incidents` et `interventions`
sont chargées par `loadComponent`. Les deux espaces pointent vers les mêmes domaines ;
le responsable pourra aussi réaliser les actions terrain. Une page d'entrée explicite suffit
à chaque domaine : aucun modèle, store, service métier ou composant générique anticipé.

Ces routes sont publiques et ne représentent pas des permissions. Authentification,
autorisations serveur et éventuels guards d'ergonomie viendront avec des règles testées.
Le shell garde la charte existante, sans maquette détaillée disponible dans le dépôt,
sans données simulées ni fonctionnalité hors connexion. Aucun ajout de dépendance.

## 2026-10-16 — Migration du socle vers Django/DRF (fusionnée)

Django 5.2 LTS et DRF 3.16 remplacent FastAPI, Uvicorn et Pydantic ; Python 3.12
reste la référence. uv verrouille les versions résolues. Le projet `terrimaint_api`
sépare configuration, routage, entrées WSGI/ASGI et application `health`, sans couche métier.
Le contrat GET `/api/v1/health` reste HTTP 200, JSON `{"status":"ok"}`, sans accès DB.
Le proxy Angular conserve l'origine du navigateur : aucune ouverture CORS n'est ajoutée.
Les tests passent à pytest-django/APIClient et vérifient explicitement les anciennes routes
OpenAPI/UI en 404 : aucun consommateur n'a été trouvé dans le dépôt.

SQLite local suffit à la configuration Django et aux futurs essais ; aucun modèle,
migration, compte, session ou PostgreSQL n'est introduit. La configuration DB est centralisée
pour le prochain incrément PostgreSQL. Les variables d'environnement pilotent le mode debug,
la clé secrète et les hôtes autorisés ; hors debug, une clé est obligatoire.
La CI existante garde la même commande ; le frontend conserve son code et son proxy.

## 2026-10-16 — Architecture cible et qualité dès la conception

- **Django + Django REST Framework** : un cadre commun pour les modèles, migrations,
  validation et API, avec les mécanismes d'authentification et de permissions à configurer
  et tester. Ce choix réduit l'assemblage d'outils pour un développeur solo et reste en Python.
- **PostgreSQL** : une base relationnelle adaptée aux liens équipements/incidents/interventions,
  aux contraintes d'intégrité et aux transactions. Aucune persistance n'est encore implémentée.
- **Angular + TypeScript** : conserver le frontend déjà initialisé ; composants, routage,
  typage strict et tests soutiennent des parcours maintenables. Le typage ne remplace pas
  la validation des réponses reçues ni celle des entrées côté serveur.
- **PWA avec hors connexion ciblé** : répondre aux pertes réseau du terrain sans promettre
  que toute l'application fonctionnera hors ligne. Cache, brouillons/photos et synchronisation
  restent à développer, avec règles de conservation, conflits et dédoublonnage explicites.
- **Tests et sécurité intégrés dès la conception** : définir critères, risques et permissions
  avant de coder, puis tester succès et refus. Les contrôles CI complètent la relecture humaine.

Cette décision remplace l'ancienne cible FastAPI/SQLAlchemy/Alembic. Au moment de cette décision documentaire, le socle
était encore FastAPI. La migration Django/DRF est décrite ci-dessus ; PostgreSQL reste futur.

La politique de commentaires d’[AGENTS.md](../AGENTS.md) privilégie la lisibilité et le pourquoi ;
les explications longues vont dans `docs/`, sans commentaire automatique à chaque bloc.

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

## Historique — Stack validée avant l'initialisation (remplacée le 2026-10-16)

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
À cette date, le fichier ruleset prévoyait Frontend et son activation distante restait à faire.
La lecture GitHub du 16 octobre 2026 confirme désormais les deux contrôles obligatoires ;
voir le [bilan](project-status.md).
