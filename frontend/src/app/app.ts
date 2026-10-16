import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MainNavigation } from './shared/main-navigation/main-navigation';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainNavigation, RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
