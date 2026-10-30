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
   contenu routé et pied de page. `app.routes.ts` conserve `/` vers `Home`, charge les pages
   métier à la demande et redirige les URL inconnues vers l'accueil.
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
Le build produit des fichiers différés pour ces pages. `Home` reste importé directement,
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
| `src/app/features/equipements/equipements.ts` | Lecture de la recherche `q` dans l'URL et calcul de la liste filtrée. Aucune API métier ni stockage persistant. |
| `src/app/features/equipements/equipements.html` | Titre, mention de démonstration, champ étiqueté, effacement, résultat annoncé et liens vers les fiches. |
| `src/app/features/equipements/equipements.css` | Palette existante, focus du champ, contrôles qui passent à la ligne et cartes : une colonne jusqu'à 760 px, deux au-delà. Les textes longs peuvent revenir à la ligne. |
| `src/app/features/equipements/equipements.spec.ts` | Tests des comportements visibles via saisie et clic : données initiales, nom/identifiant, casse, espaces, aucun résultat et effacement/focus. |
| `e2e/responsive.pw.ts` | Ajoute la recherche dans les deux espaces aux quatre formats, avec effacement au clavier, contexte et débordement contrôlés. |
| `docs/project-status.md`, `docs/decisions.md` | Bilan de la démonstration intégrée par la PR #20 et décisions de présentation. |

### De la saisie aux cartes

1. L'URL est la source de la recherche : `?q=Tondeuse`. `ActivatedRoute.queryParamMap`
   émet les changements de paramètres et `toSignal` rend cette valeur observable lisible
   comme un signal Angular. Un **signal** est une valeur réactive : Angular actualise la
   vue quand elle change. `search = computed(...)` lit `q`, ou `''` si le paramètre est absent.
2. `[value]="search()"` relie le champ à cette valeur dérivée. `(input)` appelle
   `updateSearch(searchInput.value)`, qui modifie `q` avec le routeur. `replaceUrl: true`
   remplace l'entrée courante au lieu d'ajouter une étape d'historique par lettre.
   `#searchInput` est une référence au champ HTML, comparable à une template ref Vue.
   La liste n'utilise ni formulaire ni liaison bidirectionnelle supplémentaire.
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
6. Effacer retire `q` de l'URL : `search()` redevient `''`, toute la liste revient et le focus
   rejoint le champ. Les liens de fiche transmettent la saisie exacte dans `q` ; le lien de
   retour la retransmet à la liste. Espaces et casse restent visibles dans le champ, même
   si le filtre les normalise. Un rechargement reconstruit donc la recherche à partir de l'URL,
   sans localStorage, sessionStorage, IndexedDB ou store global.

### Où changer les données et le comportement

Pour modifier les exemples, intervenir dans `equipements-demo.ts`. Pour changer les champs
affichés, adapter `Equipment` et le template ; pour changer la recherche, adapter le `computed`
et ses tests. Pour le futur raccordement, remplacer les imports de `DEMO_EQUIPMENT` dans la
liste et la fiche par une source réactive alimentée par une API propre aux équipements.
Le filtre et la sélection par identifiant pourront lire cette source. Il faudra alors définir le contrat JSON,
valider les réponses, gérer chargement/erreur et tester les autorisations serveur ; l'interface
TypeScript seule n'assure aucune de ces protections. Aucun service générique n'est anticipé.

Figma a été consulté en lecture seule : fiche matériel Agent `188:29` dans le parcours
`188:3`, et présentation des équipements du parcours Responsable `188:6` (écran `188:10487`).
Ces parcours ne présentent pas de liste Matériel dédiée. Les cartes reprennent leur hiérarchie
nom/référence/emplacement et la charte existante ; il ne s'agit pas d'une fidélité vérifiée
à un prototype complet de cette liste. Les statuts, historiques, actions d'incident et
synchronisation restent hors de la consultation de démonstration.

### Fiche partagée et circulation des données (issue #31, fusionnée)

Les routes `/agent/equipements/:id` et `/responsable/equipements/:id` utilisent le même
`EquipmentDetail`, chargé par `loadComponent`. `:id` est une partie variable du chemin :
dans `/agent/equipements/EQ-OUT-0003`, sa valeur est `EQ-OUT-0003`. Le composant lit ce
paramètre et cherche l'objet correspondant dans **la même constante `DEMO_EQUIPMENT`** que
la liste, sans recopier les équipements. Il affiche son nom, son identifiant et son emplacement,
avec la mention « Données de démonstration » ; aucune information métier supplémentaire.

Le flux est : **saisie → URL `q` → liste filtrée → lien contenant `id` et `q` → fiche → lien
de retour contenant `q` → liste filtrée**. `q` garde le texte de recherche ; `id` identifie
un équipement et doit correspondre exactement à un identifiant de la source. Angular encode
les paramètres des liens ; il n'est pas nécessaire de concaténer ou décoder la saisie à la main.

