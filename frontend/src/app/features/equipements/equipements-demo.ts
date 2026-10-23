import { Equipment } from './equipment';

// Source locale provisoire, isolée pour le futur raccordement à l'API métier.
export const DEMO_EQUIPMENT: readonly Equipment[] = [
  { id: 'EQ-OUT-0001', name: 'Tondeuse autoportée', location: 'Centre technique municipal' },
  { id: 'EQ-OUT-0002', name: 'Souffleur à feuilles', location: 'Remise du parc des Tilleuls' },
  { id: 'EQ-OUT-0003', name: 'Débroussailleuse n°3', location: 'Atelier municipal' },
  { id: 'EQ-VEH-0042', name: 'Fourgon de voirie', location: 'Garage municipal' },
  { id: 'EQ-BAT-0011', name: 'Chaudière du groupe scolaire', location: 'École des Marronniers' },
  { id: 'EQ-OUT-0004', name: 'Nettoyeur haute pression', location: 'Local technique du gymnase' },
];
