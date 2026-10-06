# TerriMaint

**Du terrain à la décision.**

Application de suivi de maintenance pour les petites collectivités : signaler un incident,
consulter un équipement et organiser les interventions avec un historique partagé.
Projet fil rouge de formation Concepteur Développeur d'Applications.

## État du projet

Socle initial : API FastAPI minimale, tests HTTP, Ruff, dépendances gérées par uv,
CI GitHub Actions, modèles d'issues et de pull requests, consignes Codex et configuration VS Code.
Le frontend Angular, la base PostgreSQL et les fonctions métier seront ajoutés par petites tâches.
L'endpoint de santé vérifie que l'API répond ; il ne vérifie pas de base de données.

## Installation

Prérequis : Git, Python 3.12 et [uv](https://docs.astral.sh/uv/getting-started/installation/).
Ouvrir la racine du dépôt dans VS Code, puis exécuter dans son terminal :

```sh
uv sync --locked
uv run pre-commit install
uv run --locked python scripts/check.py
```

Choisir l'interpréteur de `.venv` dans VS Code. Les hooks locaux se réinstallent après chaque clone.
Ils corrigent et formatent les fichiers Python au commit ; si des fichiers sont corrigés,
relire le diff, les ajouter à nouveau puis relancer le commit.

## Démarrer l'API

```sh
uv run --locked uvicorn terrimaint_api.main:app --reload
```

- Documentation interactive : <http://127.0.0.1:8000/docs>
- Santé de l'API : <http://127.0.0.1:8000/api/v1/health>

## Organisation

| Dossier ou fichier | Rôle |
| --- | --- |
| `backend/src/terrimaint_api/` | Application FastAPI |
| `backend/tests/` | Tests du contrat HTTP et futurs tests métier |
| `frontend/` | Emplacement de la future PWA Angular |
| `docs/` | Contexte, décisions et workflow |
| `scripts/check.py` | Une commande de vérification commune au poste local et à la CI |
| `.github/` | CI, Dependabot et modèles de suivi |
| `AGENTS.md` | Consignes de travail pour Codex |

## Développer avec Codex

Une issue précise → une branche → implémentation et contrôles → une pull request → relecture et fusion par Arthur.
Les instructions complètes sont dans [le workflow](docs/workflow.md).
Les [décisions](docs/decisions.md) et le [contexte produit](docs/project.md) fixent le cadre.
Pour publier ce socle neuf, utiliser [le guide d'initialisation GitHub](docs/bootstrap.md).

## Vérifier et formater

```sh
uv run --locked python scripts/check.py
uv run --locked ruff check --fix .
uv run --locked ruff format .
```

La première commande vérifie sans corriger. Les deux suivantes corrigent le lint et le format.
Dependabot propose les mises à jour dans des PR ; la fusion reste manuelle.