`paramMap` est transformé en signal puis lu dans un `computed`. Lire seulement un instantané
au démarrage laisserait une ancienne fiche si Angular réutilisait le composant pour un autre
`id`. Les tests vérifient une même instance successivement valide, différente, inconnue puis
valide. En l'absence d'objet, le template affiche « Équipement introuvable » et conserve le
lien « Retour au matériel » ; l'ancienne fiche n'est plus affichée.

`[routerLink]="[equipment.id]"` prolonge le chemin de la liste. Dans la fiche,
`[routerLink]="['..']"` revient au chemin parent dans le même espace : ce lien fonctionne
même si aucune liste n'a été visitée auparavant. Il ne dépend pas de l'historique du
navigateur. La liste et la fiche restent publiques ; un préfixe `/responsable` ne donne aucun droit.

La navigation utilise une correspondance de chemin partielle pour Matériel :
son lien racine reste actif sur `/equipements/:id` et quand `q` est présent. L'issue #34 étend
cette règle à Incidents pour son formulaire ; les autres destinations gardent leur
correspondance exacte. Pour le clavier, la fiche place le focus sur
le `main` permanent du shell après rendu : Tab atteint le retour. Au retour, ce repère garde
le focus, puis Tab retrouve le champ de recherche. Le CSS utilise les couleurs existantes,
des espacements de 16/24 px et le retour à la ligne pour les contenus longs, sans largeur minimale rigide.
Dans `equipements.css`, `scroll-margin-bottom: calc(104px + env(safe-area-inset-bottom))`
réserve le dégagement de défilement des liens de carte : 88 px pour la navigation Agent,
16 px de marge et l'éventuelle zone sûre du téléphone. Sans ce dégagement, un lien focalisé
à 320 px peut être dans la fenêtre mais caché par la barre fixe. Cette règle ne change pas
la taille des cartes ; elle guide le défilement automatique au focus. Playwright vérifie
la position du lien au-dessus de la barre avant de l'activer au clavier.

| Endroit à modifier | Rôle |
| --- | --- |
| `src/app/app.routes.ts` | Deux chemins avec `:id`, chargement partagé, titre et libellé Matériel. |
| `src/app/features/equipements/equipment-detail.ts` | Lecture réactive d'`id` et de `q`, sélection dans la source, focus du contenu. |
| `equipment-detail.html` et `equipment-detail.css` dans le même dossier | Fiche ou état introuvable, retour, mentions, champs et présentation responsive. |
| `equipements.ts` et `equipements.html` | Recherche dans l'URL et liens de liste contenant `id` et `q`. |
| `src/app/shared/main-navigation/main-navigation.html` | Matériel actif sur sa liste et ses fiches. |
| `equipment-detail.spec.ts`, `equipements.spec.ts`, `src/app/app.spec.ts` | Paramètres, réutilisation du composant, contexte, recherche et retour. |
| `e2e/responsive.pw.ts` | Parcours clavier, accès direct, rechargement et captures aux quatre formats. |

Figma a été relu sans modification : fiche Agent `188:29`, carte `255:11049`, et parcours
Responsable `188:6` avec l'écran `188:10487`. Ce dernier contient une présentation d'équipements
mais aucune fiche Matériel dédiée. La consultation reprend la hiérarchie nom/référence/emplacement
et conserve le shell déjà intégré. Le lien de retour est explicite en texte. Les statuts,
synchronisation, entretien et actions des prototypes ne sont pas simulés. Aucune fidélité
pixel par pixel à l'écran métier complet n'est revendiquée.

### Essai manuel court et compréhension

Avec `npm start` dans `frontend/`, ouvrir chacune des deux URL Matériel. Vérifier les six
équipements et la mention de démonstration aux largeurs 320, 390, 768 et 1440 px. Saisir
`  tONDeUSE  `, puis `eq-veh-0042`, puis seulement des espaces et enfin `introuvable`.
Vérifier respectivement un résultat par nom, un par identifiant, six résultats et le message
vide. Depuis le champ, utiliser Tab puis Entrée sur « Effacer la recherche » : les six cartes
reviennent et le focus rejoint le champ. Vérifier le lien Matériel actif, les navigations
existantes et l'absence de défilement horizontal. Django n'est pas requis pour cette liste.

Pour la fiche : chercher `  tONDeUSE  `, puis Tab jusqu'au lien « Tondeuse autoportée » et
Entrée. Vérifier les trois informations et Matériel actif ; Tab puis Entrée sur le retour
doit retrouver la saisie et un résultat. Refaire dans les deux espaces. Ouvrir directement
`/agent/equipements/EQ-OUT-0003`, puis son équivalent Responsable, et recharger : la fiche
reste correcte. Remplacer l'identifiant par `inconnu` : message explicite et retour utilisable.

