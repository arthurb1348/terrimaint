# Revue technique — comprendre et expliquer TerriMaint

Synthèse du 16 octobre 2026, fondée sur le code de `main` référencé dans le
[bilan](project-status.md). Ce document explique l'ensemble et prépare l'oral CDA.
Le [guide du code](code-guide.md) détaille les fichiers et configurations ; le
[README](../README.md) conserve les commandes de démarrage et de vérification.
Actualiser cette revue lorsque le fonctionnement change, sans recopier les versions de dépendances.

## Architecture et arborescence utile

Le navigateur exécute Angular et appelle une API HTTP. Aujourd'hui, cette API Django/DRF
répond uniquement à une vérification de santé ; aucun modèle ni stockage métier n'est présent.
La cible est Angular → API Django/DRF → PostgreSQL ; seul PostgreSQL reste à raccorder.

| Emplacement | Responsabilité actuelle |
| --- | --- |
| [frontend/src/](../frontend/src/) | Interface Angular, démarrage, routes et styles |
| [frontend/src/app/](../frontend/src/app/) | Racine `App`, service `ApiHealth`, accueil `Home` et tests |
| [backend/src/terrimaint_api/health/views.py](../backend/src/terrimaint_api/health/views.py) | Vue DRF et contrat de santé |
| [backend/tests/test_health.py](../backend/tests/test_health.py) | Tests HTTP en mémoire |
| [scripts/check.py](../scripts/check.py) | Ruff lint/format, contrôle Django puis pytest, arrêt au premier échec |
| [.github/](../.github/) | CI, suivi des tâches et configuration souhaitée des protections |
| [docs/](./) et [AGENTS.md](../AGENTS.md) | Besoin, décisions, bilan et consignes de collaboration |

## Comment Angular démarre

1. [index.html](../frontend/src/index.html) contient le point de montage `<app-root>`.
2. [main.ts](../frontend/src/main.ts) appelle `bootstrapApplication(App, appConfig)`.
   Le navigateur reçoit le JavaScript compilé depuis TypeScript par les outils Angular.
3. [app.config.ts](../frontend/src/app/app.config.ts) fournit le routeur et `HttpClient`
   par injection de dépendances : les composants/services demandent ces outils à Angular.
4. [App](../frontend/src/app/app.ts) héberge le routeur dans son
   [template](../frontend/src/app/app.html). Les [routes](../frontend/src/app/app.routes.ts)
   associent `/` à `Home` et redirigent les URL inconnues vers l'accueil.
5. [Home](../frontend/src/app/home/home.ts) lance `refresh()` à l'initialisation.
   Un signal conserve l'état et fait actualiser le [template](../frontend/src/app/home/home.html).

Les composants sont standalone : ils déclarent leurs dépendances sans module Angular dédié.
TypeScript strict aide à détecter des erreurs avant exécution ; il ne valide pas les données réseau.

## Du clic à la réponse affichée

À l'ouverture ou au clic sur « Vérifier à nouveau », `Home` passe à `checking` et
s'abonne à l'Observable renvoyé par [ApiHealth](../frontend/src/app/core/api-health.ts).
Cet abonnement déclenche `GET /api/v1/health` via `HttpClient`.

Avec `npm start`, le [proxy local](../frontend/proxy.conf.json) transmet la requête à
`http://127.0.0.1:8000`. DRF renvoie HTTP 200 et `{"status":"ok"}`. Le service
vérifie la forme du JSON : `status` doit valoir `ok`, sinon le résultat est `unavailable`.
Une erreur HTTP, réseau, JSON ou cinq secondes sans réponse donne aussi `unavailable`.
Le signal reçoit `available` ou `unavailable` et le texte affiché change.

Le bouton est désactivé pendant l'attente ; quitter la page annule la requête grâce à
`takeUntilDestroyed`. Une réponse positive prouve seulement que l'API répond, sans garantie
sur une base de données ou des parcours métier. Le proxy est réservé au développement ;
l'hébergement futur devra transmettre `/api/**` et servir les routes Angular.

## Backend Django/DRF et persistance future

La configuration `settings.py` et les entrées WSGI/ASGI forment le projet Django.
Le routage conduit à l'application `health`, dont la vue DRF renvoie le JSON constant.
SQLite sert de configuration minimale, sans modèle, migration ni accès DB pour la santé.
Les variables d'environnement contrôlent debug, secret et hôtes ; voir le guide du code.
Les routes FastAPI de documentation renvoient désormais 404, sans consommateur identifié.
La [décision de migration](decisions.md) décrit le choix LTS et les limites de cet incrément.
PostgreSQL et les migrations métier seront introduits dans une tâche distincte.

Les modèles métier, l'authentification et les permissions restent à concevoir. Disposer des
outils Django/DRF ne prouve pas que l'isolation entre collectivités ou les contrôles d'accès
sont correctement appliqués : ils nécessiteront des règles serveur et des tests de refus.

## Ce que les tests prouvent

