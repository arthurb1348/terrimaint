import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-responsable',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="feature-page" aria-labelledby="responsable-title">
      <h1 id="responsable-title">Espace Responsable</h1>
      <p>Le suivi et la planification seront développés progressivement dans ces rubriques.</p>
      <ul>
        <li><a routerLink="/equipements">Équipements</a></li>
        <li><a routerLink="/incidents">Incidents</a></li>
        <li><a routerLink="/interventions">Interventions</a></li>
      </ul>
      <p>Le responsable pourra également effectuer les actions de terrain.</p>
      <a routerLink="/agent">Accéder à l’espace Agent</a>
    </section>
  `,
})
export class Responsable {}
