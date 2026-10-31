import { Component, computed, input, signal } from '@angular/core';

export interface DemoImageSource {
  readonly src: string;
  readonly alt: string;
  readonly thumbnail?: string;
}

@Component({
  selector: 'app-demo-image',
  template: `
    @if (source(); as media) {
      @if (failedSource() !== url()) {
        <img [src]="url()" [alt]="media.alt" width="900" height="675"
          [attr.loading]="eager() ? 'eager' : 'lazy'" decoding="async" (error)="failedSource.set(url())" />
      } @else {
        <p>Image indisponible — {{ media.alt }}</p>
      }
    } @else {
      <p>Illustration non disponible</p>
    }
  `,
  styles: `
    :host { display: block; min-width: 0; aspect-ratio: 4 / 3; background: var(--card-surface); border-radius: 8px; overflow: hidden; }
    img { display: block; width: 100%; height: 100%; aspect-ratio: 4 / 3; object-fit: contain; }
    p { margin: 0; padding: 12px; color: var(--muted); overflow-wrap: anywhere; }
  `,
})
export class DemoImage {
  readonly source = input<DemoImageSource>();
  readonly thumbnail = input(false);
  readonly eager = input(false);
  protected readonly failedSource = signal('');
  protected readonly url = computed(() =>
    (this.thumbnail() ? this.source()?.thumbnail : undefined) ?? this.source()?.src ?? '',
  );
}
