/** Interroge le contrat de santé de l'API et transforme les erreurs en état affichable. */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, timeout } from 'rxjs';

/** Deux résultats terminaux ; « checking » appartient seulement à l'interface. */
export type ApiAvailability = 'available' | 'unavailable';

/** Service partagé sans paramètre de construction : HttpClient est injecté par Angular. */
@Injectable({ providedIn: 'root' })
export class ApiHealth {
  private readonly http = inject(HttpClient);

  /** Sans paramètre, émet un état puis termine. Chaque abonnement déclenche un GET.
   * Se désabonner annule la requête en cours ; aucune erreur n'est transmise à la vue.
   */
  check(): Observable<ApiAvailability> {
    // URL relative : proxy en développement, même domaine en production.
    // unknown oblige à valider le JSON reçu plutôt qu'à croire un type TypeScript.
    return this.http.get<unknown>('/api/v1/health').pipe(
      // Une API silencieuse ne laisse pas l'écran bloqué en attente.
      timeout({ first: 5000 }),
      map((response): ApiAvailability =>
        typeof response === 'object' &&
        response !== null &&
        'status' in response &&
        response.status === 'ok'
          ? 'available'
          : 'unavailable',
      ),
      // Erreur HTTP, réseau, JSON ou délai dépassé : un même résultat lisible.
      catchError(() => of<ApiAvailability>('unavailable')),
    );
  }
}
