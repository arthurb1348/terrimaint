# Terminer la création du dépôt depuis VS Code

Le dépôt est préparé localement. Tant qu'aucune création distante n'a abouti,
les règles JSON sont une configuration à appliquer, pas des protections actives sur GitHub.

## Premier prompt pour Codex

Ouvrir le dossier `terrimaint` dans VS Code et envoyer ce prompt à l'extension :

```text
Termine l'initialisation de ce dépôt TerriMaint sur mon compte GitHub personnel.
J'autorise la création d'un dépôt PUBLIC nommé terrimaint et la publication de ce socle.

Lis AGENTS.md, README.md et docs/workflow.md. Vérifie l'état Git et annonce un plan court.
Vérifie Git, Python 3.12, uv et GitHub CLI. Vérifie l'authentification GitHub avec gh auth status.
Si un outil ou une connexion manque, indique le minimum à faire pour le rendre disponible.
N'invente pas mon identité Git et ne modifie pas ma configuration Git globale.

Identifie mon compte avec gh api user --jq .login. Vérifie si un dépôt terrimaint existe déjà.
S'il existe, inspecte-le avant toute écriture et arrête-toi si sa réutilisation est ambiguë.

Exécute uv sync --locked, les contrôles de scripts/check.py et installe les hooks pre-commit.
Initialise Git sur main si nécessaire. Crée le commit initial avec les fichiers du socle.
Crée et pousse le dépôt avec gh repo create terrimaint --public --source=. --remote=origin --push.
Ajoute une description courte et la signature « Du terrain à la décision ».

Applique .github/repository-settings.json aux réglages du nouveau dépôt avec gh api.
Vérifie la première exécution de CI. Si elle échoue, explique l'échec et corrige-le sur une branche.
Une fois le contrôle Backend observé, crée le ruleset avec .github/rulesets/main.json.
Vérifie par lecture des réglages que le ruleset est actif, qu'il cible main, qu'il exige Backend
et une PR, et qu'il bloque les force pushes et les suppressions sans bypass.

Crée l'issue d'initialisation Angular à partir de docs/tasks/init-angular.md,
avec gh issue create --title "Initialiser Angular et ses contrôles" --body-file docs/tasks/init-angular.md.
Ne réalise pas cette issue pendant l'initialisation.

Donne-moi l'URL du dépôt, le résultat réel de la CI, le statut des protections et l'URL de l'issue.
Après ce bootstrap, tous les changements passent par une branche et une PR que je fusionne moi-même.
```

## Commandes GitHub à appliquer

Les commandes suivantes sont une référence pour l'agent. Remplacer `OWNER` par le compte
réel obtenu avec `gh api user --jq .login`. Les exécuter uniquement sur le nouveau dépôt identifié.

```sh
gh repo create terrimaint --public --source=. --remote=origin --push
gh api --method PATCH repos/OWNER/terrimaint --input .github/repository-settings.json
gh api --method POST repos/OWNER/terrimaint/rulesets --input .github/rulesets/main.json
gh api repos/OWNER/terrimaint/rulesets
```

La création du ruleset se fait une seule fois. En cas de reprise, lire d'abord les rulesets
existants et leurs détails au lieu d'en créer un doublon.
Avec une CI en échec, garder le dépôt révisable, préciser le blocage et ne pas déclarer
les vérifications réussies. Les correctifs suivants utilisent des PR.

Si GitHub CLI manque, utiliser son [installation officielle](https://cli.github.com/).
L'authentification locale peut nécessiter une validation interactive de ton compte.
