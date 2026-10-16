import { Component } from '@angular/core';

@Component({
  selector: 'app-incidents',
  standalone: true,
  template: `
    <section class="feature-page" aria-labelledby="incidents-title">
      <h1 id="incidents-title">Incidents</h1>
      <p>La déclaration et le suivi des incidents seront développés dans une prochaine étape.</p>
      <p>Cette rubrique ne propose pas encore de fonctionnalité métier.</p>
    </section>
  `,
})
export class Incidents {}
