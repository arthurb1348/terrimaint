/** Relie la vérification HTTP à l'état visible sur l'accueil. */
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiAvailability, ApiHealth } from '../api-health';

/** Composant standalone sans paramètre d'entrée ; conserve seulement l'état de santé. */
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly apiHealth = inject(ApiHealth);
  private readonly destroyRef = inject(DestroyRef);
  // Un signal prévient Angular à chaque changement, sans dépendre de Zone.js.
  protected readonly state = signal<ApiAvailability | 'checking'>('checking');

  /** Sans paramètre ni résultat, vérifie l'API dès l'ouverture de la page. */
  ngOnInit(): void {
    this.refresh();
  }

  /** Sans paramètre ni résultat, lance une vérification et actualise l'écran. */
  protected refresh(): void {
    this.state.set('checking');
    this.apiHealth
      .check()
      .pipe(
        // Quitter la page annule la requête et l'abonnement, sans fuite de ressources.
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((availability) => this.state.set(availability));
  }
}
