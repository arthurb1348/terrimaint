import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { MainNavigation } from './shared/main-navigation/main-navigation';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainNavigation, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly navigation = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => ({
        url: this.router.url.split(/[?#]/)[0],
        label: this.router.routerState.snapshot.root.firstChild?.data['label'] as
          string | undefined,
      })),
    ),
    { initialValue: { url: '/', label: 'TerriMaint' } },
  );
  // Un espace décrit la navigation affichée, jamais les droits de l'utilisateur.
  protected readonly space = computed(() =>
    this.navigation().url.startsWith('/responsable') ? 'responsable' : 'agent',
  );
  protected readonly label = computed(() => this.navigation().label ?? 'TerriMaint');
  protected readonly landing = computed(() => this.navigation().url === '/');
}
