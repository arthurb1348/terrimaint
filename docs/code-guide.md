# Guide des fichiers et configurations

Ce guide détaille le code présent et les configurations. La [revue technique](technical-review.md)
porte la vue d'ensemble, les limites, la cible Django/DRF/PostgreSQL et la préparation CDA.
Les chemins `src/...` ci-dessous sont relatifs à `frontend/`.

Le navigateur affiche un composant Angular. Un service appelle l'API Django/DRF pour demander
son état de santé. Les tests vérifient ces comportements sans réseau externe. Les commentaires
en français expliquent les choix ; les identifiants restent en anglais pour suivre les conventions.

## Du navigateur au serveur

1. `frontend/src/index.html` déclare la langue française, la largeur mobile, le titre,
   l'icône et le point de montage `<app-root>`. `<base href="/">` sert au routage.
2. `src/main.ts` démarre le composant `App` avec les fournisseurs de `app.config.ts`.
   Les erreurs de démarrage sont journalisées dans la console ; aucun mécanisme
   d’authentification ou de gestion de jetons n’est présent.
3. `app.ts`, `app.html` et `app.css` portent le shell commun : en-tête, navigation,
   contenu routé et pied de page. `app.routes.ts` conserve `/` vers `Home`, charge les cinq
   rubriques à la demande et redirige les URL inconnues vers l'accueil.
4. `home/home.ts` vérifie l'API à l'initialisation. Le signal `state` actualise la vue.
   `refresh()` ne prend aucun paramètre et ne retourne rien : il lance une requête et
   stocke son résultat. `takeUntilDestroyed` annule la requête lorsque la page disparaît.
5. `core/api-health.ts` encapsule le GET `/api/v1/health`. `check()` retourne un Observable :
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

## Cinq concepts Angular à comprendre

### 1. Un composant standalone décrit une partie de l'interface

Un composant associe une classe TypeScript à un template HTML et, si nécessaire, des styles.
`standalone: true` permet de l'utiliser sans déclarer de NgModule. Son tableau `imports`
déclare ce que son template utilise : `Agent` importe `RouterLink` pour ses liens ; `App`
importe `MainNavigation`, `RouterLink` et `RouterOutlet`. Les petites pages gardent leur
HTML dans `template`, l'accueil et le shell ont des fichiers séparés pour rester lisibles.

### 2. Le routing relie une URL à une page

`app.routes.ts` associe par exemple `/incidents` au composant `Incidents`.
`provideRouter(routes)` installe le routeur au démarrage, et `<router-outlet />` dans
`app.html` reçoit la page active. `routerLink="/incidents"` change de page sans recharger
le document. Le shell reste en place. `title` met à jour le titre du navigateur ;
`RouterLinkActive` et `ariaCurrentWhenActive="page"` signalent le lien actif.
La route `**` reste en dernier et renvoie les URL inconnues vers `/`.

### 3. Le lazy loading diffère le téléchargement d'une page

`loadComponent: () => import('./features/incidents/incidents').then((m) => m.Incidents)`
charge le code de cette page lors de la première navigation vers `/incidents`.
Le build produit cinq fichiers différés, un par rubrique. `Home` reste importé directement,
car c'est l'entrée habituelle. Ajouter des fichiers de routes enfants ou une stratégie de
préchargement n'est pas utile à ce stade. Ce mécanisme optimise le chargement : il ne
protège pas l'accès à une page et ne met rien hors connexion.

### 4. Un service et l'injection séparent HTTP et affichage

`core/api-health.ts` porte le contrat HTTP ; `Home` utilise `inject(ApiHealth)` sans
construire le service avec `new`. `providedIn: 'root'` rend ce service disponible dans
l'application. Lui-même obtient `HttpClient` par injection, grâce à `provideHttpClient()`
dans `app.config.ts`. Les tests remplacent le transport via `provideHttpClientTesting()`.
Le parcours reste : `Home.refresh()` → `ApiHealth.check()` → GET `/api/v1/health` →
JSON validé → signal `state` → texte rendu. Quitter l'accueil annule l'abonnement.

### 5. Les dossiers expriment les responsabilités