- **Backend, pytest** : [test_health.py](../backend/tests/test_health.py) vérifie statut/JSON
  et routes de documentation absentes. `APIClient` appelle Django en mémoire sans serveur.
- **Frontend, Vitest** : les tests d’[accueil](../frontend/src/app/home/home.spec.ts),
  de [service](../frontend/src/app/core/api-health.spec.ts) et de [routage](../frontend/src/app/app.spec.ts)
  vérifient les états affichés, les erreurs, JSON invalides, délai, relance, annulation et routes.
  Le transport HTTP est simulé : ils n'appellent pas un vrai backend.
- **Lint et build** : détectent des problèmes de règles, de typage et de compilation ; ils
  ne prouvent pas qu'un parcours métier répond au besoin.

Ces vérifications ne couvrent pas à eux seuls un échange réel navigateur/API, ni la persistance, ni les
permissions métier. Les commandes et le contrôle manuel du proxy/mobile/clavier sont dans
le README ; les mécanismes des simulations sont détaillés dans le guide du code.

## GitHub Actions, PR et protections

Le [workflow CI](../.github/workflows/ci.yml) se déclenche sur les PR, les push sur `main`
et manuellement. Deux jobs indépendants installent les dépendances verrouillées :
`Backend` lance le contrôle Python ; `Frontend` lance lint, tests et build, puis conserve
le build sept jours. L'issue #61 prépare un [workflow Hosting](firebase-hosting.md)
qui réutilise cet artifact après ces contrôles, dans un runner distinct, sans backend.
L'activation personnelle et la première publication authentifiée restent à Arthur.

Une issue précise le besoin ; une branche isole le changement ; la PR rend le diff et les
preuves vérifiables avant intégration. Au 16 octobre 2026, le ruleset distant exige une PR,
les deux contrôles `Backend` et `Frontend`, une branche actualisée et les discussions résolues,
sans bypass. Le [bilan](project-status.md#cicd-présente) donne la preuve datée des réglages.
Le JSON versionné décrit une intention ; seule une lecture distante confirme son application.

Arthur relit et décide de fusionner. Une CI verte ne valide ni sa compréhension ni tous les
risques. Le [workflow](workflow.md) impose critères → risques/permissions → tests adaptés
→ CI et relecture ; la [politique de commentaires](../AGENTS.md#politique-de-commentaires)
privilégie le pourquoi, avec les explications longues dans la documentation.

## Limites et travail à venir

- Aucun équipement, incident, intervention, compte, rôle ou stockage persistant implémenté.
- PostgreSQL, validation des entrées métier, authentification, autorisations,
  isolation des collectivités et tests des accès refusés restent à construire.
- Gestion sécurisée des photos/fichiers, PWA, cache, brouillons hors connexion et synchronisation
  restent futurs. Il faudra définir droits, conservation, reprise, conflits et doublons.
- Aucun test de bout en bout navigateur ni déploiement de production défini.

Le [bilan](project-status.md) porte les prochaines étapes ; le [contexte produit](project.md)
porte le périmètre prévu. L'accueil et la santé HTTP constituent un socle, pas un MVP métier.

## Glossaire court

| Terme | Sens dans ce projet |
| --- | --- |
| API / contrat HTTP | Interface entre client et serveur : URL, méthode, statut et données attendues |
| Composant / service | Un composant gère une vue ; un service partage une responsabilité, ici l'appel HTTP |
| Signal / Observable | Le signal conserve un état réactif ; l'Observable décrit des événements asynchrones auxquels on s'abonne |
| Proxy | Relais local des requêtes Angular vers le backend |
| ORM / migration | Traduction entre objets et données relationnelles / évolution versionnée du schéma |
| DRF | Django REST Framework, outils pour construire une API avec Django |
| PWA / IndexedDB | Application web avec capacités d'installation et hors connexion à configurer / stockage local du navigateur |
| CI / PR / ruleset | Contrôles automatiques / proposition de changement relue / conditions imposées par GitHub |
| Authentification / autorisation | Vérifier l'identité / vérifier le droit d'effectuer une action sur une donnée |

## Points à maîtriser pour l'oral CDA

Savoir suivre un clic depuis le template jusqu'à la réponse HTTP puis au signal affiché,
localiser les responsabilités et expliquer pourquoi les données reçues sont validées.
Savoir montrer un test de succès et un test d'échec, et dire ce qu'un transport simulé
ne vérifie pas. Expliquer la différence entre code installé, cible décidée et fonction prévue.
Justifier Django/DRF/PostgreSQL et le hors connexion ciblé en distinguant le socle migré et la persistance encore future.
Enfin, expliquer comment une PR, la CI et une relecture humaine se complètent.

Questions d'entraînement :

1. Pourquoi « API disponible » ne prouve-t-il pas que PostgreSQL fonctionne ?
2. Que se passe-t-il si l'API répond avec un JSON invalide ou ne répond pas pendant cinq secondes ?
3. Quels tests et permissions faudra-t-il prévoir pour empêcher l'accès aux incidents d'une autre collectivité ?
