export interface DemoAgent {
  readonly id: string;
  readonly name: string;
}

// Choix fictifs, sans compte utilisateur ni promesse de disponibilité.
export const DEMO_AGENTS: readonly DemoAgent[] = [
  { id: 'AG-DEMO-001', name: 'Camille Durand' },
  { id: 'AG-DEMO-002', name: 'Alex Martin' },
  { id: 'AG-DEMO-003', name: 'Samira Bernard' },
];
