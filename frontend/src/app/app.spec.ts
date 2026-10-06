/** Vérifie l'intégration entre le composant racine, les routes et l'accueil. */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';

describe('Routage de l’accueil', () => {
  // L'URL est le paramètre du cas testé ; aucune valeur n'est retournée par le test.
  it.each(['/', '/inconnue'])('affiche l’accueil depuis %s', async (url) => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Du terrain',
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('API disponible');
    expect(TestBed.inject(Router).url).toBe('/');
    http.verify();
    fixture.destroy();
  });
});
