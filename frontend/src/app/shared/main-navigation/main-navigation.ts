import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-main-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './main-navigation.html',
  styleUrl: './main-navigation.css',
})
export class MainNavigation {
  private readonly document = inject(DOCUMENT);
  readonly space = input.required<'agent' | 'responsable'>();
  readonly landing = input(false);
  protected readonly expanded = signal(false);
  protected closeNavigation(): void {
    // Sur mobile, le lien va être masqué : placer le focus sur le contenu évite de le perdre.
    if (this.expanded()) this.document.getElementById('main-content')?.focus();
    this.expanded.set(false);
  }
  protected readonly destinations = computed(() =>
    this.space() === 'agent'
      ? [
          { path: this.landing() ? '/' : '/agent', label: 'Accueil', icon: 'building' },
          { path: '/agent/equipements', label: 'Matériel', icon: 'equipment' },
          { path: '/agent/scanner', label: 'Scanner', icon: 'scan' },
          { path: '/agent/incidents', label: 'Incidents', icon: 'incident' },
          { path: '/agent/profil', label: 'Profil', icon: 'profile' },
        ]
      : [
          { path: '/responsable', label: 'Tableau de bord', icon: 'building' },
          { path: '/responsable/incidents', label: 'Incidents', icon: 'warning' },
          { path: '/responsable/interventions', label: 'Interventions', icon: 'intervention' },
          { path: '/responsable/equipements', label: 'Matériel', icon: 'truck' },
          { path: '/responsable/agents', label: 'Agents', icon: 'agents' },
        ],
  );
}
