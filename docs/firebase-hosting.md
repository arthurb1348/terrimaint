# Prévisualisations Firebase Hosting — issue #61

## État et périmètre

Configuration préparée en PR ; **aucun déploiement authentifié n'a été exécuté pour
cette livraison**. La liaison Firebase/GitHub et la première preuve distante restent
à Arthur. Ne pas confondre un build vert, l'émulateur local et une publication réelle.

Utiliser le projet **TerriMaint existant**, Hosting classique et le forfait **Spark**.
Son ID public n'était pas accessible dans l'environnement de préparation ; aucun ID
n'est inventé ni fixé dans `.firebaserc`. Les fichiers Firebase de la revue PC ne sont
pas accessibles ici et ne sont pas modifiés. L'autre projet CDA ne doit jamais servir
de cible. Aucun App Hosting, Blaze, Functions, base Firebase ou backend Django.
Les prévisualisations sont publiques : utiliser uniquement les démonstrations fictives.

## Fonctionnement et contrôles

Les workflows restent dans `.github/workflows/` à la racine. `firebase.json`, également
à la racine, publie seulement `frontend/dist/terrimaint/browser`.

| Déclenchement de CI | Source contrôlée et publiée | Canal après activation |
| --- | --- | --- |
| PR ouverte/réouverte, nouveau commit (`pull_request`, événements par défaut) | SHA `head` exact de cette PR, même en brouillon | `pr-N`, seulement si PR du même dépôt vers `main` |
| Push sur `main`, notamment après fusion | SHA exact du push, s'il est encore le dernier `main` | `live` |
| CI → Run workflow, branche `main`, `pr_number=N` | SHA courant de la PR N ouverte, interne, vers `main` | `pr-N` |
| CI → Run workflow, branche `main`, numéro vide | SHA de `main` sélectionné pour cette exécution | `live` |
| Lancement manuel sur une autre branche, numéro vide | SHA de cette branche | aucun |
| PR d'un fork | SHA de la PR, contrôles sans secret Firebase | aucun |

Un numéro fourni depuis une branche autre que `main`, une PR externe/fermée ou une
PR visant une autre base sont refusés au lancement manuel. Pas de `pull_request_target`.
Les PR Dependabot ont des restrictions GitHub supplémentaires : leurs événements
ne reçoivent pas les secrets Actions ordinaires. Si leur publication automatique est
refusée pour ce motif, Arthur utilise le lancement manuel depuis `main`, sans copier
la clé vers de nouveaux emplacements ni élargir les droits du bot.
Le workflow réutilisable **Firebase Hosting** n'est pas lancé directement ; passer par CI.
L'ouverture seule de ce fichier sur `main` ne déclenche pas les PR déjà ouvertes :
utiliser le lancement manuel ci-dessous ou publier un nouveau commit dans leur branche.

Le job **Choisir la source** vérifie les protections de publication, puis **Backend**
et **Frontend** exécutent leurs contrôles habituels, en parallèle. Ils conservent leurs
noms exigés par le ruleset. Pour une PR, le checkout est désormais son **head exact**,
plutôt que le commit de fusion synthétique GitHub, afin que le SHA publié corresponde
au commit annoncé. Le ruleset garde la branche actualisée avant fusion ; **Responsive**
continue de contrôler le checkout de fusion GitHub habituel, sans modification.

Chaque publication exige le succès de **Choisir la source**, **Backend** (Ruff et pytest)
et **Frontend** (`npm ci`, lint, Vitest et build de production, dans `frontend/`).
**Responsive reste indépendant et ne bloque pas la publication** : un lien peut être
publié alors que ce contrôle est encore en cours ou rouge. Examiner son résultat avant
la validation humaine et la fusion. Le lancement manuel de CI pour une PR ne relance
pas Responsive sur cette PR ; son exécution PR existante doit être consultée.
Aucun second ensemble de suites n'est ajouté pour publier.

