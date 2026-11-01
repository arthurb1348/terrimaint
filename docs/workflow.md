# Workflow de développement

## Principes et source de vérité

GitHub constitue la source de vérité : le code intégré sur `main`, les issues, les PR
et la documentation versionnée portent l'état du projet. Le [bilan projet](project-status.md)
en fournit la synthèse factuelle ; il est mis à jour avec les évolutions significatives.
Une documentation ou une présentation externe sera une sortie dérivée, pas une seconde
source concurrente. Aucun outil de synchronisation externe n'est mis en place à ce stade.

Le workflow doit rester utilisable depuis un environnement cloud/mobile comme depuis
un PC. VS Code local est une aide facultative, pas un prérequis au processus normal.
Depuis mobile, Arthur peut préciser une issue, confier la tâche à un agent disposant
d'un environnement de travail, lire sa PR et ses preuves de CI, demander une correction
et décider de fusionner dans GitHub. Les commandes sont exécutées dans cet environnement,
sans supposer qu'un terminal fonctionne sur le téléphone. Les accès GitHub nécessaires
doivent être disponibles ; une absence de droits se signale sans contourner les protections.

Les modifications significatives passent par une branche et une PR avant intégration
dans `main`. Les tests automatisés et la CI sont utilisés lorsque pertinents ; les changements
de documentation demandent une vérification des liens, des faits et de la cohérence,
sans ajouter des tests applicatifs artificiels.

Le code assisté par IA doit rester compréhensible et maintenable par Arthur. Les commentaires
et docstrings, en français, expliquent principalement les intentions, décisions et comportements
non évidents ; ils évitent de paraphraser le code. Le guide pédagogique complète le code
pour les explications détaillées et les formats sans commentaires.

Une modification qui fonctionne n'est pas validée pour autant : compréhension et validation
humaine font partie du workflow. L'agent prépare des preuves et un compte rendu ; Arthur
relit, demande des explications et prend la décision d'intégration.

## Répartition

| Action | Qui la réalise ? |
| --- | --- |
| Définir le besoin et les critères d'acceptation | Arthur, avec l'aide de ChatGPT |
| Préparer une branche, coder et documenter la tâche | Agent dans un environnement cloud ou local |
| Formater et vérifier le Python | Ruff à la sauvegarde/au commit, puis CI |
| Exécuter les tests et signaler les échecs | Agent dans son environnement, GitHub Actions sur la PR |
| Proposer les mises à jour de dépendances | Dependabot |
| Relire le comportement et le diff, décider la fusion | Arthur |
| Activer les publications Hosting puis valider le site | Arthur ; après activation, CI publie les PR internes et main selon le [guide](firebase-hosting.md) |

## Cycle qualité et sécurité

1. Définir le résultat observable et les critères d'acceptation.
2. Identifier risques, données et permissions avant de coder : qui peut consulter ou modifier quoi ?
3. Implémenter l'incrément avec les tests adaptés aux succès, erreurs et accès refusés.
4. Vérifier les contrôles CI du commit proposé et relire la PR avant toute fusion par Arthur.

Pour les futures fonctions métier, préciser la validation des entrées côté serveur,
les mécanismes d'authentification et les autorisations par rôle et par collectivité.
Tester qu'un utilisateur ne peut pas accéder aux données d'une autre collectivité,
y compris via un identifiant ou un fichier direct. Définir types et tailles des photos/fichiers,
stockage et droits de consultation. Pour le hors connexion, définir données conservées,
effacement à la déconnexion, reprise, conflits et doublons de synchronisation.
Ces protections sont à construire et à tester ; le socle actuel ne les implémente pas.

Le socle de cette branche utilise Django/DRF ; PostgreSQL reste à raccorder. Les commandes
du README lancent Django. Toute évolution doit préserver ou faire évoluer explicitement
les contrats testés, notamment la santé consommée par Angular.

## Une tâche

1. Créer une issue avec un résultat observable, des critères d'acceptation et un périmètre.
2. Confier cette issue à Codex. Il annonce son plan et travaille sur une branche courte.
3. Codex exécute les contrôles, corrige les erreurs de sa tâche et prépare une PR en brouillon.
4. Lire son résumé, le diff et les résultats de CI ; vérifier le parcours concerné.
5. Demander des corrections si nécessaire, puis marquer la PR prête et fusionner en squash.
6. Supprimer la branche distante après fusion ; actualiser tout environnement de travail
   utilisé depuis `main`, en préservant les modifications locales éventuelles.

Une branche correspond à une tâche : `feat/1-init-angular`, `fix/12-incident-validation`,
`chore/7-update-dependencies`. Pas de branche `develop` permanente.
Viser une PR avec un seul résultat explicable et vérifiable.

## Prompt à réutiliser depuis cloud, mobile ou PC