| Emplacement dans `src/app/` | Responsabilité actuelle et règle d'évolution |
| --- | --- |
| `core/` | Infrastructure globale : service de santé HTTP et son test. Les futurs services de session ou de synchronisation n'arriveront qu'avec leur besoin réel. |
| `shared/main-navigation/` | Élément d'interface commun au shell, sans état de rôle ni accès HTTP. `shared` n'importe pas les pages métier. Aucun composant générique supplémentaire n'est anticipé. |
| `features/agent/`, `features/responsable/` | Pages d'entrée des espaces ; elles pointent vers les mêmes rubriques. Le Responsable dispose aussi d'un lien vers l'espace Agent. |
| `features/equipements/` | Liste locale de démonstration et recherche, partagées par les deux espaces. Le futur accès API restera dans ce domaine. |
| `features/incidents/`, `features/interventions/` | Pages d'attente explicites ; les futurs composants et services propres au domaine y seront regroupés. |
| `home/` | Accueil existant conservé à son emplacement pour limiter les déplacements ; sa logique API ne change pas. |
| `app.*` | Assemblage du shell et des routes ; `styles.css` porte palette, focus et présentation commune des petites pages. |

Une fonctionnalité dépend de `core` pour l'infrastructure et de `shared` pour l'interface
réutilisable. On évite les imports entre domaines tant qu'un besoin concret ne le justifie pas.
Les espaces ne dupliquent pas les domaines par rôle. Aucune route ne simule une session,
un guard ou une permission : l'authentification et les contrôles serveur seront un incrément dédié.

### Où modifier et comment vérifier

- Nouvelle page ou URL : `app.routes.ts` et le dossier de fonctionnalité concerné.
- Liens communs : `shared/main-navigation/main-navigation.html` ; liens d'espace dans `agent.ts` et `responsable.ts`.
- En-tête et largeur : `app.html` / `app.css` ; palette et focus dans `styles.css`.
- Contrat de santé et délai : `core/api-health.ts` ; rendu du statut dans `home/`.

Les liens restent visibles sur mobile, avec retour à la ligne et cibles d'au moins 44 px.
Le lien « Aller au contenu » cible l'unique `main`, focalisable avec `tabindex="-1"`.
La palette et les polices locales existantes sont conservées. La liste Matériel utilise
des données fictives identifiées ; les autres pages métier restent des espaces réservés.

Lancer `npm run lint`, `npm test`, `npm run build` dans `frontend/`.
Dans un navigateur à 375 px et sur desktop : suivre les six liens, vérifier la page active,
le titre, l'absence de débordement et la navigation clavier (Tab, Entrée, lien d'évitement).
Vérifier aussi le statut API et sa relance avec Django démarré puis arrêté.

## Matériel : première liste de démonstration

Les URL `/agent/equipements` et `/responsable/equipements` chargent le même composant
standalone `Equipements`. Le shell et le routeur conservent le contexte de navigation.
Comme un composant Vue, un composant Angular associe une logique, un template et des styles ;
ici les trois fichiers sont séparés pour faciliter leur lecture. Aucun NgModule (ancien
conteneur de déclarations Angular) n'est nécessaire.

| Fichier | Rôle dans cet incrément |
| --- | --- |
| `src/app/features/equipements/equipment.ts` | L'interface TypeScript `Equipment` décrit un objet affiché : `id`, `name`, `location`, tous des textes (`string`). Elle vérifie les usages à la compilation et ne valide pas un JSON reçu du réseau. |
| `src/app/features/equipements/equipements-demo.ts` | Source des six équipements fictifs, avec identifiants stables. `readonly` interdit les modifications via ces types, sans figer les objets à l'exécution. |
| `src/app/features/equipements/equipements.ts` | État local de la recherche et calcul de la liste filtrée. Aucune requête ni sauvegarde. |
| `src/app/features/equipements/equipements.html` | Titre, mention de démonstration, champ étiqueté, bouton d'effacement, résultat annoncé et liste. |
| `src/app/features/equipements/equipements.css` | Palette existante, focus du champ, contrôles qui passent à la ligne et cartes : une colonne jusqu'à 760 px, deux au-delà. Les textes longs peuvent revenir à la ligne. |
| `src/app/features/equipements/equipements.spec.ts` | Tests des comportements visibles via saisie et clic : données initiales, nom/identifiant, casse, espaces, aucun résultat et effacement/focus. |
| `e2e/responsive.pw.ts` | Ajoute la recherche dans les deux espaces aux quatre formats, avec effacement au clavier, contexte et débordement contrôlés. |
| `docs/project-status.md`, `docs/decisions.md` | Bilan de la démonstration intégrée par la PR #20 et décisions de présentation. |

