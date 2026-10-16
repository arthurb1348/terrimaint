import { Component } from '@angular/core';

@Component({
  selector: 'app-equipements',
  standalone: true,
  template: `
    <section class="feature-page" aria-labelledby="equipements-title">
      <h1 id="equipements-title">Matériel</h1>
      <p>
        Les fiches équipements et leur accès par QR code seront développés dans une prochaine étape.
      </p>
      <p>Cette rubrique ne propose pas encore de fonctionnalité métier.</p>
    </section>
  `,
})
export class Equipements {}