```text
Lis AGENTS.md, README.md, docs/project.md, docs/project-status.md et docs/workflow.md.
Prends l'issue #N du dépôt TerriMaint et reformule ses critères d'acceptation.
Vérifie l'état Git puis utilise une branche dédiée. Annonce un plan court et réalise la tâche.
Exécute les contrôles pertinents et corrige les échecs liés à ton changement.
Prépare une pull request en brouillon avec les résultats de test et les points à relire.
Actualise le bilan si l'état du projet change. Fournis le compte rendu pédagogique
du workflow, avec 2 à 3 questions de compréhension. La fusion reste ma décision.
```

Dans l'option VS Code locale, l'extension doit être connectée au compte utilisé. Pour pousser et ouvrir une PR
depuis le poste local, Git et GitHub CLI doivent aussi être authentifiés (`gh auth status`).
Le plugin GitHub dans ChatGPT et l'authentification de ton poste local sont deux connexions distinctes.
Si l'issue n'est pas accessible depuis l'agent, lui fournir son contenu directement.

## Compte rendu pédagogique d'une PR significative

L'agent inclut dans la description de PR un compte rendu proportionné à la modification,
en s'appuyant sur le modèle du dépôt :

- Ce qui a été modifié et le résultat obtenu.
- Les fichiers importants et leur rôle.
- Le fonctionnement général et la circulation des données lorsqu'elle est pertinente.
- Les principaux choix techniques et leurs raisons.
- Comment tester : commandes, résultats réels, contrôle manuel et limites de vérification.
- Où intervenir pour modifier le comportement.
- Les points que le développeur doit particulièrement comprendre.
- Deux à trois questions pour vérifier cette compréhension.

Pour une PR de documentation, expliquer la provenance des faits, la structure et la façon
de mettre à jour les documents ; indiquer si la circulation de données n'est pas concernée.
La checklist humaine reste ouverte tant qu'Arthur n'a pas validé les critères et compris
la modification. Une CI verte ne remplit pas ces cases à sa place.

## Revue et publication Hosting (issue #61)

Le [guide Hosting](firebase-hosting.md) décrit l'activation PC par Arthur, le projet
TerriMaint/Spark, les variables/secrets et la preuve authentifiée à recueillir.
Après activation, un succès Backend/Frontend autorise une preview, pas la fusion :
Responsive et validation humaine restent à examiner. Le résumé CI contient le lien
et le SHA ; le même canal est actualisé à chaque nouveau commit courant validé.
CI lancé depuis `main` avec `pr_number` permet de revoir une PR déjà ouverte sans
modifier sa branche. La configuration en revue ne prouve pas un déploiement réussi.

## Réglage Codex

Utiliser un profil qui autorise les modifications et les commandes dans ce dépôt,
avec les demandes d'autorisation conservées pour les actions hors de ce périmètre.
Les noms des profils peuvent évoluer : vérifier la configuration de l'extension installée.
`AGENTS.md` guide le comportement de l'agent ; les protections GitHub imposent les conditions de fusion.
Vérifier que la session Codex prend en compte la version actuelle d’`AGENTS.md` ;
redémarrer la session si nécessaire.

## Protection de main

État du ruleset actif sur `main`, lu sur GitHub le 16 octobre 2026
([preuve et référence](project-status.md#cicd-présente)) :

- Passage par une pull request.
- Contrôles `Backend` et `Frontend` obligatoires, avec branche actualisée.
- Discussions résolues, force push et suppression de la branche bloqués.
- Aucun bypass. Convention du projet : fusion manuelle, en squash.
- Zéro approbation tierce obligatoire pendant le développement solo.

Arthur ne peut pas approuver une PR dont il est l'auteur. Sa validation consiste donc à relire
et décider de fusionner lorsque la CI est verte. Les protections ne prouvent pas qu'une relecture
humaine a eu lieu ; cette étape reste une convention de travail avec l'agent.
Les rulesets sont disponibles pour les dépôts publics avec GitHub Free.

## Relecture rapide

Vérifier les critères d'acceptation, les changements sensibles, les résultats réellement exécutés
et le comportement manuel. Demander une explication sur les parties que tu ne saurais pas
présenter à l'oral. Une CI verte complète cette relecture.

## Sources

- [Instructions AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex dans l'éditeur](https://learn.chatgpt.com/docs/codex/ide)
- [Rulesets GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository)
- [Relecture des PR et limite d'auto-approbation](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request)
- [uv dans GitHub Actions](https://docs.astral.sh/uv/guides/integration/github/)

Pour la revue photos #57, utiliser [la procédure Pixel et les mesures](photos-demo.md) :
caméra/galerie natives et performances physiques restent à Arthur. Lire CI et Responsive
sur le dernier commit, puis le résumé Firebase Hosting **de cette exécution** ; comparer
le SHA à `/deployment.json`. Ne pas déduire le succès de la présence d’une configuration.
