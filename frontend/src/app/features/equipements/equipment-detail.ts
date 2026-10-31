import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DemoImage } from '../../shared/demo-image/demo-image';
import { DEMO_EQUIPMENT } from './equipements-demo';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [RouterLink, DemoImage],
  templateUrl: './equipment-detail.html',
  styleUrl: './equipment-detail.css',
})
export class EquipmentDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  // Angular peut réutiliser la fiche : écouter id évite de conserver l'ancien équipement.
  protected readonly equipment = computed(() =>
    DEMO_EQUIPMENT.find((equipment) => equipment.id === this.params().get('id')),
  );
  protected readonly search = computed(() => this.queryParams().get('q') ?? '');

  constructor() {
    // Le lien suivi disparaît : le clavier reprend au contenu, puis au lien de retour.
    afterNextRender(() => this.focusContent());
  }

  protected focusContent(): void {
    // Ce repère du shell reste présent quand le routeur remplace la fiche par la liste.
    this.document.getElementById('main-content')?.focus();
  }
}