Le job de publication tourne sur un runner distinct, télécharge **frontend-build de
la même exécution**, sans reconstruire ni exécuter le code compilé. Sa configuration
et ses scripts viennent du commit du workflow appelant, pas de la PR choisie manuellement
(ainsi #60 peut être prévisualisée sans contenir les nouveaux fichiers Firebase).
Seule la dernière étape reçoit le secret Firebase. La CLI est installée auparavant,
hors de `frontend/` et sans identifiants. Les previews passent `--no-authorized-domains` pour ne pas modifier Firebase Auth.
Aucun hook `predeploy`/`postdeploy`, backend,
site supplémentaire ou ciblage implicite via `.firebaserc` n'est accepté.

Les tokens GitHub n'ont que `contents: read`, avec `pull-requests: read` dans les jobs
qui consultent l'état d'une PR. Aucun droit d'écriture pour publier un commentaire,
pousser ou fusionner ; le lien est dans le **résumé Actions**. Les contributions internes
restent de confiance : relire leurs modifications de workflows et scripts, car elles
peuvent accéder aux secrets du dépôt. Le code d'un fork ne reçoit pas ces identifiants.

## URL, commit et concurrence

Le même canal `pr-60`, par exemple, reçoit chaque nouveau commit validé de la PR #60.
Firebase attribue l'URL HTTPS lors de sa première publication ; **ne pas inventer son
suffixe aléatoire**. Elle reste stable tant que le canal existe. Chaque publication
repousse l'expiration à sept jours. Une PR inactive finit donc par perdre sa preview ;
une recréation après suppression/expiration peut recevoir une autre URL.

Après succès, ouvrir l'exécution **CI**, puis son résumé **Firebase Hosting** : URL,
canal, SHA complet et expiration y figurent. Le site expose aussi `/deployment.json`
avec `version`, `commit`, `channel`, `pullRequest` et `run` (URL de l'exécution). Le libellé de version
lisible est `TerriMaint pr-N SHA` ou `TerriMaint live SHA`. La preview retourne aussi
son identifiant technique Firebase dans le résumé. Pour live, le libellé est également
le message de release Firebase (`--message`). La CLI ne propose pas cette option pour
`hosting:channel:deploy` : le libellé de preview est donc dans le manifeste et le résumé. Le manifeste est ajouté au build téléchargé
juste avant publication et n'est pas un secret. Un échec n'écrit pas de résumé de succès.

CI sérialise les exécutions d'une même PR ou de `main`, y compris le lancement manuel.
Elle n'annule plus une exécution en cours. Le job Hosting possède aussi un verrou par
canal, sans annulation. Juste avant publication, il relit GitHub : un ancien `main`,
un head remplacé, une PR fermée ou devenue externe sont ignorés. Le verrou reste pris
pendant l'envoi ; un ancien envoi ne peut donc pas finir après un envoi plus récent.
Un commit arrivé pendant l'envoi attendra ses contrôles et sa publication ; le site
peut encore montrer le précédent pendant ce temps. GitHub peut remplacer une exécution
en attente par une plus récente ; seuls les derniers commits encore courants sont publiés.
Ne pas annuler manuellement un déploiement en cours ; toute relance revérifie la source.

## Activation sur le PC d'Arthur, après revue et fusion de la PR

Cette section décrit des opérations qu'**Arthur exécute personnellement**. Rien ici
n'a créé de compte de service, clé, rôle IAM ou secret pendant la préparation.
La commande officielle ci-dessous en crée : lire ses effets avant de la lancer.
Ne jamais afficher ou envoyer la clé JSON dans le chat, ni la committer.

### 1. Isoler la liaison et vérifier le projet

Conserver le dossier de revue PC et ses fichiers Firebase. Dans son dossier parent,
faire un **nouveau clone**, pas un worktree, pour recevoir les fichiers du générateur :

```sh
git clone https://github.com/arthurb1348/terrimaint.git terrimaint-firebase-link
cd terrimaint-firebase-link
git switch main
git pull --ff-only origin main
node --version
npm --version
gh auth status
npx --yes firebase-tools@15.34.2 login
npx --yes firebase-tools@15.34.2 projects:list
```

Toutes les commandes Firebase de cette procédure partent de cette **racine** (celle
qui contient `firebase.json`, `frontend/`, `backend/`, `.github/`), jamais de `frontend/`.
Utiliser Node **24.21.0** (`.nvmrc`) et npm **11.19.0** ; sélectionner/installer ces versions
avec le gestionnaire Node du PC si nécessaire. Si GitHub CLI n'est pas encore connecté,
Arthur effectue `gh auth login` sur son PC. Le login Firebase ouvre le navigateur du PC.

Dans la console Firebase, ouvrir **TerriMaint → Paramètres du projet → Général** et
relever son **ID de projet**, distinct du nom affiché. Recouper avec `projects:list`,
vérifier Hosting existant et **Spark**, puis vérifier le site Hosting par défaut :

```sh
npx --yes firebase-tools@15.34.2 hosting:sites:list --project ID_TERRIMAINT_VERIFIE
```

Remplacer `ID_TERRIMAINT_VERIFIE` par cet ID dans chaque commande suivante. Le workflow
vise le **site par défaut**, dont l'ID correspond à l'ID du projet. Si la configuration
PC vise un autre site ou plusieurs sites, arrêter cette liaison et faire adapter la
configuration en PR avant activation ; ne pas basculer vers le projet CDA.
Si Hosting n'existe pas dans ce projet, ne pas lancer d'initialisation de service annexe.

### 2. Effectuer la liaison officielle Firebase/GitHub

Depuis la même racine du clone isolé :

```sh
npx --yes firebase-tools@15.34.2 init hosting:github --project ID_TERRIMAINT_VERIFIE
```

Choisir le dépôt **arthurb1348/terrimaint** pendant l'autorisation GitHub. Répondre
**Non** à l'installation d'un script de build et **Non** à la mise en place du workflow
de déploiement live proposé par le générateur : les workflows de cette PR les gèrent déjà.

La CLI **15.34.2** crée/réutilise un compte de service GitHub, lui accorde les droits
nécessaires à son générateur généraliste, crée une clé et dépose directement sa valeur chiffrée dans GitHub Secrets.
La CLI génère le nom `FIREBASE_SERVICE_ACCOUNT_` suivi de l'ID de projet en majuscules
avec les tirets remplacés par des underscores. **Relever le nom exact annoncé par
la CLI**, ou la référence `firebaseServiceAccount` de son fichier généré
`.github/workflows/firebase-hosting-pull-request.yml`. Seul ce nom public est nécessaire.

Ne pas pousser les workflows générés (`firebase-hosting-pull-request.yml` et, s'il a
été demandé, `firebase-hosting-merge.yml`) : ils dupliqueraient CI, utilisent des tags
d'actions mobiles et ne suivent pas les garde-fous de cette PR. Aucun commit/push n'est
nécessaire dans ce clone de liaison. Les fichiers Firebase du dossier de revue initial
restent intacts. Suivre aussi le lien fourni par la CLI pour révoquer son autorisation
OAuth GitHub temporaire après la liaison ; cela ne retire pas le secret déposé.
Si un compte/secret existe déjà, le réutiliser après vérification ; ne pas recréer des
clés à répétition. En cas d'échec de création de clé/IAM, arrêter et examiner les droits
avec le propriétaire : ne pas élargir automatiquement les rôles ou les politiques.

### 3. Réduire les droits générés avant activation

Le générateur **15.34.2** accorde aussi des rôles utiles à d'autres produits : ne pas
laisser ces droits à cette automatisation statique. Dans la **console Google Cloud**,
projet **TerriMaint vérifié → IAM et administration → IAM**, repérer le compte affiché
par la CLI, `github-action-ID_NUMERIQUE_DEPOT@ID_TERRIMAINT_VERIFIE.iam.gserviceaccount.com`.
Le nombre est l'ID public du dépôt, consultable par :

```sh
gh api repos/arthurb1348/terrimaint --jq .id
```

Modifier **ce seul compte**, en conservant :

- **Firebase Hosting Admin** (`roles/firebasehosting.admin`) pour les canaux/versions ;
- **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`) pour consommer les API déjà activées.

Retirer les quatre rôles supplémentaires que ce générateur ajoute :
**Firebase Authentication Admin** (`roles/firebaseauth.admin`),
**Cloud Functions Developer** (`roles/cloudfunctions.developer`),
**Cloud Run Viewer** (`roles/run.viewer`) et
**API Keys Viewer** (`roles/serviceusage.apiKeysViewer`). Vérifier les droits hérités
ou attribués antérieurement si le compte existait déjà : aucun rôle Owner/Editor,
Functions, Run ou Auth n'est nécessaire ici. Ne pas modifier les permissions d'autres
comptes et ne pas créer de backend. Ces changements IAM restent à Arthur sur son PC ;
aucune commande de modification IAM n'a été exécutée par l'agent.

### 4. Renseigner les variables du dépôt, puis activer

Dans **GitHub → arthurb1348/terrimaint → Settings → Secrets and variables → Actions** :

| Type | Nom attendu | Valeur |
| --- | --- | --- |
| Variable de dépôt | `FIREBASE_PROJECT_ID` | ID public vérifié du projet TerriMaint |
| Secret de dépôt | nom exact `FIREBASE_SERVICE_ACCOUNT_…` généré par Firebase | déjà déposé par la CLI ; ne pas le lire/copier |
| Variable de dépôt | `FIREBASE_SERVICE_ACCOUNT_SECRET` | **nom** exact du secret ci-dessus, jamais son JSON |
| Variable de dépôt | `FIREBASE_HOSTING_ENABLED` | `true`, seulement après les vérifications de liaison |

Le workflow sélectionne `secrets[vars.FIREBASE_SERVICE_ACCOUNT_SECRET]` ; dans son
processus de publication, la valeur devient la variable temporaire
`FIREBASE_SERVICE_ACCOUNT`. Le `project_id` du JSON est comparé à
`FIREBASE_PROJECT_ID` avant utilisation. `GOOGLE_APPLICATION_CREDENTIALS` est un chemin
temporaire créé puis supprimé par le script, **pas** une variable à configurer sur GitHub.

Alternative avec GitHub CLI, toujours depuis la racine du clone, en remplaçant les
deux valeurs publiques ; ne jamais saisir de clé dans ces commandes :

```sh
gh secret list --repo arthurb1348/terrimaint
gh variable set FIREBASE_PROJECT_ID --repo arthurb1348/terrimaint --body 'ID_TERRIMAINT_VERIFIE'
gh variable set FIREBASE_SERVICE_ACCOUNT_SECRET --repo arthurb1348/terrimaint --body 'NOM_EXACT_DU_SECRET_GENERE'
gh variable set FIREBASE_HOSTING_ENABLED --repo arthurb1348/terrimaint --body 'true'
```

Sans `FIREBASE_HOSTING_ENABLED=true`, les contrôles tournent et le job Hosting est ignoré.
Une activation avec ID/secret manquant ou incorrect échoue sans succès Firebase annoncé.
Mettre cette variable à `false` suspend les futurs envois, sans effacer les sites existants.

### 5. Prévisualiser une PR déjà ouverte, notamment #60

Après fusion de cette automatisation dans `main` et activation : **Actions → CI → Run
workflow → Use workflow from: main → pr_number: 60 → Run workflow**. Équivalent PC :

```sh
gh workflow run ci.yml --repo arthurb1348/terrimaint --ref main -f pr_number=60
gh run list --repo arthurb1348/terrimaint --workflow ci.yml --event workflow_dispatch --limit 5
```

Ouvrir l'exécution correspondante et ses logs avec `gh run view NUMERO_EXECUTION --repo
arthurb1348/terrimaint --web`. Le job choisit **la PR 60**, pas une « dernière PR ».
Si elle est fermée/fusionnée/externe, il échoue ; choisir un numéro de PR interne ouverte.
Ses nouveaux pushs déclencheront ensuite CI et la mise à jour de son canal.
Ce lancement ne modifie ni la branche ni la PR #60.

La première activation n'est validée qu'après un job de publication réussi et une
vérification HTTPS réelle. Conserver dans la revue le lien de l'exécution, l'URL renvoyée
et le SHA de `/deployment.json`, comparé au head de la PR. Publier un nouveau commit
lors d'une prochaine modification utile et constater **même URL, nouveau SHA**.
Ces preuves authentifiées ne sont pas encore fournies par la préparation de #61.

### 6. Ouvrir sur Pixel, puis publier main

Depuis le résumé Actions, ouvrir le lien HTTPS dans Chrome complet sur Pixel, puis
`/deployment.json` pour vérifier le SHA. Actualiser la page après la fin d'un nouvel
envoi. `Cache-Control: no-cache` impose une revalidation du contenu, y compris du shell
Angular ; aucun service worker n'est ajouté. Si un ancien écran demeure, fermer l'onglet,
rouvrir l'URL et comparer le manifeste avant de conclure à un échec de déploiement.

Tester `/agent/scanner`, une fiche `/agent/equipements/…` avec son vrai identifiant,
leur rechargement, `/qr-demo/index.html`, images, CSS et caméra avec consentement.
Les fichiers existants (dont les QR) passent avant la réécriture SPA vers `index.html`.
L'appel `/api/v1/health` reçoit le fallback HTML, pas un JSON `status: ok` : le client
le rejette et affiche **API indisponible**, comportement normal sans Django. Les parcours
restent fictifs ; HTTPS ne fournit ni authentification ni autorisations métier.

Après une fusion décidée par Arthur, le push de `main` exécute CI puis publie le canal
`live` si l'activation est toujours vraie. Ce n'est pas une copie du canal de PR : c'est
le build contrôlé du commit intégré. L'URL principale du site par défaut est
`https://ID_TERRIMAINT_VERIFIE.web.app` (et son alias `firebaseapp.com`). Pour publier
le `main` déjà existant lors de l'activation, lancer CI depuis `main` avec numéro vide :

```sh
gh workflow run ci.yml --repo arthurb1348/terrimaint --ref main
```

## Expiration, quotas et erreurs

- Les canaux de PR expirent sept jours après le dernier déploiement ; aucune action
  privilégiée n'est déclenchée à la fermeture. On laisse Firebase nettoyer par expiration.
  Arthur peut supprimer plus tôt depuis son PC :
  `npx --yes firebase-tools@15.34.2 hosting:channel:delete pr-60 --project ID_TERRIMAINT_VERIFIE`.
  Ne jamais sélectionner `live` pour ce nettoyage. La stabilité d'une URL ne survit pas
  forcément à une suppression/recréation.
- Spark partage ses quotas Hosting entre site live et previews : surveiller usage,
  stockage, transfert, canaux et anciennes versions dans Firebase. Le guide officiel
  indique 10 Go de stockage et 10 Go/mois de transfert gratuit ; vérifier les valeurs
  actuelles avant activation. Atteindre un quota peut bloquer un envoi ou suspendre le
  service. Nettoyer les anciennes versions/canaux après revue ; ne pas activer Blaze.
- Pas de lien ? Vérifier d'abord le job ignoré (activation, fork, source périmée), puis
  les échecs Backend/Frontend, l'ID, le nom du secret et sa présence dans le bon dépôt.
- `403`/permission Firebase : vérifier compte et droits **Hosting du bon projet**, clé
  révoquée et éventuelles restrictions du projet. Ne pas afficher le JSON dans les logs
  et ne pas accorder Owner/Editor pour contourner un problème.
- Build absent : artifact `frontend-build` du même run requis, conservé sept jours.
  Après expiration, relancer **tous les jobs CI**, pas seulement la publication.
- Caméra refusée : suivre [le guide Scanner](scanner-qr.md#préparer-la-revue-depuis-un-téléphone),
  vérifier l'origine HTTPS et les réglages du navigateur ; aucune désactivation de sécurité.

## Vérifications de préparation et versions

Le 1er novembre 2026 : Node **24.21.0**, npm **11.19.0**, installation verrouillée,
lint, **268 tests Vitest** et build réels réussis (avertissement CommonJS jsQR existant).
Les huit tests Node couvrent sélection de cible, refus des forks, sources périmées,
PR fermées, commandes Hosting, refus des hooks/mauvais projets/secrets mal formés,
compte rendu et nettoyage avec une **CLI factice**, sans authentification.
**actionlint 1.7.12** valide les workflows. L'émulateur Hosting de Firebase CLI **15.34.2**
avec l'ID réservé `demo-terrimaint` (test local uniquement, jamais cible de publication)
a servi le vrai build : Scanner et fiche en accès direct, QR HTML/PNG/SVG, JS/CSS,
cache et fallback santé non JSON. Aucun appareil Pixel ni déploiement distant validé.
Le workflow Responsive reste inchangé ; ses résultats distants sont liés dans la PR.
Pour reproduire l'essai local : `npm ci` puis `npm run build` dans `frontend/`, puis
revenir à la racine et lancer `npx --yes firebase-tools@15.34.2 emulators:start --only
hosting --project demo-terrimaint`. Ouvrir les chemins ci-dessus sur `http://127.0.0.1:5000`.
Ce serveur local n'est pas une preuve HTTPS ni un test caméra Pixel.

Les actions sont épinglées à des SHA vérifiés via l'API GitHub : checkout **v7.0.1**,
setup-node **v7.1.0**, upload-artifact **v7.0.2**, download-artifact **v8.0.2**,
github-script **v8.0.0**. La CLI Firebase est fixée à **15.34.2**, installée séparément
sans ajout de dépendance applicative. Son installation npm résout ses dépendances
transitives ; ce n'est pas un lockfile de ces outils de déploiement.

Sources officielles lues pour cette implémentation :

- [Intégration GitHub et effets de l'initialisation](https://firebase.google.com/docs/hosting/github-integration)
- [Canaux de preview, URL et publication live](https://firebase.google.com/docs/hosting/test-preview-deploy)
- [Action officielle, entrées et limites](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Expiration et gestion des versions/canaux](https://firebase.google.com/docs/hosting/manage-hosting-resources)
- [Usage et quotas Hosting](https://firebase.google.com/docs/hosting/usage-quotas-pricing)

La CLI directe permet de désactiver la synchronisation Firebase Auth et de donner au
release live un message contenant le **SHA réellement construit**. Le manifeste et le
résumé identifient aussi les previews, y compris une PR choisie manuellement. Le nom du secret de
l'initialisation est vérifié dans le générateur de Firebase CLI 15.34.2.