1. Quelle différence y a-t-il entre `id` dans le chemin et `q` dans la recherche de l'URL ?
2. Pourquoi faut-il observer `paramMap` plutôt que lire seulement l'identifiant au démarrage ?
3. Comment le lien de retour peut-il retrouver la recherche sans stockage ni visite précédente de la liste ?

## Déclaration locale d'incident (issue #34, fusionnée)

Ce parcours est intégré par la [PR #35 fusionnée](https://github.com/arthurb1348/terrimaint/pull/35),
après la fiche de la PR #32. Il reste une démonstration sans enregistrement.
L'ajustement de saisie et des boutons de l'issue #36 est intégré par la
[PR #37 fusionnée](https://github.com/arthurb1348/terrimaint/pull/37).
Les routes `/agent/incidents/nouveau/:equipmentId` et
`/responsable/incidents/nouveau/:equipmentId` chargent **le même `IncidentDeclaration`**.
Le paramètre `equipmentId` sélectionne un objet dans `DEMO_EQUIPMENT`, la seule source de
matériel. Un accès direct valide fonctionne ; un inconnu affiche un retour sans formulaire.
Ces routes sont publiques : le contexte d'affichage n'est pas une permission.

### Formulaire, validation et mémoire

`ReactiveFormsModule` appartient à `@angular/forms`, déjà installé. Un `FormGroup` rassemble
quatre `FormControl` : `title`, `description`, `priority` et `risk`. Chaque contrôle contient
sa valeur et son état de validation ; `formControlName` relie le champ HTML au contrôle.
`nonNullable` permet de revenir à une chaîne vide ou à `false` lors d'un `reset`, plutôt
qu'à `null`. Aucun service de brouillon ou stockage n'est ajouté.

L'intitulé doit contenir un caractère autre qu'un espace : `nonBlank` teste `trim()` sans
modifier la valeur saisie. La **description est facultative**, dans Angular, le HTML et les
aides. Son validateur accepte la chaîne vide ou blanche ; sinon il applique
`Validators.maxLength`. Les limites de démonstration **120 et 2000** sont aussi annoncées
dans l'aide et appliquées par `maxlength` dans le navigateur. Pour des détails non blancs,
la longueur brute est contrôlée : les espaces de bord ne sont pas retirés.
Le test Angular reste utile si cette limite HTML est contournée.
Ce sont des longueurs JavaScript/HTML en unités UTF-16, à confirmer avec le futur serveur.
La priorité doit appartenir aux trois valeurs examinées ; aucun choix n'est présélectionné.
Les valeurs internes `low`, `high`, `urgent` correspondent aux textes **Faible, Haute, Urgente**.
Les radios partagent aussi le nom HTML `priority` pour former un vrai groupe au clavier.

Le formulaire utilise `novalidate` pour afficher ses propres messages associés par
`aria-describedby` et `aria-invalid`. À une tentative invalide, `markAllAsTouched` rend
les erreurs visibles et le focus rejoint le premier champ invalide après le rendu.
Les contrôles gardent leurs valeurs. La case de risque est facultative et ne change jamais
le matériel : ni type d'incident ni immobilisation ne sont implémentés par ce formulaire.

Le signal `step` choisit entre `form`, `review` et `complete`. La validation locale ouvre le
récapitulatif avec **Vérifier le signalement**. Il lit les contrôles existants ;
**Modifier le signalement** réaffiche les mêmes valeurs.
`descriptionLabel()` retourne **Non renseignée** si `trim()` ne trouve aucun détail,
ou la valeur exacte dans le cas contraire. Cette méthode ne modifie pas le `FormControl` :
le texte d'absence n'est jamais une donnée saisie et une description blanche est retrouvée
telle quelle avec Modifier. Les retours à la ligne des descriptions renseignées sont conservés.
**Envoyer le signalement** change seulement l'étape : aucun numéro, appel HTTP ni sauvegarde.
La mention de démonstration placée près du bouton lui est reliée par `aria-describedby`.
La confirmation **Signalement simulé** rappelle qu'aucun signalement n'est réellement
transmis ou enregistré. Seuls les libellés changent, sans renommer les routes ou composants.
Une mention visible explique dès le départ que la saisie est perdue en quittant ou rechargeant.
Le composant est détruit à la sortie. S'il est réutilisé pour un autre `equipmentId`, un
`effect` remet valeurs, erreurs et étape à zéro ; observer seulement l'initialisation serait
insuffisant. Le `computed` d'identifiant évite d'effacer le formulaire quand seul `q` change.

### Circulation des données et retours

**Liste et recherche `q` → fiche avec `id` et `q` → déclaration avec `equipmentId` et `q`
→ contrôles en mémoire → récapitulatif → confirmation locale → fiche avec `id` et `q`
→ liste filtrée**. L'intitulé, la description, la priorité et le risque ne passent jamais
dans l'URL, `localStorage`, `sessionStorage` ou IndexedDB. `q` reste uniquement la recherche
de matériel ; ce paramètre ne transporte pas le formulaire.

Depuis une fiche, `['../../incidents/nouveau', item.id]` rejoint le domaine Incidents dans
le même espace. Depuis la déclaration, `['../../../equipements', item.id]` vise explicitement
la fiche ; sans matériel connu, le retour vise la liste. `[queryParams]` transmet `q` avec
son encodage Angular. Ces vrais liens fonctionnent aussi après ouverture directe, sans
faire l'hypothèse d'une page précédente dans l'historique.

### Présentation, clavier et endroits à modifier

Le formulaire regroupe les deux écrans Figma description/priorité pour ce premier incrément ;
la [décision](decisions.md) explique ce choix et les règles métier qui priment sur les maquettes.
La carte reprend la surface verte et le liseré du prototype, sans statut de disponibilité.
Le CSS réutilise les couleurs du projet, des champs de largeur `100%` et `min-width: 0`,
des actions flexibles avec retour à la ligne et `overflow-wrap: anywhere` pour les valeurs
longues. `white-space: pre-wrap` conserve les retours à la ligne du récapitulatif.

Le focus rejoint le contenu à l'entrée, le titre au récapitulatif et à la fin, et l'intitulé
après Modifier. `scroll-margin-block` réserve un dégagement pour la barre Agent fixe.
Pour la description multiligne, `revealDescription` centre le champ au focus : le défilement
natif peut autrement ne dégager que le curseur et laisser le bas du champ derrière la barre.
Ce comportement est contrôlé par la géométrie Playwright ; aucune modification de
l'autocomplétion ni correction du diagnostic distinct #33 n'est ajoutée.
Incidents reste actif sur son sous-chemin dans les deux navigations. `activeSecondary`
reconnaît aussi ce sous-chemin pour annoncer **Plus — Incidents actif** sur petit écran Agent.

| Fichier | Où intervenir |
| --- | --- |
| `src/app/features/incidents/incident-declaration.ts` | Contrôles, bornes, priorités, validation, étapes en mémoire et remise à zéro par identifiant. |
| `incident-declaration.html` dans le même dossier | Libellés, aides/erreurs accessibles, carte, récapitulatif, simulation et liens de retour. |
| `incident-declaration.css` dans le même dossier | Charte, champs, choix, actions, contenus longs et dégagement du focus. |
| `src/app/features/equipements/equipment-detail.html` et `.css` | Lien Déclarer un incident, uniquement pour une fiche valide. |
| `src/app/app.routes.ts` | Deux chemins publics vers le même composant. |
| `src/app/shared/main-navigation/main-navigation.ts` et `.html` | Domaine Incidents actif et indication dans Plus. |
| `incident-declaration.spec.ts`, `equipment-detail.spec.ts`, `src/app/app.spec.ts` | Validation/bornes, source inchangée, réinitialisation, contexte, liens et retours. |
| `e2e/responsive.pw.ts` | Clavier, états du parcours, rechargement, quatre formats et captures. |

Une future API devra définir validation serveur, authentification, permissions et conservation
des données avant tout envoi, en conservant la description facultative prévue par l'issue #36.
Photos/audio/GPS et brouillons persistants restent des tâches
suivantes ; le code présent ne prétend pas les fournir. Dépendances et politique npm ne changent pas.

### Essai manuel et compréhension

Avec les versions Node/npm du dépôt, exécuter `npm ci` puis `npm start` dans `frontend/`.
Dans chacun des deux espaces :

1. Chercher `  tONDeUSE  ` dans Matériel, ouvrir sa fiche au clavier, puis Déclarer un incident.
2. Tenter de continuer sans intitulé ni priorité : vérifier erreurs et focus. Renseigner
   ces deux champs, laisser la description vide ou blanche, puis Vérifier le signalement :
   le récapitulatif affiche Non renseignée. Essayer aussi une description renseignée.
3. Utiliser Modifier le signalement et retrouver toutes les valeurs. Envoyer le signalement,
   lire la confirmation de démonstration sans transmission/enregistrement, puis revenir à
   la fiche et à la recherche. Le risque facultatif ne modifie jamais le statut du matériel.
4. Essayer Annuler, une URL directe, un rechargement après saisie et un identifiant inconnu.
   Refaire à 320, 390, 768 et 1440 px avec Tab, Maj+Tab, flèches et Espace ; vérifier le focus
   visible et l'absence de débordement. Django n'est pas nécessaire pour cette démonstration.

Questions pour l'oral :

1. Comment `formControlName` relie-t-il le champ saisi au validateur puis au récapitulatif ?
2. Pourquoi Non renseignée doit-il rester un texte d'affichage plutôt qu'une valeur du formulaire ?
3. Pourquoi transmettre `q` dans les liens, tout en gardant les données d'incident hors de l'URL ?

## Liste et détail des signalements (issue #39, en revue)

La priorité validée est de préparer les parcours frontend pour l'oral de décembre 2026 ;
PostgreSQL #38 est différé. Ce parcours de consultation reste en revue jusqu'à fusion.
La [décision](decisions.md) explique l'adaptation des deux prototypes Responsable : la table
de matériel devient une liste de signalements, avec des statuts d'incident distincts.
Le shell, les rôles de présentation et la déclaration existante sont conservés.

### Source typée et relation au matériel

`incident.ts` définit l'interface `Incident` et les libellés des priorités/statuts.
Les clés techniques `low/high/urgent` et `open/in-progress/closed` limitent les valeurs
TypeScript possibles ; elles produisent les textes Faible/Haute/Urgente et Ouvert/En cours/Clôturé.
`incidents-demo.ts` contient une seule liste de six objets fixes : référence, intitulé,
description facultative, `equipmentId`, priorité, statut, date ISO fixe et risque facultatif.
`readonly` interdit une modification accidentelle dans le code typé ; ce n'est pas une
permission serveur. Le formulaire de déclaration ne crée ni ne modifie ces objets.

`equipmentId` est la référence vers `DEMO_EQUIPMENT`. Liste et détail cherchent l'objet
correspondant pour lire son nom et son emplacement, sans dupliquer ces valeurs. Les tests
vérifient que les six références existent et que les identifiants de signalement sont uniques.
Une description absente s'affiche Non renseignée, sans créer de texte métier. Les dates
sont rendues par `DatePipe` au format `dd/MM/yyyy`, sans forcer UTC : une date ISO sans heure
est une date calendaire, pas un instant à convertir. Le forçage UTC afficherait la veille
en Europe/Paris. Les nouveaux parcours Playwright utilisent ce fuseau et vérifient les dates.

### Filtrage et URL

Le flux est **paramètres de l'URL → filtres lus par `toSignal`/`computed` → combinaison
recherche + priorité + statut → lignes et compteur → lien détail avec les mêmes paramètres
→ retour explicite à la liste**. L'objet de filtre et les lignes sont dérivés, sans store ni
copie persistante. La comparaison de recherche utilise `trim().toLowerCase()` ; la saisie
originale reste dans le champ et dans `q`. Les quatre champs recherchés sont l'intitulé,
la référence du signalement, le nom et l'identifiant du matériel.

`incident-filters.ts` est une aide propre à ce parcours, partagée par liste et détail.
Il interprète `q`, `priority` et `status`. `Object.hasOwn` accepte seulement les clés déclarées,
y compris face à des valeurs d'URL comme `toString` ; une valeur inconnue devient Toutes/Tous.
Le lien de retour produit une URL sans filtre inconnu. Il n'y a pas de redirection automatique
de l'URL saisie : l'affichage applique la règle, puis une interaction produit les paramètres
valides. Les valeurs par défaut sont omises dans les liens grâce à `null`.

Dans le HTML, chaque option porte `[selected]` selon le filtre de l'URL. Cela applique aussi
la sélection lorsque `@for` crée les options après le menu : lier seulement la valeur du
`select` trop tôt laisserait Toutes/Tous affiché au retour, malgré des résultats déjà filtrés.

`updateFilter` conserve les deux autres critères et remplace l'entrée courante de l'historique
avec `replaceUrl`. Réinitialiser efface les trois critères, attend la navigation puis remet
le focus sur la recherche. Aucun `localStorage`, sessionStorage, IndexedDB ni appel métier.
Les composants observent les paramètres : recharger ou revenir par un lien restitue le même état.

### Détail et navigation

`/agent/incidents/:id` et `/responsable/incidents/:id` chargent le même `IncidentDetail`.
La route spécifique `incidents/nouveau/:equipmentId` reste avant cette route variable.
Le détail observe `id` pour actualiser le signalement et le matériel quand Angular réutilise
le composant. Un inconnu affiche Signalement introuvable avec un retour ; il ne garde aucun
contenu du précédent signalement. Les tests le vérifient sur une même instance.

Retour aux signalements vise explicitement le parent `..`, avec les critères transmis,
même après accès direct. Voir le matériel vise `../../equipements/:id` dans le même espace,
**sans paramètres de recherche** : `q` des signalements n'a pas le sens de `q` dans Matériel.
Incidents reste actif sur le détail, y compris dans Plus sur petit Agent, grâce à la règle
de sous-chemin déjà intégrée. Les routes publiques ne constituent pas des autorisations.

### Présentation et endroits à modifier

Le tableau et les cartes utilisent **le même DOM**, avec cinq colonnes : signalement
(référence et intitulé lié), matériel, priorité, statut, date. Les en-têtes restent disponibles
aux technologies d'assistance ; des libellés visuels accompagnent chaque valeur en carte.
La condition CSS `@container (min-width: 960px)` mesure le composant, pas la fenêtre : la
barre Responsable réduit l'espace sur tablette et le contenu Agent reste plus étroit.
Au-dessus de cette largeur, l'en-tête vert et les lignes alternées reprennent le prototype.
Les contrôles natifs et les retours à la ligne gardent les informations lisibles sans
débordement. Les badges conservent leurs textes, sans dépendre de la couleur seule.
Le focus rejoint le `main` du shell lors de l'entrée et du retour ; Tab mène aux contrôles
ou au lien de retour. `scroll-margin-block` dégage les cibles de la barre Agent fixe.

| Fichier | Où intervenir |
| --- | --- |
| `src/app/features/incidents/incident.ts`, `incidents-demo.ts` | Types, libellés et six exemples. Ajouter une référence matériel valide, sans recopier ses champs. |
| `incident-filters.ts` | Paramètres autorisés et construction des URL liste/détail. |
| `incidents.ts`, `.html`, `.css` | Champs recherchés, combinaison des filtres, compteur, réinitialisation et tableau/cartes. |
| `incident-detail.ts`, `.html`, `.css` | Sélection par identifiant, description, lien matériel et état introuvable. |
| `incident-presentation.css` | Mentions, références, badges et dégagement commun du focus. |
| `app.routes.ts`, `app.spec.ts` | Chargement des deux espaces, navigation active et déclaration sans ajout à la liste. |
| `incidents.spec.ts`, `incident-detail.spec.ts`, `e2e/responsive.pw.ts` | Relations, filtres/URL, retours, identifiants réutilisés, clavier et quatre formats. |

Essai manuel : dans les deux espaces, ouvrir Incidents, chercher `  EQ-OUT  `, choisir Haute
et En cours, puis ouvrir Vibration du plateau de coupe au clavier. Revenir, recharger et
retrouver les trois critères. Ouvrir Voir le matériel et constater que son URL n'a pas les
filtres de signalements. Essayer Clôturé pour obtenir le vide, puis Réinitialiser.
Ouvrir directement `/responsable/incidents/INC-2026-047` (texte long), recharger, puis essayer
`inconnu`. Refaire à 320, 390, 768 et 1440 px. Django n'est pas nécessaire pour ces exemples.

Questions de compréhension :

1. Pourquoi stocker `equipmentId` plutôt que recopier le nom et l'emplacement du matériel ?
2. Comment les paramètres d'URL permettent-ils de retrouver recherche et filtres sans stockage ?
3. Pourquoi les statuts Ouvert/En cours/Clôturé ne changent-ils pas celui du matériel ?

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
| `src/app/app.spec.ts` | Accueil et URL inconnues, un seul repère main, lien d'évitement, pages/fiches directes, titres et lien actif, contexte et retour de fiche avec recherche, annulation du GET puis relance au retour. |
| `src/app/features/equipements/equipements.spec.ts` | Liste locale, démonstration, recherche par nom/identifiant, casse et espaces, emplacement exclu, résultat vide, effacement/focus et paramètre `q`. |
| `src/app/features/equipements/equipment-detail.spec.ts` | Fiches directes dans les deux espaces, champs existants, identifiant inconnu, changement d'`id` dans une même instance et mise à jour de `q`. |

`provideHttpClientTesting()` remplace le transport réel après `provideHttpClient()`.
`expectOne()` contrôle l'URL, `flush()` fournit une réponse et `error()` simule le réseau.
`verify()` refuse une requête oubliée. Ces tests ne remplacent pas la vérification du proxy réel
ou de la mise en page dans un navigateur.

## Configurations sans commentaires

Ces fichiers JSON gardent une syntaxe valide. Leurs explications sont regroupées ici plutôt
que d'insérer des commentaires non reconnus par leurs outils.

| Fichier | Clés importantes et liens |
| --- | --- |
| `frontend/package.json` | `scripts` déclare start/lint/test/build. `dependencies` contient Angular et RxJS ; `devDependencies` les outils CLI, TypeScript, Vitest, jsdom, ESLint et Prettier. `engines` impose Node 24 et npm 11 compatibles ; `packageManager` précise npm 11.19.0. `allowScripts` autorise ou refuse les scripts de versions examinées (voir ci-dessous). `private` évite une publication npm accidentelle. |
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

## Dépendances frontend et scripts d'installation npm

Une **dépendance indirecte** est installée parce qu'un outil du projet en a besoin : ici
`@angular/build` utilise Vite pour le serveur de développement. Le manifeste fixe l'outil
direct, tandis que le lockfile enregistre aussi les versions indirectes réellement résolues.
Il faut contrôler tous les emplacements du lockfile : avant cette maintenance, Vite 8.3.3
à la racine coexistait avec **8.3.0 sous `@angular/build`**, encore signalé par l'audit.

La **mise à jour corrective** `@angular/build` **22.2.1 → 22.2.5** suit son manifeste
officiel, qui déclare Vite **8.3.5**. Le lockfile régénéré par npm contient une seule
résolution de Vite, en 8.3.5. Architect/Core 22.2.5, Rolldown 1.2.15, PostCSS 8.5.32 et
le repli WASM optionnel d'oxc évoluent avec cette chaîne ; Angular 22.2.1, la CLI 22.2.4,
TypeScript 6.0.3, Node 24.21.0 et npm 11.19.0 sont conservés. Les contraintes du builder
acceptent Angular `^22.0.0`, TypeScript `>=6.0 <6.1`, Vitest `^4.0.8 || ^5.0.0` et
Node `^24.15.0` sur notre version majeure. Aucun override Vite n'est nécessaire.
`npm audit` interroge les alertes connues à l'instant du contrôle ; son résultat n'est
pas une garantie permanente ni une preuve de sécurité du code applicatif.

Un paquet peut déclarer des commandes `preinstall`, `install` ou `postinstall`, exécutables
pendant l'installation. Ce sont des **scripts de dépendances**, distincts de nos commandes
`npm start`, `npm test` ou `npm run build`. Leur examen porte sur les scripts réellement
livrés, leurs fichiers appelés et leur utilité ; leur seul nom ne suffit pas.

`frontend/package.json#allowScripts` utilise des clés **nom@version exacte**. `true`
autorise les scripts de cette seule version ; `false` les refuse explicitement, sans
empêcher l'installation du paquet ni de ses dépendances optionnelles.

| Version examinée | Script livré et fichiers relus | Décision et raison |
| --- | --- | --- |
| `esbuild@0.28.2` | `postinstall: node install.js` ; lecture complète de `install.js` | **Autorisé** : prépare le binaire adapté à la plateforme et vérifie sa version. Si le paquet binaire optionnel manque, le script prévoit un téléchargement de la même version sur npm, avec vérification de son empreinte. Ce repli réseau n'a pas été nécessaire dans notre installation Linux. |
| `@parcel/watcher@2.6.0` | `install: node scripts/build-from-source.js` ; lecture du script et de `index.js` | **Refusé** : le script ne compile que si `npm_config_build_from_source=true`. Le fonctionnement normal charge le paquet précompilé de la plateforme ; un événement réel de création de fichier a été vérifié sous Linux. |
| `lmdb@3.5.6` | `install: node-gyp-build-optional-packages` ; lecture de son `bin.js`, du test de chargement, du chargeur et de l'entrée LMDB | **Refusé** : teste le module natif puis peut lancer une compilation `node-gyp` en cas d'échec. Le chargeur peut utiliser directement le paquet précompilé sans ce script ; écriture et lecture LMDB vérifiées après installation propre sous Linux. |
| `msgpackr-extract@3.0.4` | Même script ; lecture de `index.js`, du chargeur commun et du chargement dans msgpackr | **Refusé** : compilation de repli inutile pour les binaires disponibles. Le module natif, l'accélération active et un aller-retour MessagePack ont été vérifiés sous Linux. |

`frontend/.npmrc` active **`strict-allow-scripts=true`**. Avec npm 11.19.0, une dépendance
avec script non couverte devient une erreur `ESTRICTALLOWSCRIPTS` avant exécution ; les
refus explicites restent ignorés. Cela évite qu'une future version bénéficie d'une ancienne
autorisation. Les trois refus sont eux aussi limités aux versions examinées : toute nouvelle
version avec script doit être réexaminée. `npm install-scripts ls` ne montre que les cas
non couverts ; une liste vide signifie « chaque script a une décision », pas « tout est autorisé ».
Une copie temporaire privée de l'autorisation esbuild a confirmé ce refus avant installation.

Pour une prochaine mise à jour, depuis `frontend/` :

1. Lire `npm audit` et le manifeste officiel avec `npm view <paquet>@<version>` ; vérifier
   moteurs et dépendances pairs, sans `npm audit fix --force` ni override automatique.
2. Installer la version choisie avec `npm install --ignore-scripts --save-dev --save-exact
   <paquet>@<version>`. Cette option sert seulement à examiner les nouveaux fichiers avant
   exécution ; elle ne remplace pas la validation normale par `npm ci`.
3. Relancer `npm install-scripts ls`, lire chaque script et ses fichiers appelés, puis
   mettre à jour uniquement les décisions nécessaires. `npm install-scripts approve esbuild
   --allow-scripts-pin` écrit une autorisation exacte après examen. Conserver aussi des clés
   exactes pour les refus ; la commande `deny` écrit, elle, un refus par nom pour toutes les versions.
4. Relire le diff du manifeste et du lockfile, vérifier les versions de Vite dans le lockfile,
   puis lancer `npm ci --foreground-scripts`, `npm install-scripts ls`, `npm audit`, lint,
   tests, build et tests responsive. Vérifier `npm start` et la recompilation après modification.

Conserver les dépendances optionnelles : elles apportent les binaires de chaque plateforme.
La compilation depuis les sources n'est pas autorisée par cette politique. Les essais locaux
et la CI de cette maintenance sont sous Linux ; **Windows et macOS restent à vérifier** avec
les mêmes versions Node/npm, une installation propre, le démarrage et la recompilation.
Les tests responsive simulent la santé HTTP ; ils ne prouvent pas l'intégration Django/proxy.

Sources : [manifeste officiel du builder](https://registry.npmjs.org/@angular/build/22.2.5),
[commandes de revue des scripts npm](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts),
[contrôle strict npm](https://docs.npmjs.com/cli/v11/using-npm/config#strict-allow-scripts).

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

`frontend/e2e/responsive.pw.ts` parcourt 23 URL de référence : les 11 entrées initiales,
quatre fiches Matériel, quatre déclarations et quatre détails de signalement valides/inconnus
dans les deux espaces.
Il attend le contenu réellement
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
occuper tout l'espace intérieur de navigation, sans intervalle vide. La PR #29 a intégré
**72 scénarios** (64 intégrés par la PR #20, plus huit).

La PR #32 a intégré **104 scénarios**, soit 32 de plus : quatre URL de fiche aux quatre
formats et deux parcours supplémentaires par espace dans chaque format. Ils vérifient les
liens Tab/Entrée, la conservation exacte de `q`, le retour du focus, les champs de la fiche,
Matériel actif, l'accès direct, le rechargement des fiches et de la liste filtrée, puis l'état
introuvable avec retour. Le lien de carte focalisé doit rester visible au-dessus de la barre
Agent fixe. Les captures `lien-fiche-focus`, `fiche-materiel`, `retour-recherche` et
`equipement-introuvable` servent à la relecture. La réutilisation d'une même instance lors
du changement d'`id` est vérifiée séparément avec le routeur Angular dans Vitest.

La PR #35 a intégré **136 scénarios**, soit 32 de plus : quatre URL de déclaration aux quatre
formats et deux parcours supplémentaires par espace. Ils couvrent formulaire/erreurs,
validation de priorité au clavier, risque, récapitulatif/Modifier/fin, annulation, `q`, accès
direct, perte de saisie au rechargement et matériel inconnu. Les champs focalisés doivent
être entièrement visibles, y compris au-dessus de la barre Agent. Un récapitulatif aux bornes
120/2000 vérifie les contenus longs. L'URL ne reçoit que `q` ; aucune requête métier ni valeur
locale/session n'est produite pendant le parcours complet. Vitest vérifie les changements
d'identifiant dans une même instance, les bornes dépassées et l'absence de mutation de la source.
Les captures `incident-erreurs`, `incident-formulaire`, `incident-recapitulatif`,
`incident-simulation-terminee`, `incident-recapitulatif-limites` et `incident-materiel-introuvable`
sont jointes au rapport pour la relecture.

La PR #37 a intégré **144 scénarios** : dans les deux espaces et
aux quatre formats, le parcours ajouté accepte une description vide puis blanche, vérifie
Non renseignée dans le récapitulatif et retrouve la valeur exacte avec Modifier le signalement.
Les boutons Vérifier/Envoyer/Modifier le signalement sont utilisés au clavier et restent
entièrement visibles ; la mention de démonstration près de l'action finale doit aussi tenir
dans la fenêtre. Les tests unitaires conservent les refus d'intitulé/priorité et des bornes
120/121 et 2000/2001 pour les détails renseignés, avec des cas d'absence et de modification.
La capture `signalement-sans-description` complète celles du parcours existant.

L'issue #39 propose **176 scénarios**, soit 32 de plus : quatre URL de détail et deux
parcours par espace aux quatre formats. Filtres combinés, historique sans étape par lettre,
état conservé au retour/rechargement, réinitialisation, détail sans description, textes longs,
risque, inconnu, lien Matériel sans pollution des paramètres, navigation active et clavier
sont contrôlés. Le tableau est vérifié sur Responsable à 1440 px, les cartes dans les contenus
plus étroits. Les captures `signalements-liste`, `signalements-filtres`, `signalement-detail`,
`signalement-detail-long`, `signalements-aucun-resultat` et `signalement-introuvable` complètent
le rapport. `signalement-intitule-long-focus` vérifie aussi un lien à intitulé long focalisé.
Les tests ne prouvent ni permissions ni persistance : les données sont locales.

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
