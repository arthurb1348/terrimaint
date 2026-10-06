# Frontend TerriMaint

Accueil Angular 22.2.1 strict et standalone, avec routage et état de l'API.
Node 24.21.0 LTS et npm 11.19.0 ; versions déclarées dans .nvmrc à la racine,
.node-version et package.json. package-lock.json verrouille l'installation.

Depuis ce dossier :

```sh
npm ci
npm start
```

Depuis la racine, dans un second terminal :

```sh
uv run --locked uvicorn terrimaint_api.main:app --reload
```

Ouvrir http://localhost:4200. Le proxy redirige /api/** vers http://127.0.0.1:8000.
L'accueil vérifie la santé à l'ouverture ou au clic, avec un délai maximal de cinq secondes.

```sh
npm run lint
npm test
npm run build
```

Les tests Vitest sont sans watch et ne nécessitent pas l'API. npm run test:watch surveille
les changements. Le build de production est dans dist/terrimaint/browser.

Vérification manuelle : constater API disponible avec Uvicorn lancé, arrêter l'API,
cliquer sur Vérifier à nouveau et constater API indisponible. Relancer le serveur et
réessayer. Vérifier aussi l'affichage mobile (375 px) et la navigation au clavier.

Les explications des sources, tests et JSON sont dans [le guide pédagogique](../docs/code-guide.md).
Les instructions communes sont dans [le README racine](../README.md).
