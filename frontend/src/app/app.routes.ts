import { Routes } from '@angular/router';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'TerriMaint — Du terrain à la décision' },
  // L'accueil reste immédiat ; chaque rubrique est téléchargée à sa première visite.
  {
    path: 'agent',
    loadComponent: () => import('./features/agent/agent').then((m) => m.Agent),
    title: 'Espace Agent — TerriMaint',
  },
  {
    path: 'responsable',
    loadComponent: () => import('./features/responsable/responsable').then((m) => m.Responsable),
    title: 'Espace Responsable — TerriMaint',
  },
  {
    path: 'equipements',
    loadComponent: () => import('./features/equipements/equipements').then((m) => m.Equipements),
    title: 'Équipements — TerriMaint',
  },
  {
    path: 'incidents',
    loadComponent: () => import('./features/incidents/incidents').then((m) => m.Incidents),
    title: 'Incidents — TerriMaint',
  },
  {
    path: 'interventions',
    loadComponent: () =>
      import('./features/interventions/interventions').then((m) => m.Interventions),
    title: 'Interventions — TerriMaint',
  },
  // La route générique reste en dernier afin de ne pas masquer les routes connues.
  { path: '**', redirectTo: '' },
];
