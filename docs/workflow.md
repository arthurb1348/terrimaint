# Workflow de développement

## Répartition

| Action | Qui la réalise ? |
| --- | --- |
| Définir le besoin et les critères d'acceptation | Arthur, avec l'aide de ChatGPT |
| Préparer une branche, coder et documenter la tâche | Codex dans VS Code |
| Formater et vérifier le Python | Ruff à la sauvegarde/au commit, puis CI |
| Exécuter les tests et signaler les échecs | Codex localement, GitHub Actions sur la PR |
| Proposer les mises à jour de dépendances | Dependabot |
| Relire le comportement et le diff, décider la fusion | Arthur |
| Décider un déploiement | Arthur, une fois un workflow de déploiement défini |

## Une tâche

1. Créer une issue avec un résultat observable, des critères d'acceptation et un périmètre.
2. Confier cette issue à Codex. Il annonce son plan et travaille sur une branche courte.
3. Codex exécute les contrôles, corrige les erreurs de sa tâche et prépare une PR en brouillon.
4. Lire son résumé, le diff et les résultats de CI ; vérifier le parcours concerné.
5. Demander des corrections si nécessaire, puis marquer la PR prête et fusionner en squash.
6. Supprimer la branche distante et remettre le poste local sur un `main` à jour.

Une branche correspond à une tâche : `feat/1-init-angular`, `fix/12-incident-validation`,
`chore/7-update-dependencies`. Pas de branche `develop` permanente.
Viser une PR avec un seul résultat explicable et vérifiable.

## Prompt à réutiliser dans VS Code

```text
Lis AGENTS.md, README.md, docs/project.md et docs/workflow.md.
Prends l'issue #N du dépôt TerriMaint et reformule ses critères d'acceptation.
Vérifie l'état Git puis utilise une branche dédiée. Annonce un plan court et réalise la tâche.
Exécute les contrôles pertinents et corrige les échecs liés à ton changement.
Prépare une pull request en brouillon avec les résultats de test et les points à relire.
Explique en quelques lignes le code que je dois comprendre. La fusion reste ma décision.
```

L'extension Codex doit être connectée à ton compte ChatGPT. Pour pousser et ouvrir une PR
depuis le poste local, Git et GitHub CLI doivent aussi être authentifiés (`gh auth status`).
Le plugin GitHub dans ChatGPT et l'authentification de ton poste local sont deux connexions distinctes.
Si l'issue n'est pas accessible depuis l'agent local, lui fournir son contenu directement.

## Réglage Codex

Utiliser un profil qui autorise les modifications et les commandes dans ce dépôt,
avec les demandes d'autorisation conservées pour les actions hors de ce périmètre.
Les noms des profils peuvent évoluer : vérifier la configuration de l'extension installée.
`AGENTS.md` guide le comportement de l'agent ; les protections GitHub imposent les conditions de fusion.
Redémarrer la session Codex après une modification de ses instructions de projet.

## Protection de main

Réglages souhaités pour le ruleset actif sur `main` :

- Passage par une pull request.
- Contrôle de statut `Backend` obligatoire ; ajouter `Frontend` lors de l'initialisation Angular.
- Discussions résolues, force push et suppression de la branche bloqués.
- Aucun bypass ; fusion manuelle, en squash.
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
