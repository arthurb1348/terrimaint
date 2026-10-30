import { Component } from '@angular/core';

@Component({
  selector: 'app-interventions',
  standalone: true,
  template: `
    <section class="feature-page" aria-labelledby="interventions-title">
      <h1 id="interventions-title">Interventions</h1>
      <p>La liste et le détail des interventions seront développés dans un prochain incrément.</p>
      <p>
        La programmation de démonstration est accessible depuis un signalement ouvert ou en cours de
        l’espace Responsable.
      </p>
    </section>
  `,
})
export class Interventions {}
