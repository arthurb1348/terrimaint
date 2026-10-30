import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DEMO_EQUIPMENT } from './equipements-demo';

@Component({
  selector: 'app-equipements',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './equipements.html',
  styleUrl: './equipements.css',
})
export class Equipements {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly search = computed(() => this.queryParams().get('q') ?? '');

  // La saisie ne modifie jamais la source : effacer restitue tous les équipements.
  protected readonly filteredEquipment = computed(() => {
    const query = this.search().trim().toLowerCase();
    return DEMO_EQUIPMENT.filter(
      (equipment) =>
        equipment.name.toLowerCase().includes(query) || equipment.id.toLowerCase().includes(query),
    );
  });

  protected updateSearch(value: string): void {
    // Remplacer l'entrée courante évite une étape d'historique pour chaque lettre saisie.
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: value || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
