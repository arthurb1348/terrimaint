/** Déclare les services partagés nécessaires au démarrage : erreurs, HTTP et routage. */
import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// L'injection rend HttpClient disponible dans le service de santé sans créer de module.
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient(), provideRouter(routes)],
};
