import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-upcoming-page',
  standalone: true,
  template: `
    <section class="feature-page" aria-labelledby="upcoming-title">
      <h1 id="upcoming-title">{{ data['label'] }}</h1>
      <p>Cette rubrique n’est pas encore disponible.</p>
    </section>
  `,
})
export class UpcomingPage {
  protected readonly data = inject(ActivatedRoute).snapshot.data;
}
