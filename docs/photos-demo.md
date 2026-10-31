# Images et photos de démonstration — #43 intégrée par la PR #55

## Origine et présentation

Intégrée le 31 octobre 2026 au commit `1e87c74d51ad6c642a79f9383f12d2dda12464d2`
([PR #55](https://github.com/arthurb1348/terrimaint/pull/55)), vérifié avant #44.

Branche issue de `origin/main` vérifié `554468d731311dc25b34956c75866a8349c672c5`,
qui intègre #52 et #53/PR #54. Les prototypes Figma Agent `188:3` et Responsable
`188:6` ont été consultés en lecture seule, dont la capture Ajouter une photo
`188:9552`. Adaptation : sélection et aperçus dans le formulaire commun existant,
sans étape supplémentaire ni faux indicateur de synchronisation. Les décisions
validées (Basse, description facultative, risque sans immobilisation) priment.

Les neuf images dans `frontend/public/images/demo/` ont été générées avec l’outil
OpenAI image_gen le 31 octobre 2026 pour ce projet. Ce sont des illustrations
fictives, sans marque demandée, ni preuve de l’état réel d’un équipement.
Leur préparation ne crée aucune fonction IA dans l’application.

| Fichier | Sujet | Association |
| --- | --- | --- |
| mower.webp | Tondeuse autoportée verte dans un atelier | EQ-OUT-0001 |
| blower.webp | Souffleur à dos et tube | EQ-OUT-0002 |
| brushcutter.webp | Débroussailleuse à arbre droit | EQ-OUT-0003 |
| van.webp | Fourgon blanc générique | EQ-VEH-0042 |
| boiler.webp | Chaudière et tuyauterie | EQ-BAT-0011 |
| washer.webp | Nettoyeur, flexible et lance | EQ-OUT-0004 |
| heating-controls.webp | Commandes du chauffage, vue rapprochée | INC-2026-047 |
| heating-pipes.webp | Distribution des tuyaux de chauffage | INC-2026-047 |
| hose-joint.webp | Raccord de flexible et gouttes au sol | INC-2026-050 |

Prompt commun : photographie illustrative réaliste et générique, matériel entier,
atelier municipal, lumière naturelle douce, palette verte/grise, sans personne,
texte ou logo ; sujet précisé dans le tableau. Les exemples ont des cadrages
spécifiques de commandes, tuyauterie et raccord, distincts des illustrations Matériel.
Les tailles exactes et empreintes SHA-256 livrées figurent dans [le manifeste](demo-images-manifest.json).
Les originaux PNG sont conservés dans l’environnement de préparation, hors dépôt.
Conversion WebP qualité 80, sans déformation, centrée dans un cadre 4:3 : 900 × 675
(44 à 81 ko environ) et six variantes Matériel `-thumb` 300 × 225. Pillow est uniquement un outil
de préparation déjà disponible, aucune dépendance applicative ajoutée.
Les listes chargent les petites variantes ; les fiches utilisent les grandes.
L’élément image est recréé quand son URL change : aucun ancien bitmap ne reste
affiché pendant le chargement d’un autre matériel, et ses anciens événements sont détachés.
Dimensions et ratio sont réservés, premier visuel chargé immédiatement, suivants différés et repli textuel en cas d’erreur.

Pour remplacer un visuel, modifier l’association image/alternative dans
`equipements-demo.ts`, ou les `photos` dans `incidents-demo.ts`, puis remplacer
l’asset local. Ne pas dupliquer nom, référence ou emplacement des équipements.

## Cycle de vie des fichiers sélectionnés

Une instance `IncidentPhotos` appartient au composant de déclaration. Elle contient
uniquement les aperçus sélectionnés, pas les illustrations Matériel ni les photos
fixes des exemples. Aucune sélection n’alimente `DEMO_INCIDENTS`.
Le champ natif `file` accepte JPEG/PNG/WebP et plusieurs fichiers, sans `capture`
qui pourrait forcer la caméra : le choix de fichiers reste disponible, la prise de
vue dépend du navigateur et de son sélecteur système. Aucun capteur n’est demandé.

Chaque sélection conserve l’ordre des fichiers et les sélections sont sérialisées.
Le type MIME annoncé, la signature binaire correspondante, la taille (≤ 5 × 1024 × 1024 octets), la capacité de trois
photos et le décodage réel par le navigateur sont contrôlés. Les fichiers invalides
produisent un message nommé ; les fichiers précédemment acceptés et les autres
saisies restent intacts. Le champ est vidé pour permettre une nouvelle sélection du
même fichier. L’extension et `accept` seuls ne valident pas une image.

Une URL d’objet temporaire est créée seulement après les premiers contrôles.
Les URL en attente sont suivies, comme les aperçus acceptés. Une génération de
parcours invalide les résultats asynchrones lors d’une remise à zéro. Une ancienne
promesse ne peut ni ajouter une image dans le nouveau matériel ni modifier ses
messages ou son état d’attente. La suppression retire une photo par identifiant
stable ; un autre décodage ne peut pas la restaurer.

Supprimer, terminer la simulation, changer de matériel ou détruire le composant
révoque les URL inutiles. Annuler/quitter détruit le parcours ; recharger recrée
un état vide. Modifier conserve les mêmes aperçus et URL entre formulaire et
récapitulatif. Une modification de `q` seule ne change pas le matériel.
Aucun contenu/URL de fichier dans l’URL de navigation, localStorage, sessionStorage,
IndexedDB, journaux applicatifs ou requête métier. Le décodage est local au navigateur.
La sélection n’est jamais un téléversement et ces contrôles ne sont pas une validation
serveur. API, persistance, authentification, PostgreSQL et compression des fichiers
utilisateur restent hors périmètre.

## Accessibilité et vérifications

Les images locales portent une alternative liée à leur sujet. Les fichiers choisis
ont une alternative et une légende avec leur nom. Les suppressions sont des boutons
natifs nommés ; le focus rejoint le suivant, le précédent ou le champ de sélection
lorsque la galerie devient vide. Le nombre accepté et la vérification sont annoncés
par un statut ; les erreurs par une zone vive. La soumission attend la fin du décodage.
Les jetons de contraste de #54 et le focus blanc sidebar sont conservés.
La grille du formulaire impose une colonne `minmax(0, 1fr)` : le sélecteur de fichiers
natif ne doit pas élargir le contenu par sa largeur intrinsèque à 320 px.

Tests unitaires : nombre, taille à la limite et au-delà, type annoncé, sélection
mixte et décodage refusé, sélections concurrentes, suppression, résultats tardifs,
révocation des URL. Tests navigateur : vrai décodage WebP, contenu PNG invalide,
aperçu/récapitulatif/Modifier, suppression clavier/focus, capacité, annulation,
rechargement, zéro/une/deux photos d’exemple, images locales et repli, dans les deux
espaces aux formats 320 × 568, 390 × 844, 768 × 1024 et 1440 × 1024.
Les résultats exacts et les captures du dernier commit sont dans la PR.
La capture `photos-focus-fenetre` et les assertions de géométrie contrôlent le champ
focalisé après suppression, dont son dégagement de la navigation Agent fixe.
Les captures de page entière peuvent déplacer les éléments fixes dans l’image
assemblée ; elles complètent la capture de fenêtre, sans la remplacer.

Santé HTTP simulée ; pas d’intégration Django/proxy ni validation de téléphone,
caméra réelle, Safari, Windows/macOS ou lecteur d’écran. La possibilité de prise
de vue depuis le sélecteur dépend du navigateur ; elle reste à vérifier sur appareil.
Aucune conformité WCAG complète ni fidélité pixel par pixel à Figma revendiquée.

## Procédure manuelle et oral

1. Dans Agent puis Responsable, chercher un équipement, regarder vignette et fiche,
   recharger et vérifier le retour avec recherche intacte. Tester une image indisponible
   via les outils navigateur : les informations et la déclaration restent utilisables.
2. Déclarer avec titre et Basse, sans description ni photo. Revenir puis choisir une
   image JPEG/PNG/WebP, un fichier invalide et un fichier de plus de 5 Mio. Vérifier les
   messages, les autres valeurs et les aperçus déjà acceptés. Essayer quatre photos.
3. Vérifier le récapitulatif, Modifier, supprimer au clavier et observer le focus.
   Annuler/recharger/changer de matériel : aucune ancienne photo ne doit revenir.
4. Consulter INC-2026-045 (sans photo), 050 (une), 047 (deux). Refaire aux quatre
   largeurs, avec Tab/Maj+Tab/Entrée : pas de débordement, focus visible, images cadrées.
   Sur téléphone, vérifier séparément le choix fichier et l’éventuelle prise de vue.

Workflow : issue et consignes → état Git/prérequis vérifiés → branche dédiée →
Figma en lecture seule et assets → code/tests → contrôles → documentation →
PR en brouillon → CI du dernier commit. Arthur garde validation et fusion.
Les données passent des sources typées aux composants, et les fichiers du sélecteur
à l’instance mémoire de la déclaration. Le composant d’image commun ne porte que
le rendu et le repli ; les règles des photos restent dans le parcours.

À relire : `incident-photos.ts` (ressources et asynchronisme), `incident-declaration`
(liaison au parcours/focus), `demo-image` (réservation/repli), sources typées et tests.

1. Pourquoi `accept` et une extension `.png` ne garantissent-ils pas le décodage ?
2. Pourquoi révoquer les URL ne suffit-il pas à ignorer un ancien résultat asynchrone ?
3. Pourquoi les photos choisies n’apparaissent-elles jamais dans la liste fixe ?
