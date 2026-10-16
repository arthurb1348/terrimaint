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
      <ul>
        <li><a routerLink="/responsable/equipements">Matériel</a></li>
        <li><a routerLink="/responsable/incidents">Incidents</a></li>
        <li><a routerLink="/responsable/interventions">Interventions</a></li>
      </ul>
      <p>Le responsable pourra également effectuer les actions de terrain.</p>
      <a routerLink="/agent">Accéder à l’espace Agent</a>
    </section>
  `,
})
export class Responsable {}
