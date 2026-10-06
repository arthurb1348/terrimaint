# Comprendre le socle à l'oral

Le navigateur affiche un composant Angular. Un service appelle l'API FastAPI pour demander
son état de santé. Les tests vérifient ces comportements sans réseau externe. Les commentaires
en français expliquent les choix ; les identifiants restent en anglais pour suivre les conventions.

## Du navigateur au serveur

1. `frontend/src/index.html` déclare la langue française, la largeur mobile, le titre,
   l'icône et le point de montage `<app-root>`. `<base href="/">` sert au routage.
2. `src/main.ts` démarre le composant `App` avec les fournisseurs de `app.config.ts`.
   Les erreurs de démarrage sont journalisées dans la console, sans révéler un jeton.
3. `app.ts` et `app.html` accueillent le routeur. `app.routes.ts` associe `/` à `Home`
   et redirige une URL inconnue vers l'accueil. Les composants sont standalone.
4. `home/home.ts` vérifie l'API à l'initialisation. Le signal `state` actualise la vue.
   `refresh()` ne prend aucun paramètre et ne retourne rien : il lance une requête et
   stocke son résultat. `takeUntilDestroyed` annule la requête lorsque la page disparaît.
5. `api-health.ts` encapsule le GET `/api/v1/health`. `check()` retourne un Observable :
   l'abonnement déclenche le GET puis reçoit `available` ou `unavailable`. Le JSON est
   validé au runtime (`status` doit valoir `ok`) car un type TypeScript ne valide pas un
   serveur. Les erreurs HTTP, réseau ou JSON et le délai de cinq secondes sont transformés
   en `unavailable`. L'interface reste utilisable et le bouton permet de réessayer.
6. `home.html` affiche attente, succès ou erreur. Le bouton est désactivé pendant l'appel.
   La région `role="status"` annonce les changements aux lecteurs d'écran. Le statut
   contient du texte : il ne repose pas uniquement sur la couleur.
7. `home.css` organise l'accueil en deux colonnes puis une colonne sous 760 px et donne
   un focus clavier visible. `styles.css` fixe la palette, les dimensions et les polices.
   Inter et Source Serif 4 sont utilisées si elles sont installées, sinon les polices système
   et Georgia prennent le relais. Aucun téléchargement de police n'est nécessaire.
8. `public/favicon.svg` définit une icône T vectorielle ; les assets sont copiés au build.

## Backend et script de contrôle

| Fichier | Rôle et contrat |
| --- | --- |
| `backend/src/terrimaint_api/__init__.py` | Déclare le paquet, sans démarrer de serveur. |
| `backend/src/terrimaint_api/main.py` | `HealthResponse` décrit le JSON `{"status":"ok"}`. `create_app()` sans argument retourne une nouvelle application. La fonction locale `health()` retourne le modèle, sérialisé en JSON HTTP 200 par FastAPI. `app` est l'objet importé par Uvicorn. |
| `backend/tests/test_health.py` | Le premier test vérifie le code 200 et le JSON exact ; le second vérifie le titre et la présence de la réponse 200 dans OpenAPI. `TestClient` appelle l'API en mémoire. |
| `scripts/check.py` | `main()` lance Ruff lint, Ruff format puis pytest avec le même interpréteur. Aucun argument ; retourne 0 ou le code du premier échec, transmis au processus et à la CI. |

L'endpoint de santé confirme seulement qu'un processus répond. Il ne vérifie ni base de
données, ni authentification, ni fonctions métier. Le comportement Python existant est conservé.

## Ce que prouvent les tests frontend

| Fichier | Comportements observables |
| --- | --- |
| `src/app/home/home.spec.ts` | Attente et bouton désactivé, JSON valide, erreur HTTP, erreur réseau, quatre réponses invalides, récupération après relance et annulation à la destruction. Les helpers lisent le statut rendu et attendent sa mise à jour. |
| `src/app/api-health.spec.ts` | Sans réponse, aucun résultat avant 5 s puis indisponibilité et annulation du GET. L'horloge fictive est restaurée après le test. |
| `src/app/app.spec.ts` | La route `/` et une URL inconnue affichent l'accueil et sa réponse HTTP ; le routeur termine sur `/`. |

`provideHttpClientTesting()` remplace le transport réel après `provideHttpClient()`.
`expectOne()` contrôle l'URL, `flush()` fournit une réponse et `error()` simule le réseau.
`verify()` refuse une requête oubliée. Ces tests ne remplacent pas la vérification du proxy réel
ou de la mise en page dans un navigateur.

## Configurations sans commentaires

Ces fichiers JSON gardent une syntaxe valide. Leurs explications sont regroupées ici plutôt
que d'insérer des commentaires non reconnus par leurs outils.

