/** Vérifie les pages rendues, la navigation et le contrat HTTP conservé. */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { routes } from './app.routes';

describe('Shell et routage', () => {
  let fixture: ComponentFixture<App>;
  let http: HttpTestingController;
  let router: Router;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    element = fixture.nativeElement as HTMLElement;
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    fixture.destroy();
  });

  async function navigate(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it.each(['/', '/inconnue', '/agent/inconnue'])('affiche l’accueil depuis %s', async (url) => {
    await navigate(url);
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await fixture.whenStable();
    expect(element.querySelector('h1')?.textContent).toContain('Du terrain');
    expect(element.textContent).toContain('API disponible');
    expect(router.url).toBe('/');
    expect(element.querySelectorAll('main')).toHaveLength(1);
    expect(element.querySelector('a[href="#main-content"]')).not.toBeNull();
    expect(element.querySelector('main')?.id).toBe('main-content');
    expect(element.querySelector('nav a[aria-current="page"]')?.textContent).toContain('Accueil');
  });

  it.each([
    ['/agent', 'Espace Agent'],
    ['/responsable', 'Espace Responsable'],
    ['/equipements', 'Équipements'],
    ['/incidents', 'Incidents'],
    ['/interventions', 'Interventions'],
  ])('ouvre directement %s avec son titre et son lien actif', async (url, heading) => {
    await navigate(url);
    expect(element.querySelector('main h1')?.textContent).toBe(heading);
    expect(TestBed.inject(Title).getTitle()).toBe(`${heading} — TerriMaint`);
    const current = element.querySelectorAll('nav a[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute('href')).toBe(url);
    http.expectNone('/api/v1/health');
  });

  it('permet au responsable de rejoindre l’espace Agent puis les rubriques communes', async () => {
    await navigate('/responsable');
    const links = element.querySelectorAll<HTMLAnchorElement>('main a');
    expect(Array.from(links, (link) => link.getAttribute('href'))).toEqual([
      '/equipements',
      '/incidents',
      '/interventions',
      '/agent',
    ]);
    element.querySelector<HTMLAnchorElement>('main a[href="/agent"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/agent');
    expect(element.querySelector('h1')?.textContent).toBe('Espace Agent');
    element.querySelector<HTMLAnchorElement>('main a[href="/incidents"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/incidents');
    expect(element.querySelector('h1')?.textContent).toBe('Incidents');
    element.querySelector<HTMLAnchorElement>('nav a[href="/"]')?.click();
    await fixture.whenStable();
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await fixture.whenStable();
    expect(element.textContent).toContain('API disponible');
  });

  it('annule le GET en quittant l’accueil et le relance au retour', async () => {
    await navigate('/');
    const request = http.expectOne('/api/v1/health');
    await navigate('/agent');
    expect(request.cancelled).toBe(true);
    await navigate('/');
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await fixture.whenStable();
    expect(element.textContent).toContain('API disponible');
  });
});
