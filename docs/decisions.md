# Décisions techniques et métier

## 2026-10-30 — Fiche Matériel locale et recherche dans l'URL (issue #31, en revue)

La consultation de l'[issue #31](https://github.com/arthurb1348/terrimaint/issues/31) partage
un seul composant entre `/agent/equipements/:id` et `/responsable/equipements/:id` et lit
la source typée existante, sans seconde liste de données. Le paramètre `id` est observé pour
suivre sa modification lorsque le routeur réutilise le composant ; un identifiant absent
de la source produit un état introuvable explicite avec retour.

La recherche devient un paramètre d'URL **`q`**. Les liens liste/fiche/retour transmettent
la saisie exacte ; le filtrage normalise seulement sa propre comparaison. `replaceUrl`
évite une étape d'historique par lettre. Le retour vise la liste du même espace, même
après accès direct, sans dépendre d'un historique ni d'un stockage persistant. Matériel
reste actif sur sa liste et ses fiches ; les routes demeurent publiques, sans permissions.

La fiche affiche uniquement nom, identifiant, emplacement et mention de démonstration.
Statuts, historiques, formulaires, modification, scanner et API métier restent hors périmètre.
La charte et les parties pertinentes des prototypes sont reprises sans simuler leurs
fonctions futures. Cet incrément reste **en revue jusqu'à fusion**.

## 2026-10-30 — Outillage frontend et scripts npm examinés (fusionnée)

La maintenance sur `fix/frontend-toolchain-security` fixe `@angular/build` à **22.2.5**
pour suivre sa dépendance officielle Vite **8.3.5**, avec lockfile régénéré par npm.
Les autres versions directes, dont Node 24.21.0 et npm 11.19.0, sont conservées.
Les dépendances indirectes nécessaires à ce builder évoluent sans override Vite.

