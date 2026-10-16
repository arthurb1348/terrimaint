import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="feature-page" aria-labelledby="agent-title">
      <h1 id="agent-title">Espace Agent</h1>
      <p>Les parcours terrain seront développés progressivement dans ces rubriques.</p>
      <ul>
        <li><a routerLink="/equipements">Équipements</a></li>
        <li><a routerLink="/incidents">Incidents</a></li>
        <li><a routerLink="/interventions">Interventions</a></li>
      </ul>
    </section>
  `,
})
export class Agent {}
