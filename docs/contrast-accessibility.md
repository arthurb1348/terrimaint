# Contrastes interactifs — issue #53, en revue

## Résultat et choix

Branche `fix/53-accessible-contrast`, créée depuis `origin/main`
`4722b2403b5592e96a0d8d645dea94bd721fb9ee`, vérifié par Git et GitHub :
la PR #52 est fusionnée. #53 reste **en revue jusqu'à fusion par Arthur**.
Les images/photos restent dans #43 ; aucune dépendance ni fonctionnalité ajoutée.

Le focus utilise `--focus: #A5682D`, distinct de `--accent: #C3823E`.
Les bordures des champs de déclaration, programmation et filtres utilisent
`--control-border: #6B7C72`. Le bouton Fermer du menu Plus emploie ce même jeton.
La recherche Matériel garde son contour vert. Cartes, tableaux et menus gardent
`--border: #D5DFD9` et les cartes gardent `--card-surface: #F4F8F5`.
La règle d’erreur de déclaration cible explicitement input/textarea pour primer
sur le sélecteur du champ texte ; une assertion compare bordure et message d’erreur.
Les focus locaux (dont le bouton de santé) suivent le jeton commun ; la sidebar
conserve son focus blanc, décalé de 2 px sur le fond vert.

Les candidats ont été retenus après examen des sélecteurs et des fonds réellement
adjacents. Le brun serait insuffisant sur le vert (2,068021:1) : la règle blanche
locale reste donc nécessaire. Le gris de contrôle n'est pas utilisé comme texte :
sur blanc, son rapport 4,419935:1 reste inférieur à 4,5, même s'il peut sembler proche.

## Mesures sRGB WCAG

Luminance : chaque canal sRGB entre 0 et 1 devient `c/12,92` si `c ≤ 0,04045`,
sinon `((c + 0,055)/1,055)^2,4` ; pondération 0,2126 / 0,7152 / 0,0722.
Rapport : `(Lclair + 0,05)/(Lsombre + 0,05)`. Les assertions comparent les nombres
**sans arrondir** à 3 ou 4,5 ; seules les valeurs ci-dessous sont arrondies à six décimales.

| Couleur / fond | Rapport | Usage / seuil |
| --- | ---: | --- |
| Focus #A5682D / blanc | 4,547537 | Champs, actions, menus : ≥ 3 |
| Focus #A5682D / carte #F4F8F5 | 4,242656 | Liens et actions dans les résumés : ≥ 3 |
| Focus #A5682D / page #F5F5F5 | 4,171168 | Cible main du lien d'évitement : ≥ 3 |
| Focus #A5682D / surface #E4ECE8 | 3,781432 | Paire de réserve, surface de survol ; contour décalé : fond extérieur à mesurer |
| Bordure #6B7C72 / blanc | 4,419935 | Intérieur et extérieur des champs : ≥ 3 |
| Bordure #6B7C72 / carte #F4F8F5 | 4,123608 | Paire de réserve, pas de champ actuel sur carte |
| Bordure #6B7C72 / surface #E4ECE8 | 3,675326 | Paire de réserve, pas de champ actuel sur cette surface |
| Blanc / vert #234E3F | 9,404402 | Focus sidebar ≥ 3 ; texte des actions ≥ 4,5 |
| Blanc / vert de survol #1B4033 | 11,489449 | Texte des actions principales ≥ 4,5 |
| Vert #234E3F / blanc | 9,404402 | Liens et actions secondaires ≥ 4,5 ; contours ≥ 3 |
| Vert #234E3F / surface #E4ECE8 | 7,820081 | Texte secondaire au survol ≥ 4,5 |
| Texte #25312C / blanc | 13,510402 | Champs et texte courant ≥ 4,5 |
| Texte #25312C / carte #F4F8F5 | 12,604623 | Résumés ≥ 4,5 |
| Texte #25312C / surface #E4ECE8 | 11,234360 | Navigation active/survol sidebar ≥ 4,5 |
| Secondaire #53635A / carte #F4F8F5 | 5,936687 | Références ≥ 4,5 |
| Secondaire #53635A / blanc | 6,363303 | Navigation et aide ≥ 4,5 |
| Haute #704512 / #FFF1DC | 7,402151 | Badge textuel ≥ 4,5 |
| Urgente #8C2921 / #FCE8E5 | 7,258159 | Badge textuel ≥ 4,5 |
| Erreur #9A2A22 / blanc | 7,697131 | Texte ≥ 4,5 et bordure ≥ 3 |

Les états normal, survol, focus, activation et erreur gardent leurs contrastes.
L'activation n'a pas de nouvelle couleur CSS ; le test maintient le pointeur appuyé
pour mesurer `:active`. Au focus, le décalage de 4 px laisse le fond extérieur de part
et d'autre du contour : le fond du bouton plein n'est pas adjacent à celui-ci.
De même le focus blanc entoure les liens sidebar actifs ou survolés sur le vert,
et non directement sur leur remplissage clair. Les libellés des priorités, statuts
et erreurs restent visibles ; la couleur ne porte pas seule ces informations.

## Contrôle ciblé et limites

