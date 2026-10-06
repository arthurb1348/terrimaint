/** Point d'entrée visuel : le routeur affiche la page correspondant à l'URL. */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Composant racine sans paramètre ni état métier ; délègue l'affichage au routeur. */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
})
export class App {}
