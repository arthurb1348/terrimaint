## Besoin

Initialiser la partie frontend de TerriMaint afin de pouvoir développer les premiers parcours
Angular dans le même workflow que le backend.

## Périmètre

- Générer l'application dans `frontend/` avec Angular et TypeScript en mode strict.
- Prévoir le routage et une structure simple de composants standalone.
- Consulter la documentation officielle pour choisir des versions Angular/Node compatibles.
- Verrouiller les dépendances npm et déclarer la version Node utilisée.
- Fournir un accueil minimal avec l'état de l'API, sans développer les écrans métier.
- Utiliser un proxy de développement vers l'API ; documenter le démarrage des deux services.
- Ajouter lint, tests automatisés et build, ainsi qu'un job de CI nommé `Frontend`.
- Ajouter `Frontend` à la configuration du ruleset. Son activation distante sera vérifiée
  et faite dans une tâche de réglage dédiée une fois le job observé sur GitHub.

## Critères d'acceptation

- [ ] `npm ci` installe les dépendances depuis le fichier de verrouillage.
- [ ] Le démarrage local affiche la page d'accueil et l'état disponible/indisponible de l'API.
- [ ] Le lint, les tests sans mode watch et le build ont chacun une commande documentée.
- [ ] Les tests couvrent l'état affiché selon le résultat de l'appel API.
- [ ] Le job `Frontend` exécute les contrôles sur les PR et sur `main`.
- [ ] Le README indique les commandes et les versions réellement utilisées.
- [ ] La PR explique les fichiers importants et les vérifications réalisées.

## Limites

Les rôles Agent et Responsable devront tous deux être utilisables sur mobile et sur ordinateur.
Cette tâche initialise l'application ; elle ne crée ni authentification, ni écrans d'incidents,
ni mécanisme hors connexion. Ces fonctions feront l'objet de parcours séparés.
