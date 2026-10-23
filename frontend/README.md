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
uv run --locked python backend/manage.py runserver
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

Tests responsive dans un navigateur Chromium :

```sh
npx playwright install chromium
npm run test:responsive
npm run test:responsive:report
```

Playwright démarre son serveur Angular sur `127.0.0.1:4173` et simule la santé de l'API.
Les pages sont vérifiées à 320, 390, 768 et 1440 px, avec des captures dans le rapport HTML.
Le suffixe `.pw.ts` garde ces tests séparés de Vitest. Sur Linux, ajouter `--with-deps`
à l'installation Chromium si les bibliothèques système manquent. Voir le
[guide des tests responsive](../docs/code-guide.md#tests-navigateur-responsive).

Vérification manuelle : constater API disponible avec Django lancé, arrêter l'API,
cliquer sur Vérifier à nouveau et constater API indisponible. Relancer le serveur et
réessayer. Vérifier aussi l'affichage mobile (375 px) et la navigation au clavier.

Les explications des sources, tests et JSON sont dans [le guide pédagogique](../docs/code-guide.md).
Les instructions communes sont dans [le README racine](../README.md).
