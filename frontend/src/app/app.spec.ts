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
    expect(element.textContent).not.toContain('Synchronisé');
    expect(router.url).toBe('/');
    expect(element.querySelectorAll('main')).toHaveLength(1);
    expect(element.querySelector('a[href="#main-content"]')).not.toBeNull();
    expect(element.querySelector('main')?.id).toBe('main-content');
    expect(element.querySelector('nav a[aria-current="page"]')?.textContent).toContain('Accueil');
  });

  it.each([
    ['/agent', 'Accueil', 'Accueil Agent'],
    ['/responsable', 'Tableau de bord', 'Tableau de bord'],
    ['/agent/equipements', 'Matériel', 'Matériel'],
    ['/responsable/equipements', 'Matériel', 'Matériel'],
    ['/agent/incidents', 'Incidents', 'Incidents'],
    ['/responsable/incidents', 'Incidents', 'Incidents'],
    ['/responsable/interventions', 'Interventions', 'Interventions'],
    ['/agent/scanner', 'Scanner', 'Scanner'],
    ['/agent/profil', 'Profil', 'Profil'],
    ['/responsable/agents', 'Agents', 'Agents'],
  ])('ouvre directement %s avec son titre et son lien actif', async (url, heading, title) => {
    await navigate(url);
    expect(element.querySelector('main h1')?.textContent).toBe(heading);
    expect(TestBed.inject(Title).getTitle()).toBe(`${title} — TerriMaint`);
    const current = element.querySelectorAll('nav a[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute('href')).toBe(url);
    http.expectNone('/api/v1/health');
  });

  it('permet au responsable de rejoindre l’espace Agent puis les rubriques communes', async () => {
    await navigate('/responsable');
    const links = element.querySelectorAll<HTMLAnchorElement>('main a');
    expect(Array.from(links, (link) => link.getAttribute('href'))).toEqual([
      '/responsable/equipements',
      '/responsable/incidents',
      '/responsable/interventions',
      '/agent',
    ]);
    element.querySelector<HTMLAnchorElement>('main a[href="/agent"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/agent');
    expect(element.querySelector('h1')?.textContent).toBe('Accueil');
    element.querySelector<HTMLAnchorElement>('main a[href="/agent/incidents"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/agent/incidents');
    expect(element.querySelector('h1')?.textContent).toBe('Incidents');
    element.querySelector<HTMLAnchorElement>('.space-links a[href="/"]')?.click();
    await fixture.whenStable();
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await fixture.whenStable();
    expect(element.textContent).toContain('API disponible');
    expect(element.textContent).not.toContain('Synchronisé');
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
    expect(element.textContent).not.toContain('Synchronisé');
  });
  it.each([
    ['/equipements', '/agent/equipements'],
    ['/incidents', '/agent/incidents'],
    ['/interventions', '/responsable/interventions'],
  ])('conserve les anciennes URL : %s', async (oldUrl, target) => {
    await navigate(oldUrl);
    expect(router.url).toBe(target);
    expect(element.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(target);
  });

  it('conserve la navigation Responsable sur les domaines partagés', async () => {
    await navigate('/responsable/incidents');
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Navigation Responsable');
    element.querySelector<HTMLAnchorElement>('nav a[href="/responsable/equipements"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/responsable/equipements');
    expect(element.querySelector('.screen-title')?.textContent).toBe('Matériel');
    expect(element.querySelectorAll('nav a[aria-current="page"]')).toHaveLength(1);
  });

  it('annonce et referme le menu Responsable après navigation', async () => {
    await navigate('/responsable');
    const toggle = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe(element.querySelector('nav')?.id);
    toggle.click();
    fixture.detectChanges();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    element.querySelector<HTMLAnchorElement>('nav a[href="/responsable/incidents"]')?.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(router.url).toBe('/responsable/incidents');
  });

  it('change d’espace sans afficher d’identité ou de synchronisation fictive', async () => {
    await navigate('/agent');
    element.querySelector<HTMLAnchorElement>('.space-links a[href="/responsable"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/responsable');
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Navigation Responsable');
    expect(element.textContent).not.toMatch(/Synchronisé|Sophie Martin|Ville de Montfaucon/);
    http.expectNone('/api/v1/health');
  });
});