Les décisions `allowScripts` sont limitées aux versions examinées : seul le `postinstall`
d'`esbuild@0.28.2` est autorisé. Les scripts d'`@parcel/watcher@2.6.0`, `lmdb@3.5.6` et
`msgpackr-extract@3.0.4` sont refusés : les binaires précompilés fonctionnent sans leur
compilation de repli dans l'environnement Linux contrôlé. Le `.npmrc` du frontend active
`strict-allow-scripts=true` pour refuser toute nouvelle version avec script non examinée.
Le [guide du code](code-guide.md#dépendances-frontend-et-scripts-dinstallation-npm) détaille
les fichiers relus, les raisons, les contrôles et la procédure de mise à jour. Windows et
macOS restent à vérifier. Cette maintenance est intégrée par la
[PR #30](https://github.com/arthurb1348/terrimaint/pull/30), fusionnée le 30 octobre 2026
(commit `fdaa85d531c77a34eb73b6075aa12200df163546`).

## 2026-10-30 — Accès Scanner selon la présentation (issue #21, fusionnée)

La décision UX d'Arthur dans l'[issue #21](https://github.com/arthurb1348/terrimaint/issues/21)
conserve Scanner sur mobile et tablette et simplifie la présentation ordinateur. La PR
associée masque **les deux accès**, raccourci de l'accueil Agent et entrée de navigation,
à partir de **1200 px inclus de largeur de fenêtre CSS**. Ce seuil conserve Scanner à
768 px et à 1024 px, notamment sur tablette en paysage ; il le masque à 1440 px.
Une fenêtre d'ordinateur plus étroite conserve donc Scanner : la règle décrit la présentation,
sans identifier l'appareil, sa caméra ou une permission.

Le seuil existant de 760/761 px continue seulement de choisir entre Plus et les destinations
directes. Jusqu'à 760 px : Accueil, Matériel, Scanner et Plus ; de 761 à moins de 1200 px :
les cinq destinations directes ; à partir de 1200 px : Accueil, Matériel, Incidents et Profil.
`display: none` retire les accès Scanner de la mise en page et du parcours clavier ; il retire
aussi le `li` de l'accueil pour ne laisser aucune puce vide. Les liens flexibles de navigation
se répartissent l'espace disponible. La route `/agent/scanner` reste accessible par URL
directe à toute largeur et affiche toujours la page d'attente existante.

Les deux media queries, dans `features/agent/agent.css` et
`shared/main-navigation/main-navigation.css`, doivent garder le même seuil. Playwright couvre
les deux emplacements à 320, 390, 768 et 1440 px, les limites 1199/1200/1201 px et des
allers-retours par redimensionnement sans rechargement, ainsi que l'URL directe et le clavier.
Matériel et sa recherche, les autres destinations et la navigation Responsable sont conservés.
Scanner réel, saisie de code et dépendances restent hors périmètre. Cette adaptation est
**intégrée par la [PR #29](https://github.com/arthurb1348/terrimaint/pull/29)**, fusionnée le
30 octobre 2026 (commit `4f5e3fc7b331482c5a2a994309f6481ee3f2acb1`).

## 2026-10-23 — Tests responsive reproductibles

Versionner les contrôles Playwright du shell et des navigations avec Chromium, en complément
des tests Vitest. Les formats 320 × 568, 390 × 844, 768 × 1024 et 1440 × 1024 couvrent petit
téléphone, mobile, tablette et ordinateur. La santé HTTP est simulée pour isoler l'interface.
Ces tests vérifient la géométrie et les interactions ; ils ne valident ni Django, ni un appareil
physique, ni la conformité visuelle complète aux maquettes.

Le workflow `Responsive` publie rapport, captures et traces d'échec pendant sept jours.
Il n'est pas ajouté au ruleset obligatoire au départ ; ses échecs restent visibles, sans
`continue-on-error`. Les contrôles `Backend` et `Frontend` restent inchangés. Les captures
servent à la relecture humaine, sans comparaison automatique pixel par pixel à ce stade.
Ces tests sont intégrés par la [PR #19 fusionnée](https://github.com/arthurb1348/terrimaint/pull/19)
le 23 octobre 2026.

## 2026-10-16 — Adapter la navigation Agent aux petits écrans (validée)

Le test de la PR #16 sur petit téléphone a révélé que cinq entrées rendaient les libellés
trop serrés. Jusqu'à 760 px, conserver **Accueil, Matériel, Scanner et Plus** sur une rangée,
avec icônes et textes. Plus donne accès à Incidents et Profil, indique leur état actif et
se ferme au toucher extérieur, par Échap, par Fermer ou après navigation, avec gestion du focus.
À partir de 761 px, les cinq destinations Agent restent directement visibles.
La décision du 30 octobre ci-dessus propose ensuite de masquer Scanner à partir de 1200 px,
sans changer le seuil ni le fonctionnement de Plus.

Cette adaptation validée privilégie la lisibilité et les accès terrain fréquents par rapport
au nombre d'entrées du prototype. La déclaration rapide depuis l'accueil ou une fiche reste
prévue, sans formulaire ajouté par cette décision. La navigation Responsable ne change pas.
La [PR #16 fusionnée](https://github.com/arthurb1348/terrimaint/pull/16) porte l'implémentation.

## 2026-10-16 — Immobilisation et déclaration simplifiée (validées)

L'immobilisation officielle et la remise en service d'un équipement sont réservées au
Responsable. L'Agent peut signaler un risque ou une impossibilité d'utilisation ; son
signalement ne change jamais directement le statut de l'équipement. Ces règles devront
être imposées côté serveur lors de l'implémentation métier.

Le type d'incident est retiré du MVP. La déclaration conserve une qualification par priorité,
sans champ de type. La première détection de récurrences pourra rapprocher les incidents
successifs d'un même équipement ; elle ne prétend pas reconnaître automatiquement une panne
identique. Le seuil et la période de rapprochement restent à préciser avant son implémentation.

Ces décisions priment sur les éléments contradictoires des prototypes Figma.

## 2026-10-16 — Navigation issue du prototype (fusionnée)

Les parcours Prototype Agent `188:3` et Responsable `188:6` guident l'UX avant les anciennes
maquettes et bibliothèques. Le shell reprend leurs navigations et styles en CSS natif, avec
une adaptation responsive pour chaque espace. Les URL sous `/agent` et `/responsable`
conservent le contexte ; les pages équipement et incident partagent les mêmes composants.
Les anciennes URL redirigent vers les nouvelles. Aucun lien ne confère de permission.

La navigation basse Agent et la barre latérale Responsable ont des destinations accessibles,
encore explicitement réservées aux prochains incréments. Recherche, notifications, identité
connectée et synchronisation ne sont pas simulées. Le contrôle de santé HTTP reste sur
l'accueil général et ne prouve ni persistance ni synchronisation. Les icônes originales sont
exportées depuis les instances du prototype, conservées localement dans `frontend/public/icons/`.
Aucune dépendance applicative ajoutée.


## 2026-10-16 — Architecture Angular par fonctionnalités (fusionnée)

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
