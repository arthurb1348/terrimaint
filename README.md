# TerriMaint

**Du terrain à la décision.**

Application de suivi de maintenance pour les petites collectivités : signaler un incident,
consulter un équipement et organiser les interventions avec un historique partagé.
Projet fil rouge de formation Concepteur Développeur d'Applications.

## État du projet

Le [bilan projet versionné](docs/project-status.md) distingue l'état réel, les travaux en cours
et les intentions documentées, avec leurs sources. GitHub constitue la source de vérité.

Socle initial : API FastAPI minimale, tests HTTP, Ruff, dépendances gérées par uv,
CI GitHub Actions, modèles d'issues et de pull requests, consignes Codex et configuration VS Code.
Le frontend Angular strict et standalone fournit un accueil responsive avec l'état de l'API.
La base PostgreSQL et les fonctions métier seront ajoutées par petites tâches.
L'endpoint de santé vérifie que l'API répond ; il ne vérifie pas de base de données.

## Installation

Prérequis : Git, Python 3.12, [uv](https://docs.astral.sh/uv/getting-started/installation/),
Node **24.21.0 LTS** (`.nvmrc`) et npm **11.19.0**. Le frontend utilise Angular **22.2.1**,
TypeScript **6.0.3** et Vitest. `uv.lock` et `frontend/package-lock.json` fixent les dépendances.
Depuis la racine du dépôt, dans un terminal local ou un environnement cloud disposant
des prérequis (VS Code est facultatif) :

```sh
uv sync --locked
uv run pre-commit install
uv run --locked python scripts/check.py
```

Avec VS Code, choisir l'interpréteur de `.venv`. Les hooks locaux se réinstallent après chaque clone.
Ils corrigent et formatent les fichiers Python au commit ; si des fichiers sont corrigés,
relire le diff, les ajouter à nouveau puis relancer le commit.

## Démarrer l'API

```sh
uv run --locked uvicorn terrimaint_api.main:app --reload
```

- Documentation interactive : <http://127.0.0.1:8000/docs>
- Santé de l'API : <http://127.0.0.1:8000/api/v1/health>

## Démarrer le frontend

Dans un second terminal, depuis la racine :

```sh
cd frontend
npm ci
npm start
```

Ouvrir <http://localhost:4200>. Le proxy de développement transmet `/api/**` à
`http://127.0.0.1:8000` ; aucune ouverture CORS n'est nécessaire sur le backend.
La page vérifie l'API à son ouverture et au clic sur « Vérifier à nouveau ».
L'état devient indisponible après une erreur ou cinq secondes sans réponse.
Ce statut ne prouve pas qu'une base de données fonctionne.

## Vérifier le frontend

Depuis `frontend/` :

```sh
npm run lint
npm test
npm run build
```

`npm test` lance Vitest sans mode watch et sans serveur réel. `npm run test:watch` est
disponible pour développer. Le build de production sort dans `frontend/dist/terrimaint/browser`.
La CI exécute les jobs `Backend` et `Frontend` sur les PR et sur `main`.
Le fichier de ruleset prévoit les deux contrôles ; l'activation distante de `Frontend`
reste une tâche dédiée après observation de ce job.

Pour une vérification manuelle : démarrer les deux services, constater « API disponible »,
arrêter Uvicorn puis cliquer sur le bouton pour voir « API indisponible ». Relancer l'API
et vérifier à nouveau. Tester à 375 px et au clavier : contenu sans débordement,
focus visible et libellé de statut lisible sans dépendre de la couleur.

## Organisation

| Dossier ou fichier | Rôle |
| --- | --- |
| `backend/src/terrimaint_api/` | Application FastAPI |
| `backend/tests/` | Tests du contrat HTTP et futurs tests métier |
| `frontend/` | Accueil Angular strict, routage, état de l'API et contrôles |
| `docs/` | Contexte, décisions et workflow |
| `scripts/check.py` | Une commande de vérification commune au poste local et à la CI |
| `.github/` | CI, Dependabot et modèles de suivi |
| `AGENTS.md` | Consignes de travail pour Codex |

## Développer avec Codex

Une issue précise → une branche → implémentation et contrôles → une pull request → relecture et fusion par Arthur.
Les instructions complètes sont dans [le workflow](docs/workflow.md).
Ce processus se pilote depuis mobile ou PC avec GitHub et un agent dans un environnement
cloud ou local. La relecture et la compréhension du développeur complètent les contrôles automatisés.
Les [décisions](docs/decisions.md) et le [contexte produit](docs/project.md) fixent le cadre.
Le [guide pédagogique du code](docs/code-guide.md) explique les fichiers et les configurations.
Pour publier ce socle neuf, utiliser [le guide d'initialisation GitHub](docs/bootstrap.md).

## Vérifier et formater

```sh
uv run --locked python scripts/check.py
uv run --locked ruff check --fix .
uv run --locked ruff format .
```

La première commande vérifie sans corriger. Les deux suivantes corrigent le lint et le format.
Dependabot propose les mises à jour dans des PR ; la fusion reste manuelle.