`frontend/e2e/contrast.pw.ts` est exécuté avec la suite responsive existante à
320 × 568, 390 × 844, 768 × 1024 et 1440 × 1024. Il lit `getComputedStyle`
sur les éléments rendus, remonte les ancêtres transparents jusqu'au fond opaque,
et compare texte/fond, bordure/intérieur/extérieur et focus/fond extérieur.
Les couleurs et rapports exacts sont joints en JSON au rapport Playwright.
La suppression d'une application locale de jeton ou son remplacement par l'ancien
accent/bordure fait ainsi échouer le contrôle concerné, même si le jeton reste déclaré.
La bordure décorative des cartes est aussi protégée contre un assombrissement global.

Parcours : recherche Matériel, lien de carte, actions de fiche signalement,
Voir le matériel/signalement dans les résumés d'intervention, déclaration vide et
invalide, filtres des deux listes, programmation normale et invalide, badges,
main, changement d'espace, navigation Agent, Plus/Fermer et sidebar Responsable,
bouton de santé. Le test établit une modalité clavier puis focalise chaque cible ;
les parcours existants couvrent l'ordre Tab/Maj+Tab, Entrée, Échap et les retours.
Il vérifie le contour dans la fenêtre, les ancêtres qui pourraient le rogner et
l'absence de masque aux quatre bords intérieurs du contrôle. Les captures de fenêtre
complètent ces sondes : ce contrôle géométrique n'est pas une preuve pixel par pixel.
Le grand bloc main peut dépasser la fenêtre : seule sa couleur est mesurée ici ;
le parcours existant du lien d'évitement contrôle son accès clavier.

Portée WCAG 2.2 : [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
[1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html),
[2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html),
[1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
Il ne s'agit pas d'une certification globale ni de 2.4.13 Focus Appearance AAA.
Les séparations décoratives ne sont pas soumises artificiellement à 3:1.
Les contrôles désactivés relèvent des exceptions de contraste ; le bouton de santé
en attente reste désactivé, avec son libellé. Les radios, cases et sélecteurs/calendriers
natifs restent peints par le navigateur : leurs pixels internes et les icônes SVG
ne sont pas déduits de `border-color` ni certifiés par ce test. Leur focus externe,
les interactions existantes et les captures sont à examiner en complément.
Pas de fonds translucides, images ou gradients dans les paires mesurées ; le calcul
exige des couleurs sRGB opaques. Santé HTTP simulée ; aucune intégration Django/proxy,
Safari, appareil physique, Windows/macOS ou lecteur d'écran validé par ces essais.

## Procédure manuelle pour Arthur

1. Lancer le frontend et Django selon le README. Dans Agent puis Responsable,
   ouvrir Matériel. À 320, 390, 768 et 1440 px, parcourir avec Tab/Maj+Tab :
   recherche vide, effacement, noms dans les cartes puis fiche et actions.
   Vérifier le contour brun complet et visible au-dessus de la barre Agent.
2. Ouvrir une déclaration ; inspecter Intitulé/Description avant saisie, survol,
   focus, puis soumettre vide. Vérifier la bordure rouge, le message et le focus
   au premier champ invalide. Tester radio et case au clavier, compléter avec Basse,
   vérifier le récapitulatif puis Modifier ; les saisies doivent être conservées.
3. Dans Responsable, parcourir les filtres des signalements et interventions,
   puis ouvrir une intervention et ses liens d'origine. Depuis un signalement ouvert,
   programmer : titre, consignes, agent et date. Vérifier les erreurs et la correction,
   sans changement des sources de démonstration ni enregistrement réel.
4. Tester survol et maintien du clic, focus du lien d'évitement, changement d'espace,
   Plus/Fermer/Échap et menu Responsable. Sur la sidebar verte, vérifier le contour
   **blanc**, y compris sur le lien actif et au survol. Inspecter les contours de champs
   natifs et les icônes sur son navigateur ; ils complètent le contrôle automatisé.
5. Comparer les captures du rapport Responsive et constater que les cartes restent
   discrètes. Relire diff, résultats CI et limites avant de choisir la fusion.

## Compte rendu pédagogique

Workflow : lecture de l'issue et des consignes → état Git préservé → dernier main
et #52 vérifiés → branche dédiée → correction CSS → mesures du rendu et tests →
documentation → commit/publication → PR en brouillon et consultation de sa CI.
Arthur conserve la validation humaine et la fusion.

Les données ne changent pas de trajet : sources locales → composants → HTML.
La cascade CSS résout les variables globales puis les règles locales ; la sidebar
remplace uniquement la couleur du contour. Modifier `styles.css` pour les jetons,
les CSS de fonctionnalités pour leurs usages et `contrast.pw.ts` pour ajouter un
nouveau contexte rendu. Le guide explique la portée ; les résultats datés sont dans la PR.

À maîtriser : une valeur de palette correcte ne suffit pas si un sélecteur local
utilise encore l'ancienne valeur ; un contour décoratif et un contrôle vide n'ont
pas le même rôle ; les seuils s'appliquent avant tout arrondi d'affichage.

1. Pourquoi ne pas assombrir directement `--accent` et `--border` ?
2. Pourquoi le focus blanc reste-t-il nécessaire sur la sidebar malgré le nouveau brun ?
3. Pourquoi #6B7C72 convient-il à une bordure mais pas au texte courant sur blanc ?