### De la saisie aux cartes

1. `search = signal('')` conserve la saisie. Un **signal** est une valeur réactive : Angular
   sait actualiser la vue quand elle change. Le rapprochement Vue est `ref('')` ; Angular
   lit avec `search()` et écrit avec `search.set(...)`, là où le script Vue utilise `.value`.
2. `[value]="search()"` relie la valeur du champ au signal. `(input)` reçoit l'événement
   de saisie et appelle `search.set(searchInput.value)`. `#searchInput` est une référence
   au champ HTML dans ce template, comparable à une template ref Vue. Cela correspond
   à `:value="search"` et `@input="search = $event.target.value"` côté template Vue,
   avec le typage de l'événement à adapter en TypeScript. On n'utilise pas ici de liaison
   bidirectionnelle telle que `v-model`.
3. `computed(...)` définit une valeur **dérivée** de `search`, comme `computed()` dans Vue.
   Angular mémorise son résultat et le recalcule au besoin quand le signal lu change.
   `trim()` enlève les espaces de début et de fin ; `toLowerCase()` normalise la casse.
   `includes()` cherche une sous-chaîne dans le nom **ou** l'identifiant. Les espaces internes
   et les accents ne sont pas supprimés. L'emplacement reste une information affichée.
4. `filter()` retourne un nouveau tableau contenant les objets qui correspondent. La
   **source** `DEMO_EQUIPMENT` garde toujours ses six objets ; `filteredEquipment()` est
   seulement la sélection affichée. Toute chaîne contient la chaîne vide : une recherche
   vide, même après `trim()`, restitue donc toute la liste sans cas spécial.
5. `@for (...; track equipment.id)` rend les cartes, comme `v-for` avec `:key="equipment.id"`
   dans Vue. `track` permet à Angular de reconnaître un même équipement malgré le filtrage ;
   l'index du tableau ne serait pas une identité stable. `@if` joue le rôle de `v-if` pour
   afficher la liste ou le message vide. Le paragraphe `role="status"` annonce le résultat
   aux technologies d'assistance sans déplacer le focus pendant la saisie.
6. Effacer remet le signal à `''`, met à jour la valeur du champ et la liste, puis rend le
   focus au champ pour continuer au clavier. Quitter la page détruit cet état local : la
   recherche n'est conservée ni dans l'URL, ni dans un stockage, ni dans un store global.

### Où changer les données et le comportement

Pour modifier les exemples, intervenir dans `equipements-demo.ts`. Pour changer les champs
affichés, adapter `Equipment` et le template ; pour changer la recherche, adapter le `computed`
et ses tests. Pour le futur raccordement, remplacer l'import de `DEMO_EQUIPMENT` dans le
composant par une source réactive alimentée par une API propre aux équipements. Le filtre
pourra lire cette source plutôt que la constante. Il faudra alors définir le contrat JSON,
valider les réponses, gérer chargement/erreur et tester les autorisations serveur ; l'interface
TypeScript seule n'assure aucune de ces protections. Aucun service générique n'est anticipé.

Figma a été consulté en lecture seule : fiche matériel Agent `188:29` dans le parcours
`188:3`, et présentation des équipements du parcours Responsable `188:6` (écran `188:10487`).
Ces parcours ne présentent pas de liste Matériel dédiée. Les cartes reprennent leur hiérarchie
nom/référence/emplacement et la charte existante ; il ne s'agit pas d'une fidélité vérifiée
à un prototype complet de cette liste. Les actions de fiche, statuts et synchronisation
restent hors de cet incrément.

### Essai manuel court et compréhension

Avec `npm start` dans `frontend/`, ouvrir chacune des deux URL Matériel. Vérifier les six
équipements et la mention de démonstration aux largeurs 320, 390, 768 et 1440 px. Saisir
`  tONDeUSE  `, puis `eq-veh-0042`, puis seulement des espaces et enfin `introuvable`.
Vérifier respectivement un résultat par nom, un par identifiant, six résultats et le message
vide. Depuis le champ, utiliser Tab puis Entrée sur « Effacer la recherche » : les six cartes
reviennent et le focus rejoint le champ. Vérifier le lien Matériel actif, les navigations
existantes et l'absence de défilement horizontal. Django n'est pas requis pour cette liste.

