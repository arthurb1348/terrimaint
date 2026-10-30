# Bilan du projet TerriMaint

## Référence et usage

- Date de vérification : 2026-10-30 (Europe/Paris).
- Dépôt source : [arthurb1348/terrimaint](https://github.com/arthurb1348/terrimaint).
- Code de référence : `main`, commit `fdaa85d531c77a34eb73b6075aa12200df163546`, vérifié sur GitHub et par Git distant.
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

## Navigation Prototype intégrée

La [PR #16 fusionnée](https://github.com/arthurb1348/terrimaint/pull/16) intègre les navigations
des prototypes Agent et Responsable : barre basse Agent, barre latérale Responsable sur ordinateur et menu repliable
sur mobile. Les deux espaces restent accessibles sur chaque format. Les liens actifs,
repères de focus et lien d'évitement sont conservés. Hormis Matériel de démonstration intégré
par la PR #20, les pages restent des espaces réservés, sans formulaire métier,
authentification, modèle métier ou API supplémentaire. Le contrôle de santé
reste sur l'accueil général ; aucun statut de synchronisation n'est simulé.

Les nouvelles URL sous `/agent/…` et `/responsable/…` partagent les composants équipement et
incident. Les anciennes URL redirigent. Scanner, profil et agents affichent seulement une
explication de fonctionnalité à venir. Les décisions validées sur l'immobilisation réservée
au Responsable et le retrait du type d'incident sont dans [decisions.md](decisions.md).
Sur mobile jusqu'à 760 px, la navigation Agent affiche **Accueil, Matériel, Scanner et Plus**.
Plus ouvre Incidents et Profil, indique leur état actif et gère fermeture et focus. De 761 à
moins de 1200 px, les cinq destinations sont visibles directement. Depuis la
[PR #29 fusionnée](https://github.com/arthurb1348/terrimaint/pull/29), les deux accès Scanner
sont masqués à partir de 1200 px inclus, avec répartition de la navigation entre les quatre
autres destinations. La route `/agent/scanner` reste accessible par URL directe à toute largeur.
La [décision](decisions.md) décrit ce seuil de présentation, sans détection de caméra ni permission.

## Architecture Angular intégrée

La [PR #15](https://github.com/arthurb1348/terrimaint/pull/15) a intégré sur `main` le shell
responsive et cinq pages d'entrée différées : `/agent`, `/responsable`, `/equipements`,
`/incidents`, `/interventions`. `core/` porte le service de santé, `shared/` la navigation,
`features/` les pages métier. Matériel affiche désormais une liste locale et une recherche ;
les autres pages restent sans données métier ni actions opérationnelles.
Ces liens ne confèrent aucun rôle.

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
[service HTTP](../frontend/src/app/core/api-health.ts),
[configuration Angular](../frontend/src/app/app.config.ts),
[proxy](../frontend/proxy.conf.json).

## Stack effectivement présente

| Partie | Technologies présentes et versions de référence | Source |
| --- | --- | --- |
| Backend | Python 3.12 pour le socle/CI ; Django 6.1.2, DRF 3.18.3 ; SQLite local configuré, sans persistance métier | [.python-version](../.python-version), [pyproject.toml](../pyproject.toml), [uv.lock](../uv.lock) |
| Qualité Python | uv, pytest 9.1.1, pytest-django 4.14.0, Ruff 0.17.2, pre-commit | [uv.lock](../uv.lock), [hooks](../.pre-commit-config.yaml) |
| Frontend | Angular 22.2.1, CLI 22.2.4, builder 22.2.5, Vite 8.3.5, TypeScript 6.0.3, RxJS, HTML/CSS | [package.json](../frontend/package.json), [package-lock.json](../frontend/package-lock.json) |
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
| Routage | Accueil sur `/`, onze URL avec contexte Agent/Responsable, anciennes URL redirigées et retour des URL inconnues à l’accueil | [routes](../frontend/src/app/app.routes.ts) |
| Matériel de démonstration | Six équipements fictifs, recherche locale par nom/identifiant et effacement avec retour du focus, dans les deux espaces ; aucune API métier | [PR #20 fusionnée](https://github.com/arthurb1348/terrimaint/pull/20), [composant](../frontend/src/app/features/equipements/equipements.ts) |

## Matériel de démonstration intégré

La [PR #20](https://github.com/arthurb1348/terrimaint/pull/20), **fusionnée le 23 octobre 2026**
(commit `f36d19f31d29b11969405216eb43bb96b147f061`), intègre la page Matériel
commune à `/agent/equipements` et `/responsable/equipements`, qui affiche six équipements fictifs,
avec identifiant stable, nom et emplacement textuel. Une mention visible identifie les données
de démonstration. La recherche locale porte sur le nom et l'identifiant, ignore la casse et
les espaces de début/fin ; une recherche vide affiche tout. Le message vide et l'effacement
avec retour du focus au champ sont inclus. La source typée est séparée du composant.

Cet incrément intégré ne constitue pas un parcours connecté à une
API métier : aucune requête d'équipements, sauvegarde, fiche, CRUD, authentification, permission,
scan QR ou synchronisation. Les navigations existantes sont conservées. Le [guide du code](code-guide.md#matériel--première-liste-de-démonstration)
explique les fichiers, le filtrage et le futur point de raccordement API.

## Adaptation Scanner intégrée

L'[issue #21](https://github.com/arthurb1348/terrimaint/issues/21) est réalisée par la
[PR #29](https://github.com/arthurb1348/terrimaint/pull/29), **fusionnée le 30 octobre 2026**
(commit `4f5e3fc7b331482c5a2a994309f6481ee3f2acb1`). Les deux accès restent visibles sous
1200 px, dont 768 et 1024 px sur tablette, et sont masqués sur grand écran à partir de
1200 px inclus. Le raccourci disparaît avec sa ligne et la navigation se répartit sans trou.
Matériel/recherche, Plus, la navigation Responsable et la route directe sont conservés.
Le [guide du code](code-guide.md#accès-scanner-et-seuil-de-présentation-issue-21) détaille le choix.

## Maintenance de l'outillage intégrée

La [PR #30](https://github.com/arthurb1348/terrimaint/pull/30) est **fusionnée le 30 octobre 2026**
(commit `fdaa85d531c77a34eb73b6075aa12200df163546`). Elle fixe `@angular/build` à 22.2.5,
dont le manifeste officiel déclare Vite 8.3.5. Le lockfile
régénéré par npm ne contient plus que Vite 8.3.5, au lieu de 8.3.3 à la racine et de 8.3.0
sous le builder. L'audit de départ signale Vite et son parent, soit deux paquets affectés ;
les contrôles après mise à jour puis après installation propre ne signalent aucune vulnérabilité.
Ce constat est daté, limité aux alertes connues par npm, et ne vaut pas validation de sécurité
de l'application. Les autres dépendances directes et Node/npm sont conservés ; les dépendances
indirectes nécessaires au builder évoluent sans override Vite ni `npm audit fix --force`.

Après lecture des quatre scripts présents, seul `esbuild@0.28.2` est autorisé. Les scripts
d'`@parcel/watcher@2.6.0`, `lmdb@3.5.6` et `msgpackr-extract@3.0.4` sont refusés pour ces versions ;
leurs binaires précompilés restent installés. Le `.npmrc` du frontend active le contrôle strict
pour refuser avant exécution les versions avec script non examinées. L'installation propre
avec `npm ci --foreground-scripts` n'exécute que le `postinstall` d'esbuild ;
`npm install-scripts ls` ne présente plus de script non couvert. Les modules natifs et le
démarrage/rechargement Angular sont contrôlés sous Linux ; Windows et macOS restent à vérifier.
Les résultats complets sont consignés dans la PR #30. Sa
[CI](https://github.com/arthurb1348/terrimaint/actions/runs/41048825375) et son
[Responsive](https://github.com/arthurb1348/terrimaint/actions/runs/41048825272) réussis concernent
le commit proposé `cdffa3ac9430cf22521a46a35757a6c21ac051f1`, avant fusion.
Le [guide](code-guide.md#dépendances-frontend-et-scripts-dinstallation-npm) et la
[décision](decisions.md) expliquent les autorisations et les limites.

## Travaux en cours

L'[issue #31](https://github.com/arthurb1348/terrimaint/issues/31), sur
`feat/31-equipment-detail`, propose une **fiche Matériel de démonstration en revue jusqu'à fusion**.
Chaque nom de la liste devient un lien réel vers `/agent/equipements/:id` ou
`/responsable/equipements/:id`. Les deux chemins chargent le même composant, qui affiche
nom, identifiant et emplacement depuis la même source typée que la liste, avec une mention
visible « Données de démonstration ». L'état introuvable conserve un retour à Matériel.

La recherche est portée par `q` dans l'URL, transmise à la fiche puis à la liste par
« Retour au matériel ». La saisie et les résultats sont donc retrouvés, y compris après
rechargement, sans stockage persistant. Le contexte, Matériel actif et le parcours clavier
sont conservés. L'identifiant est observé pour actualiser une fiche réutilisée par le routeur.
La source fictive, les versions de dépendances et la politique npm de la PR #30 sont conservées.

Cet incrément est local et public : aucune API métier, permission, modification d'équipement,
formulaire d'incident, statut métier, historique ou scanner ajouté. Le
[guide du code](code-guide.md#fiche-partagée-et-circulation-des-données-issue-31-en-revue)
explique les routes, les paramètres et les endroits à modifier. Les résultats réels des
contrôles et les captures sont consignés dans la PR ; ils ne valent pas validation humaine.

Les tests responsive sont déjà **intégrés** par la
[PR #19](https://github.com/arthurb1348/terrimaint/pull/19), fusionnée le 23 octobre 2026
(commit `7b5d56fe8bf2bb588ca4205fc50f546306e5f079`). La navigation et la migration Django/DRF
sont intégrées par les [PR #16](https://github.com/arthurb1348/terrimaint/pull/16) et
[#13](https://github.com/arthurb1348/terrimaint/pull/13).
Le suivi vivant des autres travaux reste dans les [issues](https://github.com/arthurb1348/terrimaint/issues)
et [PR](https://github.com/arthurb1348/terrimaint/pulls), sans recopier une liste vite périmée.

## Fonctionnalités prévues et non implémentées

Le [contexte produit](project.md) documente les intentions suivantes, sans échéance
ni ordre d'implémentation engagé :

- Liste d’équipements connectée à une API métier, fiches et accès par QR code.
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
- Frontend intégré : **50 cas Vitest dans 4 fichiers** :
  [routage et navigation](../frontend/src/app/app.spec.ts),
  [service HTTP](../frontend/src/app/core/api-health.spec.ts),
  [accueil](../frontend/src/app/home/home.spec.ts),
  [Matériel](../frontend/src/app/features/equipements/equipements.spec.ts).
  Ils couvrent l'attente, le succès, les JSON invalides, les erreurs HTTP/réseau,
  la relance, l'annulation, le délai de cinq secondes et les routes inconnues.
  HTTP simulé ; aucun serveur réel requis.
- La navigation intégrée inclut URL directes et historiques, contexte partagé,
  ouverture/fermeture des menus, focus et absence de synchronisation fictive.
- Intégré par la [PR #19](https://github.com/arthurb1348/terrimaint/pull/19) :
  [configuration Playwright](../frontend/playwright.config.ts) et
  [56 scénarios navigateur de référence](https://github.com/arthurb1348/terrimaint/blob/7b5d56fe8bf2bb588ca4205fc50f546306e5f079/frontend/e2e/responsive.pw.ts),
  soit 11 pages et trois parcours de navigation/clavier dans quatre formats : 320 × 568,
  390 × 844, 768 × 1024 et 1440 × 1024. Débordement, libellés Agent, menus, toucher, focus,
  lien d'évitement et erreurs JavaScript sont contrôlés ; captures jointes au rapport.
  La santé HTTP est simulée, sans preuve d'intégration Django/proxy ou de permissions.
  La CI du dernier commit de la PR #19 (`6bf22293cdff49970a2685c4cf3327dbc6847194`)
  a été consultée : [CI réussie](https://github.com/arthurb1348/terrimaint/actions/runs/39932815516)
  et [Responsive réussi](https://github.com/arthurb1348/terrimaint/actions/runs/39932815661).
- La [PR #20 fusionnée](https://github.com/arthurb1348/terrimaint/pull/20) ajoute
  **12 cas Vitest** pour Matériel (inclus dans les 50 ci-dessus) et deux parcours Playwright
  dans quatre formats (soit **64 scénarios intégrés**). Les scénarios
  Matériel contrôlent la recherche dans les deux espaces, le résultat vide, l'effacement au
  clavier, le focus, le contexte et le débordement après saisie/effacement.
  Sa [CI réussie](https://github.com/arthurb1348/terrimaint/actions/runs/39973749045) et son
  [Responsive réussi](https://github.com/arthurb1348/terrimaint/actions/runs/39973749049) concernent
  le commit proposé `0c0fd95fec4273188992ab4d29ecd3efc23b9fe9` ; les artifacts étaient conservés
  sept jours. Ces liens historiques ne prouvent pas les contrôles d'un nouveau commit.
- La [PR #29 fusionnée](https://github.com/arthurb1348/terrimaint/pull/29) ajoute
  **huit scénarios supplémentaires**, soit **72 intégrés** :
  accès Scanner dans les deux emplacements, URL directe et clavier, seuil et redimensionnement
  dans chacun des quatre formats. Elle vérifie aussi la répartition des destinations visibles.
  Les 50 cas Vitest restent inchangés. La [CI](https://github.com/arthurb1348/terrimaint/actions/runs/41036057026)
  et le [Responsive](https://github.com/arthurb1348/terrimaint/actions/runs/41036057013) réussis
  concernent le commit proposé `6d129a072923a5de183cccb1782f9931a29d844b`, avant fusion.
  La santé HTTP est simulée dans tous les tests responsive.
- La PR #30 fusionnée ne change aucun scénario ni code applicatif. Elle vérifie
  aussi l'installation propre, l'audit, les décisions de scripts et le démarrage/rechargement
  Angular. La description de sa PR fournit les résultats du commit concerné et leurs limites.
- L'issue #31 propose **16 cas Vitest supplémentaires**, soit **66 dans cinq fichiers** :
  fiche correcte, état introuvable, changement d'identifiant dans une même instance, paramètres
  de recherche, contexte et navigation aller-retour. Les tests existants de recherche passent
  désormais par le routeur pour observer `q`.
  Elle propose **104 scénarios Playwright**, soit 32 de plus : 15 URL de référence, dont les
  fiches valides/inconnues, et parcours clavier, accès direct, rechargement et retour dans les
  deux espaces aux quatre formats. Ces ajouts restent en revue jusqu'à fusion ; les résultats
  de la PR distinguent navigateur local et CI. La santé HTTP est simulée, sans intégration réelle
  Django/proxy ni validation de permissions.
- Aucun test de persistance ou de parcours métier complet présent.
- Commandes : `uv run --locked python scripts/check.py` à la racine ;
  `npm run lint`, `npm test`, `npm run build`, `npm run test:responsive` dans `frontend/`.

## CI/CD présente

- [GitHub Actions CI](../.github/workflows/ci.yml) déclenchée sur PR, push de `main`
  et lancement manuel (`workflow_dispatch`). Deux jobs indépendants sur Ubuntu 24.04.
- `Backend` : installation Python/uv, `uv sync --locked`, Ruff lint/format et pytest
  via `scripts/check.py`.
- `Frontend` : Node fixé par `.nvmrc`, `npm ci`, lint, tests et build de production.
  Artifact `frontend-build` conservé sept jours.
- Intégré par la PR #19 : workflow [Responsive](../.github/workflows/responsive.yml) séparé,
  sur PR, push de `main` et lancement manuel. Installation Chromium puis contrôle des types
  et tests Playwright. Rapport HTML, captures et traces d'échec conservés sept jours dans
  `responsive-report`. Ce contrôle est informatif, sans `continue-on-error` et sans
  modification du ruleset ; les jobs `Backend` et `Frontend` restent obligatoires.
- Dependabot propose des PR hebdomadaires pour uv et GitHub Actions ; aucune entrée npm
  n'est configurée et aucune fusion automatique n'est prévue par le workflow.
- **CD non présente** : aucun workflow de déploiement.
- Le [ruleset versionné](../.github/rulesets/main.json) prévoit `Backend` et `Frontend`.
  Lecture distante au 2026-10-23 : [ruleset 24590632](https://github.com/arthurb1348/terrimaint/rules/24590632)
  actif sur `main`, PR et discussions résolues exigées, **Backend et Frontend obligatoires**,
  branche actualisée, historique linéaire, force pushes et suppression bloqués, aucun bypass.
  Zéro approbation tierce obligatoire ; la relecture par Arthur reste nécessaire.
  Source : [API du ruleset](https://api.github.com/repos/arthurb1348/terrimaint/rulesets/24590632).
  Le fichier local ne suffit pas à prouver les réglages distants ; cette lecture est datée.
- Les résultats de CI sont attachés à chaque commit/PR : une configuration présente ne
  prouve pas une exécution réussie. Les résultats de la PR #19 sont liés ci-dessus ;
  chaque nouveau commit demande sa propre vérification.

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

1. Relire la PR de fiche Matériel de l'issue #31, ses tests et captures, puis décider sa fusion manuelle ; les PR #20, #29 et #30 sont déjà fusionnées.
2. Définir les critères du premier parcours métier avant de développer ses écrans et son API.
3. Préciser le modèle métier et la persistance PostgreSQL avec ORM/migrations Django,
   puis les parcours MVP en petits incréments, avec règles d'accès entre collectivités.
4. Prévoir la validation des entrées, l'authentification, les autorisations, les tests d'accès
   refusés, les fichiers/photos et la conservation/synchronisation hors connexion.
5. Définir l'hébergement et les contrôles d'intégration/navigateur au fil des parcours.

Cet ordre indique des dépendances de travail, sans planning engagé. Aucune de ces protections
métier n'est implémentée aujourd'hui. Le workflow responsive et ses 72 scénarios sont déjà
intégrés ; la nouvelle fiche complète les parcours sans modifier les jobs `Backend`/`Frontend`
ni les protections distantes.

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
