import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-upcoming-page',
  standalone: true,
  template: `
    <section class="feature-page" aria-labelledby="upcoming-title">
      <p class="eyebrow">À venir</p>
      <h1 id="upcoming-title">{{ data['label'] }}</h1>
      <p>{{ data['description'] }}</p>
      <p>Cette rubrique ne propose pas encore de fonctionnalité métier.</p>
    </section>
  `,
})
export class UpcomingPage {
  protected readonly data = inject(ActivatedRoute).snapshot.data;
}