1. Pourquoi modifier `search` suffit-il à actualiser les cartes sans appeler une fonction de rendu ?
2. Pourquoi l'effacement peut-il retrouver les six équipements après un résultat vide ?
3. Quels fichiers et quelles vérifications faudrait-il faire évoluer pour recevoir les équipements d'une API ?

## Backend et script de contrôle

| Fichier | Rôle et contrat |
| --- | --- |
| `backend/src/terrimaint_api/__init__.py` | Déclare le paquet, sans démarrer de serveur. |
| `backend/manage.py` | Lance les commandes Django ; le paquet est installé par uv, sans manipulation de sys.path. |
| `backend/src/terrimaint_api/settings.py` | Configuration commune : environnement, hôtes, middleware, SQLite et DRF. |
| `backend/src/terrimaint_api/urls.py` | Inclut les routes de santé sous `/api/v1/`. |
| `backend/src/terrimaint_api/health/` | Application sans modèle : route exacte `health`, vue GET publique et JSON constant. |
| `backend/src/terrimaint_api/wsgi.py`, `asgi.py` | Entrées standard pour des serveurs Django futurs ; aucun serveur de production imposé. |
| `backend/tests/test_health.py` | APIClient appelle Django/DRF en mémoire via pytest-django ; contrat JSON exact, refus POST, anciennes routes absentes, hôte proxy accepté et hôte inconnu refusé. Aucun accès DB autorisé par pytest-django dans ces tests. |
| `scripts/check.py` | Ruff lint, format, vérification système Django puis pytest ; transmet le premier échec à la CI. |

### Configuration et circulation HTTP

Le proxy Angular relaie `/api/v1/health` avec `Host: 127.0.0.1:8000`. Django vérifie
l'hôte, résout `urls.py`, puis DRF appelle `health()` et sérialise la réponse.
Le renderer JSON évite une interface navigable DRF et conserve le corps exact
`{"status":"ok"}`. La santé reste publique, sans authentification, session ou requête SQL.
Les futurs endpoints métier devront définir et tester leurs permissions avant exposition.

`DJANGO_DEBUG` vaut `true` par défaut pour le développement ; seule la valeur `true`
(insensible à la casse) active ce mode. En dehors de ce mode, une `DJANGO_SECRET_KEY`
non vide est obligatoire. Ne pas utiliser la clé publique de développement ailleurs.
`DJANGO_ALLOWED_HOSTS` sépare les hôtes par des virgules, sans schéma ni port ;
les valeurs locales par défaut conviennent au proxy. `.env.example` documente ces variables,
mais n'est pas chargé automatiquement : le processus doit les recevoir de son environnement.
La configuration SQLite pointe vers `backend/db.sqlite3`, ignoré par Git ; aucun schéma
ni stockage métier n'est créé. Pour PostgreSQL, modifier `DATABASES` et ajouter pilote,
variables, migrations et tests dans une tâche dédiée.

### Différences assumées avec FastAPI

- GET santé : URL sans slash final, HTTP 200, JSON et Content-Type conservés.
- `/openapi.json`, `/docs`, `/redoc` : HTTP 404, aucun consommateur identifié dans le dépôt.
- POST santé : reste HTTP 405 ; le corps d'erreur et l'en-tête Allow sont ceux de DRF.
- OPTIONS est géré par DRF (métadonnées) ; HEAD reste refusé en HTTP 405. Ces réponses techniques
  ne sont pas utilisées par Angular ; aucun contrat FastAPI artificiel n'est ajouté.
- Les erreurs de routage Django sont HTML ; les erreurs de méthode DRF sont JSON.
  Le contrôle des hôtes peut refuser une requête inconnue avec HTTP 400.
- `APPEND_SLASH=False` garde les routes exactes, sans redirection implicite.
- CORS reste fermé : le proxy Angular suffit ; aucune origine tierce n'est autorisée.

Les tests de `backend/tests/test_settings.py` démarrent des processus indépendants :
ils vérifient le démarrage local sans secret, le refus hors debug sans secret, et le
démarrage hors debug avec un secret fourni.

