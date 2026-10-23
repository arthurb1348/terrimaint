import { Component, computed, signal } from '@angular/core';
import { DEMO_EQUIPMENT } from './equipements-demo';

@Component({
  selector: 'app-equipements',
  standalone: true,
  templateUrl: './equipements.html',
  styleUrl: './equipements.css',
})
export class Equipements {
  protected readonly search = signal('');

  // La saisie ne modifie jamais la source : effacer restitue tous les équipements.
  protected readonly filteredEquipment = computed(() => {
    const query = this.search().trim().toLowerCase();
    return DEMO_EQUIPMENT.filter(
      (equipment) =>
        equipment.name.toLowerCase().includes(query) || equipment.id.toLowerCase().includes(query),
    );
  });
}
