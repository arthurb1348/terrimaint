# Bilan du projet TerriMaint

## Référence et usage

- Date de vérification : 2026-10-16 (Europe/Paris).
- Dépôt source : [arthurb1348/terrimaint](https://github.com/arthurb1348/terrimaint).
- Code de référence : `main`, commit `406de5305c4809db82c84e2e97e58ce589061868`.
- Périmètre : état constaté du code, des configurations et de la documentation ;
  les PR non fusionnées ne font pas partie des fonctionnalités implémentées.

Ce bilan versionné est la synthèse de référence. Les sources liées dans chaque section
permettent de vérifier les affirmations ; le code intégré sur GitHub prévaut en cas d'écart.
Le document prépare une réutilisation future par un humain ou un agent, sans synchronisation
externe actuellement installée. Les statuts utilisés sont **implémenté**, **en cours**,
**prévu** et **non présent**. Une intention documentée ne prouve pas une implémentation.

## Nom et objectif

**TerriMaint — Du terrain à la décision.** Projet de formation CDA pour les petites
collectivités : relier les signalements de terrain au suivi des équipements et des
interventions, avec un historique partagé entre agents et responsable.
Ces parcours sont l'objectif produit, pas les capacités actuelles de l'application.
Source : [contexte produit](project.md).

## Migration proposée (en cours)

Cette branche remplace le backend par Django 5.2.18 / DRF 3.16.1, avec SQLite local,
sans modèle ni migration. La santé reste HTTP 200 et JSON exact, sans accès DB ; le frontend
et son proxy sont conservés. Les routes `/openapi.json`, `/docs`, `/redoc` deviennent 404.
Les 12 tests pytest-django vérifient le HTTP et la configuration des secrets. FastAPI,
Uvicorn, Pydantic et httpx sont retirés. Ruff et les contrôles système Django passent ;
les 13 tests frontend, lint et build passent avec Node/npm aux versions du dépôt.
Un appel HTTP réel direct et via le proxy Angular a confirmé HTTP 200 et le JSON exact.
Aucun contrôle visuel mobile/clavier n'a été réalisé.
Les commandes et la structure de cette proposition sont dans le [guide](code-guide.md).
Cette migration reste **en cours** jusqu'à relecture et fusion ; les sections « actuelle »
et « implémentées » ci-dessous décrivent le `main` de référence, encore FastAPI.

## Architecture actuelle

- Un seul dépôt pour backend, frontend, documentation et contrôles.
- API FastAPI construite par une fabrique `create_app()`, exécutée avec Uvicorn.
- Client Angular strict, composants standalone, routage et état réactif par signals ;
  sans SSR ni Zone.js.
- Circulation des données : accueil → service `ApiHealth` → HTTP GET `/api/v1/health`
  → FastAPI → JSON `{"status":"ok"}` → état affiché.
- En développement, le proxy Angular transmet `/api/**` à `http://127.0.0.1:8000`.
- Aucun stockage persistant, modèle métier, authentification ou système de rôles présent.
  Aucun déploiement de production défini ; l'URL relative de l'API devra être prise en
  charge par l'hébergement choisi ultérieurement.

Sources : [API](https://github.com/arthurb1348/terrimaint/blob/406de5305c4809db82c84e2e97e58ce589061868/backend/src/terrimaint_api/main.py),
[service HTTP](../frontend/src/app/api-health.ts),
[configuration Angular](../frontend/src/app/app.config.ts),
[proxy](../frontend/proxy.conf.json).

## Stack effectivement présente

| Partie | Technologies présentes et versions de référence | Source |
| --- | --- | --- |
| Backend | Python 3.12 pour le socle/CI ; FastAPI 0.142.2, Uvicorn 0.54.0 ; Pydantic pour le contrat HTTP | [.python-version](../.python-version), [pyproject.toml](https://github.com/arthurb1348/terrimaint/blob/406de5305c4809db82c84e2e97e58ce589061868/pyproject.toml), [uv.lock](https://github.com/arthurb1348/terrimaint/blob/406de5305c4809db82c84e2e97e58ce589061868/uv.lock) |
| Qualité Python | uv, pytest 9.1.1, httpx, Ruff 0.16.10, pre-commit | [uv.lock](https://github.com/arthurb1348/terrimaint/blob/406de5305c4809db82c84e2e97e58ce589061868/uv.lock), [hooks](../.pre-commit-config.yaml) |
| Frontend | Angular/CLI 22.2.1, TypeScript 6.0.3, RxJS, HTML/CSS | [package.json](../frontend/package.json), [package-lock.json](../frontend/package-lock.json) |
| Outillage frontend | Node 24.21.0 LTS, npm 11.19.0, ESLint/angular-eslint, Vitest et jsdom | [.nvmrc](../.nvmrc), [package.json](../frontend/package.json) |
| Suivi et CI | Git/GitHub, GitHub Actions, Dependabot | [CI](../.github/workflows/ci.yml), [Dependabot](../.github/dependabot.yml) |

Django, DRF, PostgreSQL, PWA et IndexedDB sont **prévus**, non installés ou
implémentés dans ce socle. Les versions effectives des dépendances viennent des lockfiles ;
les bornes déclarées dans les manifestes ne doivent pas être prises pour des versions exactes.

## Fonctionnalités implémentées

| Fonctionnalité | Comportement et limites | Preuve |
| --- | --- | --- |
| Santé HTTP de l'API | GET `/api/v1/health`, statut 200 et JSON `{"status":"ok"}` ; ne vérifie aucune base de données | [API](https://github.com/arthurb1348/terrimaint/blob/406de5305c4809db82c84e2e97e58ce589061868/backend/src/terrimaint_api/main.py) |
| Documentation API | OpenAPI et interface FastAPI `/docs` | [tests HTTP](https://github.com/arthurb1348/terrimaint/blob/406de5305c4809db82c84e2e97e58ce589061868/backend/tests/test_health.py) |
| Accueil responsive | Signature du projet, statut de l'API et bouton de relance ; attente, disponible ou indisponible | [composant Home](../frontend/src/app/home/home.ts), [template](../frontend/src/app/home/home.html), [styles](../frontend/src/app/home/home.css) |
| Gestion des échecs HTTP | Validation du JSON, erreurs réseau/HTTP et délai maximal de cinq secondes ; annulation en quittant la page | [service](../frontend/src/app/api-health.ts), [composant](../frontend/src/app/home/home.ts) |
| Routage | Accueil sur `/`, redirection des routes inconnues vers l'accueil | [routes](../frontend/src/app/app.routes.ts) |

## Travaux en cours

La présente PR propose la migration Django/DRF décrite ci-dessus, sans fonction métier.
Le bilan distingue le `main` audité de cette proposition ; il sera actualisé après fusion.
Le suivi vivant des autres travaux reste dans les [issues](https://github.com/arthurb1348/terrimaint/issues)
et [PR](https://github.com/arthurb1348/terrimaint/pulls), sans recopier une liste vite périmée.

## Fonctionnalités prévues et non implémentées

Le [contexte produit](project.md) documente les intentions suivantes, sans échéance
ni ordre d'implémentation engagé :

- Fiches équipements et accès par QR code.
- Déclaration d'incidents par agent ou responsable, pièces jointes et localisation.
- Suivi/priorisation des incidents et historique partagé.
- Création, affectation et planification des interventions.
- Tableau de bord et indications de récurrence.
- Migration du backend vers Django/DRF puis persistance PostgreSQL avec ORM et migrations Django.
- Hors connexion ciblé : shell PWA, cache d'équipements, scan QR, fiches basiques,
  brouillons/photos et file IndexedDB avec reprise et dédoublonnage.
- Conteneurisation et déploiement introduits progressivement.
- IA, OCR, transcription et détection d'anomalies : extensions futures, hors prérequis MVP.

Les règles d'accès et données obligatoires restent à préciser par issue. Aucun de ces
parcours n'est annoncé comme disponible. La synchronisation de documentation externe
et de présentation est une étape future ; aucun connecteur ou automatisme n'est installé ici.

## Structure générale

| Emplacement | Rôle |
| --- | --- |
| `backend/src/terrimaint_api/` | Application et contrat de santé FastAPI |
| `backend/tests/` | Tests HTTP/OpenAPI |
| `frontend/src/app/` | Racine, routes, service HTTP, accueil et tests Angular |
| `frontend/public/`, `frontend/src/styles.css` | Ressources publiques et styles globaux |
| `docs/`, `docs/tasks/` | Contexte, bilan, décisions, workflow, guide et tâche Angular |
| `scripts/check.py` | Point d'entrée des contrôles Python |
| `.github/` | CI, Dependabot, modèles d'issues/PR et configurations GitHub |
| `AGENTS.md`, `README.md` | Consignes des agents et commandes de démarrage |
| `.vscode/` | Aides facultatives pour l'éditeur local |
| `pyproject.toml`, `uv.lock`, `frontend/package*.json` | Dépendances et verrouillage |

## Tests présents

- Backend : **2 tests pytest** dans [test_health.py](https://github.com/arthurb1348/terrimaint/blob/406de5305c4809db82c84e2e97e58ce589061868/backend/tests/test_health.py) :
  statut/JSON de santé et documentation OpenAPI. Appels en mémoire avec TestClient.
- Frontend : **13 cas Vitest dans 3 fichiers** :
  [routage](../frontend/src/app/app.spec.ts),
  [délai HTTP](../frontend/src/app/api-health.spec.ts),
  [accueil](../frontend/src/app/home/home.spec.ts).
  Ils couvrent l'attente, le succès, les JSON invalides, les erreurs HTTP/réseau,
  la relance, l'annulation, le délai de cinq secondes et les routes inconnues.
  HTTP simulé ; aucun serveur réel requis.
- Aucun test end-to-end navigateur, test de persistance ou test de parcours métier présent.
- Commandes : `uv run --locked python scripts/check.py` à la racine ;
  `npm run lint`, `npm test`, `npm run build` dans `frontend/`.

## CI/CD présente

- [GitHub Actions CI](../.github/workflows/ci.yml) déclenchée sur PR, push de `main`
  et lancement manuel (`workflow_dispatch`). Deux jobs indépendants sur Ubuntu 24.04.
- `Backend` : installation Python/uv, `uv sync --locked`, Ruff lint/format et pytest
  via `scripts/check.py`.
- `Frontend` : Node fixé par `.nvmrc`, `npm ci`, lint, tests et build de production.
  Artifact `frontend-build` conservé sept jours.
- Dependabot propose des PR hebdomadaires pour uv et GitHub Actions ; aucune entrée npm
  n'est configurée et aucune fusion automatique n'est prévue par le workflow.
- **CD non présente** : aucun workflow de déploiement.
- Le [ruleset versionné](../.github/rulesets/main.json) prévoit `Backend` et `Frontend`.
  Lecture distante au 2026-10-16 : [ruleset 24590632](https://github.com/arthurb1348/terrimaint/rules/24590632)
  actif sur `main`, PR et discussions résolues exigées, **Backend et Frontend obligatoires**,
  branche actualisée, historique linéaire, force pushes et suppression bloqués, aucun bypass.
  Zéro approbation tierce obligatoire ; la relecture par Arthur reste nécessaire.
  Source : [API du ruleset](https://api.github.com/repos/arthurb1348/terrimaint/rulesets/24590632).
  Le fichier local ne suffit pas à prouver les réglages distants ; cette lecture est datée.
- Les résultats de CI sont attachés à chaque commit/PR : une configuration présente ne
  prouve pas une exécution réussie. Cette PR documentaire demande des contrôles de liens,
  cohérence et périmètre ; les résultats GitHub Actions restent à consulter sur la PR.

## État de la documentation

- [README](../README.md) et [README frontend](../frontend/README.md) : démarrage et contrôles.
- [project.md](project.md) : objectifs, périmètre MVP, hors connexion et direction graphique.
- [decisions.md](decisions.md) : décisions durables et choix de stack.
- [workflow.md](workflow.md) : travail par issue/branche/PR, cloud/mobile et validation humaine.
- [technical-review.md](technical-review.md) : vue d’ensemble, limites, backend migré proposé et oral CDA.
- [code-guide.md](code-guide.md) : détail des fichiers présents et des configurations sans commentaires.
- [bootstrap.md](bootstrap.md) : historique/procédure du socle GitHub ;
  [tâche Angular](tasks/init-angular.md) : critères de l'incrément déjà intégré.
- Ce bilan : synthèse factuelle réutilisable, maintenue avec le dépôt.
- Aucun fichier de présentation existante n'est versionné dans le dépôt consulté ;
  son emplacement externe n'est pas établi par ce bilan. Aucun mécanisme de mise à jour
  de Google Docs/Slides, Gemini ou Apps Script présent ou ajouté.

## Décisions techniques et prochaines étapes

Les [décisions](decisions.md) retiennent le monorepo, Angular/TypeScript et la cible
**Django + DRF + PostgreSQL**. FastAPI reste le socle du `main` audité ; cette branche propose son remplacement.
SQLAlchemy/Alembic sont une ancienne orientation remplacée. PWA et hors connexion ciblé
restent futurs. Tests et sécurité sont à définir dès la conception de chaque incrément,
selon le [workflow](workflow.md), puis à vérifier en CI et en relecture humaine.

1. Relire cette documentation et la politique de commentaires ; fusion manuelle après validation.
2. Relire la migration Django/DRF de cette branche, ses contrats HTTP et ses contrôles.
3. Préciser le modèle métier et la persistance PostgreSQL avec ORM/migrations Django,
   puis les parcours MVP en petits incréments, avec règles d'accès entre collectivités.
4. Prévoir la validation des entrées, l'authentification, les autorisations, les tests d'accès
   refusés, les fichiers/photos et la conservation/synchronisation hors connexion.
5. Définir l'hébergement et les contrôles d'intégration/navigateur au fil des parcours.

Cet ordre indique des dépendances de travail, sans planning engagé. Aucune de ces protections
métier n'est implémentée aujourd'hui. Le commentaire du job `Frontend` a été corrigé dans le `main` audité ; aucune configuration
CI ni protection distante n'est modifiée par cette migration.

## Règles de mise à jour du bilan

- Mettre à jour ce fichier dans la PR qui change un état significatif du projet.
- Relever la date et le commit de `main` audité ; vérifier code, tests, manifestes,
  lockfiles, workflows et suivi GitHub. Garder les liens vers les preuves.
- Une fonctionnalité passe à **implémenté** lorsqu'elle existe dans le code intégré ;
  préciser ses limites et les contrôles réellement observés. Une PR ouverte reste **en cours**.
- Ne conserver dans **prévu** que les intentions explicitement documentées ; supprimer
  ou corriger les statuts périmés, sans inventer de planning ou de pourcentage d'avancement.
- Distinguer les fichiers de configuration souhaités des réglages distants effectivement lus.
- Les sorties externes futures seront dérivées de ce bilan ; les corrections reviennent
  dans GitHub via une PR. La relecture humaine reste nécessaire avant intégration.