## Ce que prouvent les tests frontend

| Fichier | Comportements observables |
| --- | --- |
| `src/app/home/home.spec.ts` | Attente et bouton désactivé, JSON valide, erreur HTTP, erreur réseau, quatre réponses invalides, récupération après relance et annulation à la destruction. Les helpers lisent le statut rendu et attendent sa mise à jour. |
| `src/app/core/api-health.spec.ts` | Sans réponse, aucun résultat avant 5 s puis indisponibilité et annulation du GET. L'horloge fictive est restaurée après le test. |
| `src/app/app.spec.ts` | Accueil et URL inconnues, un seul repère main, lien d'évitement, accès direct aux cinq pages, titres et lien actif, navigation Responsable → Agent → Incidents → Accueil, annulation du GET puis relance au retour. |
| `src/app/features/equipements/equipements.spec.ts` | Liste locale, démonstration, recherche par nom/identifiant, casse et espaces, emplacement exclu, résultat vide et effacement avec retour du focus. |

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
| `frontend/proxy.conf.json` | `/api/**` comprend les sous-chemins avec le serveur Vite de la CLI. `target` vise Django en IPv4 sur le port 8000 ; `changeOrigin` adapte l'en-tête Host. Ce proxy ne s'applique qu'à `npm start`. |
| `frontend/tsconfig.json` | `compilerOptions` active les contrôles stricts TypeScript ; `angularCompilerOptions.strictTemplates` vérifie les templates. Les paramètres de modules/cible suivent Angular CLI 22. |
| `frontend/tsconfig.app.json` | Hérite de tsconfig.json, compile l'application et exclut les fichiers de tests. |
| `frontend/tsconfig.spec.json` | Hérite des mêmes règles strictes, inclut les tests et les types Vitest. |
| `frontend/.prettierrc` | Définit largeur, quotes et parsing des templates HTML pour garder un code lisible. |
| `.github/repository-settings.json` | Prévoit squash uniquement, suppression de la branche après fusion, issues actives, wiki et auto-merge désactivés. Aucun changement distant dans cette issue. |
| `.github/rulesets/main.json` | `enforcement=active`, cible exacte main, aucun bypass, PR et discussions résolues, historique linéaire, suppression et force push bloqués. `required_status_checks` prévoit Backend et Frontend avec branche actualisée. Le fichier décrit la configuration souhaitée ; la lecture distante du 16 octobre 2026 confirme les deux contrôles obligatoires (voir le [bilan](project-status.md)). |
| `.vscode/settings.json` | Active pytest et Ruff pour Python ; format et corrections à la sauvegarde. |
| `.vscode/tasks.json` | Lance le contrôle Python ou Django à la racine ; les commandes npm se lancent dans frontend. |
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
Ce relevé est historique ; les versions de référence du dépôt viennent des manifestes,
des lockfiles et de `.nvmrc`, pas des outils installés dans un environnement de travail.

