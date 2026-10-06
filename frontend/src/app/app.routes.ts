/** Associe l'URL racine à l'accueil ; une URL inconnue retourne vers cet accueil. */
import { Routes } from '@angular/router';
import { Home } from './home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'TerriMaint — Du terrain à la décision' },
  // La route générique reste en dernier afin de ne pas masquer les routes connues.
  { path: '**', redirectTo: '' },
];
