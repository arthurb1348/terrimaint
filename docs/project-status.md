# Bilan du projet TerriMaint

## Référence et usage

- Date de vérification : 2026-10-16 (Europe/Paris).
- Dépôt source : [arthurb1348/terrimaint](https://github.com/arthurb1348/terrimaint).
- Code de référence : `main`, commit `793c65fe1a90259d185c2e1263690e3495e41803`.
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

## Navigation Prototype proposée (en cours)

La branche `feat/prototype-navigation` propose les navigations des prototypes Agent et
Responsable : barre basse Agent, barre latérale Responsable sur ordinateur et menu repliable
sur mobile. Les deux espaces restent accessibles sur chaque format. Les liens actifs,
repères de focus et lien d'évitement sont conservés. Les pages restent des espaces réservés,
sans formulaire, authentification, modèle métier ou API supplémentaire. Le contrôle de santé
reste sur l'accueil général ; aucun statut de synchronisation n'est simulé.

Les nouvelles URL sous `/agent/…` et `/responsable/…` partagent les composants équipement et
incident. Les anciennes URL redirigent. Scanner, profil et agents affichent seulement une
explication de fonctionnalité à venir. Les décisions validées sur l'immobilisation réservée
au Responsable et le retrait du type d'incident sont dans [decisions.md](decisions.md).
Cette proposition reste **en cours** jusqu'à validation et fusion.

## Architecture Angular intégrée

La [PR #15](https://github.com/arthurb1348/terrimaint/pull/15) a intégré sur `main` le shell
responsive et cinq pages d'entrée différées : `/agent`, `/responsable`, `/equipements`,
`/incidents`, `/interventions`. `core/` porte le service de santé, `shared/` la navigation,
`features/` les pages métier encore sans données ni actions. Ces liens ne confèrent aucun rôle.

## Architecture actuelle

- Un seul dépôt pour backend, frontend, documentation et contrôles.
- API Django/DRF, configuration SQLite locale sans modèle ni migration métier.
- Client Angular strict, composants standalone, routage et état réactif par signals ;
  sans SSR ni Zone.js.
- Circulation des données : accueil → service `ApiHealth` → HTTP GET `/api/v1/health`
  → Django/DRF → JSON `{"status":"ok"}` → état affiché.
- En développement, le proxy Angular transmet `/api/**` à `http://127.0.0.1:8000`.
- Aucun stockage persistant, modèle métier, authentification ou système de rôles présent.
  Aucun déploiement de production défini ; l'URL relative de l'API devra être prise en
  charge par l'hébergement choisi ultérieurement.

Sources : [API](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/backend/src/terrimaint_api/health/views.py),
[service HTTP sur main](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/frontend/src/app/api-health.ts),
[configuration Angular](../frontend/src/app/app.config.ts),
[proxy](../frontend/proxy.conf.json).

## Stack effectivement présente

| Partie | Technologies présentes et versions de référence | Source |
| --- | --- | --- |
| Backend | Python 3.12 pour le socle/CI ; Django 5.2.18, DRF 3.16.1 ; SQLite local configuré, sans persistance métier | [.python-version](../.python-version), [pyproject.toml](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/pyproject.toml), [uv.lock](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/uv.lock) |
| Qualité Python | uv, pytest 9.1.1, pytest-django 4.14.0, Ruff 0.16.10, pre-commit | [uv.lock](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/uv.lock), [hooks](../.pre-commit-config.yaml) |
| Frontend | Angular/CLI 22.2.1, TypeScript 6.0.3, RxJS, HTML/CSS | [package.json](../frontend/package.json), [package-lock.json](../frontend/package-lock.json) |
| Outillage frontend | Node 24.21.0 LTS, npm 11.19.0, ESLint/angular-eslint, Vitest et jsdom | [.nvmrc](../.nvmrc), [package.json](../frontend/package.json) |
| Suivi et CI | Git/GitHub, GitHub Actions, Dependabot | [CI](../.github/workflows/ci.yml), [Dependabot](../.github/dependabot.yml) |

PostgreSQL, PWA et IndexedDB sont **prévus**, non installés ou implémentés dans ce socle.
Les versions effectives des dépendances viennent des lockfiles ;
les bornes déclarées dans les manifestes ne doivent pas être prises pour des versions exactes.

## Fonctionnalités implémentées

| Fonctionnalité | Comportement et limites | Preuve |
| --- | --- | --- |
| Santé HTTP de l'API | GET `/api/v1/health`, statut 200 et JSON `{"status":"ok"}` ; ne vérifie aucune base de données | [API](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/backend/src/terrimaint_api/health/views.py) |
| Anciennes routes API | `/openapi.json`, `/docs` et `/redoc` renvoient 404 ; aucune UI OpenAPI ajoutée | [tests HTTP](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/backend/tests/test_health.py) |
| Accueil responsive | Signature du projet, statut de l'API et bouton de relance ; attente, disponible ou indisponible | [composant Home](../frontend/src/app/home/home.ts), [template](../frontend/src/app/home/home.html), [styles](../frontend/src/app/home/home.css) |
| Gestion des échecs HTTP | Validation du JSON, erreurs réseau/HTTP et délai maximal de cinq secondes ; annulation en quittant la page | [service intégré](../frontend/src/app/core/api-health.ts), [composant](../frontend/src/app/home/home.ts) |
| Routage | Accueil sur `/`, cinq entrées métier différées et retour des URL inconnues à l’accueil | [routes](../frontend/src/app/app.routes.ts) |

## Travaux en cours

La présente PR propose la navigation issue du prototype décrite ci-dessus. La migration Django/DRF
est intégrée sur `main` par la [PR #13](https://github.com/arthurb1348/terrimaint/pull/13).
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
- Persistance PostgreSQL avec ORM et migrations Django.
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
| `backend/src/terrimaint_api/` | Projet Django et application de santé DRF |
| `backend/tests/` | Tests HTTP et configuration Django |
| `frontend/src/app/` | Racine, routes, service HTTP, accueil et tests Angular |
| `frontend/public/`, `frontend/src/styles.css` | Ressources publiques et styles globaux |
| `docs/`, `docs/tasks/` | Contexte, bilan, décisions, workflow, guide et tâche Angular |
| `scripts/check.py` | Point d'entrée des contrôles Python |
| `.github/` | CI, Dependabot, modèles d'issues/PR et configurations GitHub |
| `AGENTS.md`, `README.md` | Consignes des agents et commandes de démarrage |
| `.vscode/` | Aides facultatives pour l'éditeur local |
| `pyproject.toml`, `uv.lock`, `frontend/package*.json` | Dépendances et verrouillage |

## Tests présents

- Backend : **12 cas pytest-django** dans [test_health.py](../backend/tests/test_health.py)
  et [test_settings.py](../backend/tests/test_settings.py) : contrat santé JSON, méthodes,
  routes absentes, hôtes et configuration de la clé secrète. Aucun accès DB métier.
- Frontend : **13 cas Vitest dans 3 fichiers** :
  [routage sur main](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/frontend/src/app/app.spec.ts),
  [délai HTTP sur main](https://github.com/arthurb1348/terrimaint/blob/1990d02c4445648bc364893a2c9927b2b8b8bf6f/frontend/src/app/api-health.spec.ts),
  [accueil](../frontend/src/app/home/home.spec.ts).
  Ils couvrent l'attente, le succès, les JSON invalides, les erreurs HTTP/réseau,
  la relance, l'annulation, le délai de cinq secondes et les routes inconnues.
  HTTP simulé ; aucun serveur réel requis.
- L'architecture intégrée par la PR #15 comporte **21 cas Vitest** ; la proposition de
  navigation Prototype porte ce total à **32 cas**, incluant URL directes et historiques,
  contexte partagé, ouverture/fermeture du menu et absence de synchronisation fictive.
- Sur cette proposition : lint, 32 tests et build réussissent avec Node 24.21.0 / npm 11.19.0.
  Contrôle ponctuel Chromium sur 11 routes à 320, 390, 768 et 1440 px : absence de débordement,
  lien actif unique, icônes locales chargées en 24 × 24 px, menu mobile, changement d'espace
  et lien d'évitement au clavier vérifiés. Captures Agent mobile et Responsable desktop relues.
  HTTP intercepté pour ce contrôle ; l'intégration réelle Django/proxy n'a pas été rejouée.
- Aucun test end-to-end versionné, test de persistance ou test de parcours métier présent.
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
  prouve pas une exécution réussie. Les résultats de la proposition Angular sont à consulter sur sa PR.

## État de la documentation

- [README](../README.md) et [README frontend](../frontend/README.md) : démarrage et contrôles.
- [project.md](project.md) : objectifs, périmètre MVP, hors connexion et direction graphique.
- [decisions.md](decisions.md) : décisions durables et choix de stack.
- [workflow.md](workflow.md) : travail par issue/branche/PR, cloud/mobile et validation humaine.
- [technical-review.md](technical-review.md) : vue d’ensemble et oral CDA (certains passages historiques restent à actualiser après la migration).
- [code-guide.md](code-guide.md) : détail des fichiers présents et des configurations sans commentaires.
- [bootstrap.md](bootstrap.md) : historique/procédure du socle GitHub ;
  [tâche Angular](tasks/init-angular.md) : critères de l'incrément déjà intégré.
- Ce bilan : synthèse factuelle réutilisable, maintenue avec le dépôt.
- Aucun fichier de présentation existante n'est versionné dans le dépôt consulté ;
  son emplacement externe n'est pas établi par ce bilan. Aucun mécanisme de mise à jour
  de Google Docs/Slides, Gemini ou Apps Script présent ou ajouté.

## Décisions techniques et prochaines étapes

Les [décisions](decisions.md) retiennent le monorepo, Angular/TypeScript et la cible
**Django + DRF + PostgreSQL**. Django/DRF est intégré ; PostgreSQL reste futur.
SQLAlchemy/Alembic sont une ancienne orientation remplacée. PWA et hors connexion ciblé
restent futurs. Tests et sécurité sont à définir dès la conception de chaque incrément,
selon le [workflow](workflow.md), puis à vérifier en CI et en relecture humaine.

1. Valider la navigation issue du prototype proposée, puis décider sa fusion manuelle.
2. Définir les critères du premier parcours métier avant de développer ses écrans et son API.
3. Préciser le modèle métier et la persistance PostgreSQL avec ORM/migrations Django,
   puis les parcours MVP en petits incréments, avec règles d'accès entre collectivités.
4. Prévoir la validation des entrées, l'authentification, les autorisations, les tests d'accès
   refusés, les fichiers/photos et la conservation/synchronisation hors connexion.
5. Définir l'hébergement et les contrôles d'intégration/navigateur au fil des parcours.

Cet ordre indique des dépendances de travail, sans planning engagé. Aucune de ces protections
métier n'est implémentée aujourd'hui. Le commentaire du job `Frontend` a été corrigé dans le `main` audité ; aucune configuration
CI ni protection distante n'est modifiée par cette proposition Angular.

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
