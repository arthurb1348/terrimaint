import { Component } from '@angular/core';

@Component({
  selector: 'app-interventions',
  standalone: true,
  template: `
    <section class="feature-page" aria-labelledby="interventions-title">
      <h1 id="interventions-title">Interventions</h1>
      <p>
        La consultation et la planification des interventions seront développées dans une prochaine
        étape.
      </p>
      <p>Cette rubrique ne propose pas encore de fonctionnalité métier.</p>
    </section>
  `,
})
export class Interventions {}