| Fichier | Clés importantes et liens |
| --- | --- |
| `frontend/package.json` | `scripts` déclare start/lint/test/build. `dependencies` contient Angular et RxJS ; `devDependencies` les outils CLI, TypeScript, Vitest, jsdom, ESLint et Prettier. `engines` impose Node 24 et npm 11 compatibles ; `packageManager` précise npm 11.19.0. `private` évite une publication npm accidentelle. |
| `frontend/package-lock.json` | Versions résolues, liens de téléchargement et empreintes d'intégrité. Généré par npm, jamais édité à la main ; `npm ci` exige sa cohérence avec package.json. |
| `frontend/angular.json` | `projects.terrimaint` décrit l'application. `build` associe main.ts, tsconfig, styles et assets ; la production optimise, nomme les fichiers par empreinte et impose des budgets. `serve` référence le proxy et le build de développement. `test` utilise le runner Vitest natif d'Angular ; `lint` utilise le builder angular-eslint. `cli.analytics=false` désactive la télémétrie. |
| `frontend/proxy.conf.json` | `/api/**` comprend les sous-chemins avec le serveur Vite de la CLI. `target` vise Uvicorn en IPv4 sur le port 8000 ; `changeOrigin` adapte l'en-tête Host. Ce proxy ne s'applique qu'à `npm start`. |
| `frontend/tsconfig.json` | `compilerOptions` active les contrôles stricts TypeScript ; `angularCompilerOptions.strictTemplates` vérifie les templates. Les paramètres de modules/cible suivent Angular CLI 22. |
| `frontend/tsconfig.app.json` | Hérite de tsconfig.json, compile l'application et exclut les fichiers de tests. |
| `frontend/tsconfig.spec.json` | Hérite des mêmes règles strictes, inclut les tests et les types Vitest. |
| `frontend/.prettierrc` | Définit largeur, quotes et parsing des templates HTML pour garder un code lisible. |
| `.github/repository-settings.json` | Prévoit squash uniquement, suppression de la branche après fusion, issues actives, wiki et auto-merge désactivés. Aucun changement distant dans cette issue. |
| `.github/rulesets/main.json` | `enforcement=active`, cible exacte main, aucun bypass, PR et discussions résolues, historique linéaire, suppression et force push bloqués. `required_status_checks` prévoit Backend et Frontend avec branche actualisée. Le fichier décrit la configuration souhaitée ; le ruleset distant garde Backend seul jusqu'à une tâche dédiée. |
| `.vscode/settings.json` | Active pytest et Ruff pour Python ; format et corrections à la sauvegarde. |
| `.vscode/tasks.json` | Lance le contrôle Python ou Uvicorn à la racine ; les commandes npm se lancent dans frontend. |
| `.vscode/extensions.json` | Recommande les extensions Codex, Python, Ruff et Angular. |

En production, servir le build avec un retour vers `index.html` pour les routes Angular et
transmettre `/api/**` au backend via le serveur web. Le proxy de développement n'est pas
embarqué dans le build. Aucun déploiement ni configuration CORS distante n'est ajouté ici.

## Autres fichiers de configuration

- `.nvmrc` et `frontend/.node-version` déclarent Node 24.21.0 ; aucune installation globale
  n'est faite par le projet. La CI lit `.nvmrc`.
- `frontend/eslint.config.js` associe les règles recommandées TypeScript/Angular et les
  règles d'accessibilité HTML aux sources. Les templates inline sont également analysés.
- `.github/workflows/ci.yml` lance Backend et Frontend sur PR et main. Les actions sont
  épinglées par SHA ; les permissions sont limitées à la lecture. Un échec arrête le job.
- `.pre-commit-config.yaml` exécute les corrections Ruff locales au commit ; vérifier de
  nouveau le diff si un hook modifie un fichier. Les contrôles frontend restent en CI et npm.
- `pyproject.toml` décrit Python, les dépendances, le paquet wheel, pytest et Ruff ; `uv.lock`
  est généré par uv et `.python-version` fixe Python 3.12. Les commentaires ne changent pas
  la résolution des dépendances.
- `.github/dependabot.yml` propose des PR de mises à jour hebdomadaires pour uv et les
  actions. `.github/ISSUE_TEMPLATE/task.yml` structure les besoins et critères ; le modèle
  de PR guide le résultat, les preuves de vérification et la décision de fusion.
- `.editorconfig` fixe l'encodage et l'indentation ; `.gitattributes` normalise les fins de
  ligne ; `.gitignore` exclut environnements, dépendances, caches, builds et secrets.
- `AGENTS.md` fixe la règle des commentaires pédagogiques pour les prochaines tâches ;
  les documents de projet, décisions, workflow et bootstrap décrivent le contexte et le suivi.

## Versions et sources officielles

Choix vérifié le 6 octobre 2026 : Angular/CLI 22.2.1 stable et Node 24.21.0 LTS.
Node 26 installé sur le poste était encore Current ; les contrôles de cette tâche utilisent
une copie portable de Node 24 sans modifier cette installation.

- [Compatibilité Angular / Node / TypeScript](https://angular.dev/reference/versions)
- [Statuts des versions Node](https://nodejs.org/en/about/previous-releases)
- [Tests Vitest intégrés à Angular](https://angular.dev/guide/testing)
- [Tests des requêtes HTTP Angular](https://angular.dev/guide/http/testing)
- [Proxy du serveur de développement](https://angular.dev/tools/cli/serve)
- [angular-eslint et compatibilité des versions majeures](https://github.com/angular-eslint/angular-eslint)
