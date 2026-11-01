import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agent',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="feature-page" aria-labelledby="agent-title">
      <h1 id="agent-title">Accueil</h1>
      <ul class="page-shortcuts">
        <li><a class="page-action secondary" routerLink="/agent/equipements">Matériel</a></li>
        <li><a class="page-action secondary" routerLink="/agent/incidents">Incidents</a></li>
        <li class="scanner-shortcut">
          <a class="page-action" routerLink="/agent/scanner">Scanner un QR code</a>
        </li>
      </ul>
    </section>
  `,
  styleUrl: './agent.css',
})
export class Agent {}