- [Compatibilité Angular / Node / TypeScript](https://angular.dev/reference/versions)
- [Statuts des versions Node](https://nodejs.org/en/about/previous-releases)
- [Tests Vitest intégrés à Angular](https://angular.dev/guide/testing)
- [Tests des requêtes HTTP Angular](https://angular.dev/guide/http/testing)
- [Proxy du serveur de développement](https://angular.dev/tools/cli/serve)
- [angular-eslint et compatibilité des versions majeures](https://github.com/angular-eslint/angular-eslint)


## Navigation du prototype (intégrée par la PR #16)

`app.routes.ts` associe chaque URL à une page et à un libellé de barre supérieure. Les URL
`/agent/…` et `/responsable/…` permettent de conserver l'espace en navigation et en accès
direct. Les mêmes composants équipement et incident sont réutilisés dans les deux espaces.
`loadComponent` télécharge une page métier à sa première visite ; l'accueil reste immédiat.

`App` observe la fin des navigations du Router. `toSignal` transforme cet événement RxJS en
état Angular ; `computed` en déduit l'espace, le libellé et l'accueil général. Il ne s'agit
pas d'un rôle authentifié. `MainNavigation` reçoit cet espace par `input`, calcule les liens
et utilise un `signal` pour l'ouverture du menu mobile Responsable. `RouterLinkActive`
ajoute l'état visuel actif et `aria-current="page"`, avec une correspondance exacte.

Les composants standalone déclarent directement leurs dépendances dans `imports`.
`UpcomingPage` partage uniquement la présentation des trois destinations non implémentées
(scanner, profil, agents), à partir des données de route. Aucun service métier n'est ajouté.

Pour modifier l'apparence : `app.css` porte la grille du shell, `shared/main-navigation/`
les deux navigations, `styles.css` la palette et les styles communs. Les icônes SVG locales
proviennent des instances des prototypes ; leurs dimensions originales sont conservées.
Les adaptations mobiles utilisent des media queries CSS ; elles n'attribuent aucun droit.
Le menu Responsable annonce son état avec `aria-expanded` et ferme après un clic ; le focus
rejoint le contenu lorsque le lien mobile disparaît. Le lien d'évitement mène au seul `main`.
Le contrôle de santé et son service restent inchangés et accessibles depuis l'accueil général.

## Accès Scanner et seuil de présentation (issue #21)

L'accueil Agent propose un lien « Scanner un QR code » ; la navigation commune à l'espace
Agent propose « Scanner ». Les deux restent visibles sous **1200 px de largeur de fenêtre**
et disparaissent à partir de **1200 px inclus**. Ce choix conserve l'accès à 768 px et à
1024 px en paysage, tout en simplifiant le grand écran à 1440 px. La largeur est exprimée
en pixels CSS : elle décrit l'espace disponible, sans déduire le type d'appareil, la présence
d'une caméra ou les droits de l'utilisateur.

| Largeur CSS | Navigation Agent |
| --- | --- |
| Jusqu'à 760 px | Accueil, Matériel, Scanner et Plus ; Incidents et Profil dans Plus |
| De 761 à moins de 1200 px | Accueil, Matériel, Scanner, Incidents et Profil directement |
| À partir de 1200 px | Accueil, Matériel, Incidents et Profil directement |

Une **media query** applique des règles CSS seulement lorsque sa condition est vraie.
`@media (min-width: 1200px)` signifie « si la fenêtre mesure au moins 1200 px » ; le navigateur
réévalue cette condition lors d'un redimensionnement, sans recharger la page ni exécuter de
logique Angular supplémentaire. Le seuil de Plus (760/761 px) répond à un autre besoin :
éviter des libellés trop serrés sur petit écran.

Les règles ajoutées utilisent `display: none`. L'élément ne prend alors plus de place et
son lien sort de la tabulation et de l'arbre d'accessibilité. Sur l'accueil, la classe est
portée par le **`li` entier**, afin de retirer aussi la puce et l'espace de la ligne. Dans
la navigation, les autres liens gardent `flex: 1 1 0` : ils partagent la largeur restante à
parts égales, sans colonne réservée à Scanner. Un simple masquage visuel avec conservation
de l'espace laisserait au contraire un trou.

| Endroit à modifier | Rôle |
| --- | --- |
| `src/app/features/agent/agent.ts` | Le `li.scanner-shortcut` contient le raccourci ; `styleUrl` charge ses styles. |
| `src/app/features/agent/agent.css` | Masque le `li` à partir de 1200 px. |
| `src/app/shared/main-navigation/main-navigation.html` | `[class.scanner-link]` ajoute la classe uniquement à la destination `/agent/scanner`. |
| `src/app/shared/main-navigation/main-navigation.css` | `nav a.scanner-link` masque ce lien au même seuil et garde la disposition flexible existante. |
| `src/app/app.routes.ts` | Conserve la route Scanner ; aucun masquage CSS ne doit en conditionner l'accès. |
| `e2e/responsive.pw.ts` | Vérifie visibilité, nombre et répartition des destinations, limites, redimensionnement, URL directe et clavier. |

Pour changer le seuil, modifier **les deux fichiers CSS**, les attentes Playwright et la
[décision UX](decisions.md). Il n'y a pas de nouvelle donnée ni de requête HTTP : Angular
produit les liens, CSS choisit leur présentation, et le routeur garde l'URL accessible.
Le scanner réel et la nouvelle saisie de code restent à développer dans un autre incrément.

Essai manuel : ouvrir `/agent` à 320, 390, 768 et 1440 px ; vérifier les deux accès, puis
redimensionner entre 1199, 1200 et 1201 px dans les deux sens, sans recharger. Parcourir au
clavier les liens d'accueil et de navigation : Scanner doit être ignoré à partir de 1200 px,
les quatre autres destinations doivent rester accessibles et réparties sans trou. Ouvrir
`/agent/scanner` directement à chaque largeur, puis vérifier Matériel/recherche et changer
vers l'espace Responsable pour contrôler sa navigation.

## Tests navigateur responsive

`frontend/playwright.config.ts` démarre Angular sur le port 4173 et définit quatre projets
Chromium : 320 × 568 et 390 × 844 avec toucher mobile, 768 × 1024 avec toucher, puis
1440 × 1024 sur ordinateur. Chaque test utilise une page et un contexte de navigateur neufs.
Les tests `.pw.ts` restent séparés des `.spec.ts` de Vitest ; `tsconfig.e2e.json` vérifie
leurs types avant leur exécution, et ESLint analyse aussi ces fichiers et la configuration.

`frontend/e2e/responsive.pw.ts` parcourt les 11 URL présentes. Il attend le contenu réellement
rendu puis mesure le débordement du document, avec un pixel de tolérance pour les arrondis.
Le menu Agent vérifie séparément que les quatre libellés mobiles tiennent dans leurs boutons
sur une ligne : une simple largeur de document correcte ne suffirait pas à détecter leur
coupure. Les scénarios couvrent aussi Plus au toucher, Échap et retour du focus, Fermer,
appui extérieur, navigation vers Incidents/Profil et maintien de l'espace Responsable.
Le lien d'évitement est essayé au clavier. Toute erreur JavaScript non gérée fait échouer
le scénario.

Deux scénarios Matériel, chacun exécuté aux quatre formats, vérifient aussi le filtrage par
nom et identifiant, la casse et les espaces, le message vide, l'effacement par Tab/Entrée,
le retour du focus et le maintien de l'URL et du lien actif dans chaque espace. Ils contrôlent
le débordement après saisie, y compris une recherche très longue, et après effacement.

Deux scénarios supplémentaires dans chacun des quatre projets contrôlent les accès Scanner
et leur seuil de présentation : visibilité sur l'accueil et dans la navigation, activation
des deux liens quand ils sont visibles, URL directe à toute largeur, tabulation, et accès
à Matériel. Le redimensionnement couvre 1024, 1199, 1200, 1201 et 1440 px puis revient jusqu'à
320 px sans rechargement. Les liens directs visibles doivent avoir des largeurs égales et
occuper tout l'espace intérieur de navigation, sans intervalle vide. Le total proposé pour
l'issue #21 est de **72 scénarios** (64 intégrés par la PR #20, plus huit).

La fixture `page` intercepte uniquement `/api/v1/health` et répond `{"status":"ok"}`.
L'objectif est la mise en page et la navigation : aucun serveur Django ni authentification
n'est utilisé. Les captures de chaque page et des menus ouverts sont jointes au rapport HTML.
Une capture et une trace sont également conservées en cas d'échec. Il n'y a pas de comparaison
automatique d'images de référence ; il faut encore relire les captures pour juger l'apparence.
Ces vérifications Chromium ne remplacent pas les essais sur téléphone physique ou Safari.

Depuis `frontend/`, installer le navigateur avec `npx playwright install chromium` (sous Linux,
`--with-deps` ajoute les bibliothèques système), puis lancer `npm run test:responsive`.
`npm run test:responsive:report` ouvre le dernier rapport. `.github/workflows/responsive.yml`
exécute la même commande sur chaque PR, sur `main` ou manuellement et conserve l'artifact
`responsive-report` sept jours, y compris après un échec de test. Les résultats générés sont
ignorés par Git. Le ruleset n'est pas modifié : `Responsive` est informatif au départ, tandis
que ses échecs restent rouges. Pour ajouter une page, compléter `routes` ; pour changer les
formats, modifier les projets Playwright ; pour changer l'interface, modifier ses composants.

Sources : [configuration CI Playwright](https://playwright.dev/docs/ci-intro),
[émulation](https://playwright.dev/docs/emulation),
[serveur de test](https://playwright.dev/docs/test-webserver).
