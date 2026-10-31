import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-responsable',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="feature-page" aria-labelledby="responsable-title">
      <h1 id="responsable-title">Tableau de bord</h1>
      <p>Le suivi et la planification seront développés progressivement dans ces rubriques.</p>
      <ul class="page-shortcuts">
        <li><a class="page-action secondary" routerLink="/responsable/equipements">Matériel</a></li>
        <li><a class="page-action" routerLink="/responsable/incidents">Incidents</a></li>
        <li>
          <a class="page-action secondary" routerLink="/responsable/interventions">Interventions</a>
        </li>
      </ul>
      <p>Le responsable pourra également effectuer les actions de terrain.</p>
      <a class="page-action secondary" routerLink="/agent">Accéder à l’espace Agent</a>
    </section>
  `,
})
export class Responsable {}
