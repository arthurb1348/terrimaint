/** Démarre Angular dans l'élément app-root du document HTML. */
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// La promesse rejette un échec de démarrage ; la console conserve le diagnostic.
// Les erreurs HTTP ordinaires sont traitées séparément dans ApiHealth.
bootstrapApplication(App, appConfig).catch((error: unknown) => console.error(error));
