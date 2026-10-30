import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="feature-page" aria-labelledby="agent-title">
      <h1 id="agent-title">Accueil</h1>
      <p>Les parcours terrain seront développés progressivement dans ces rubriques.</p>
      <ul>
        <li><a routerLink="/agent/equipements">Matériel</a></li>
        <li><a routerLink="/agent/incidents">Incidents</a></li>
        <li class="scanner-shortcut"><a routerLink="/agent/scanner">Scanner un QR code</a></li>
      </ul>
    </section>
  `,
  styleUrl: './agent.css',
})
export class Agent {}
