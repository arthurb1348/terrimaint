/** Vérifie le texte réellement affiché selon le résultat HTTP, sans serveur externe. */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Home } from './home';

describe('Accueil et santé de l’API', () => {
  let fixture: ComponentFixture<Home>;
  let http: HttpTestingController;

  // Crée une page et remplace le réseau par un serveur fictif ; aucun résultat retourné.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      // L'ordre des fournisseurs remplace le backend HTTP réel par celui des tests.
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Home);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  // Vérifie qu'aucune requête n'est oubliée et libère le composant après chaque cas.
  afterEach(() => {
    http.verify();
    fixture.destroy();
  });

  /** Sans paramètre, retourne le texte de la région annoncée aux lecteurs d'écran. */
  function statusText(): string {
    return (
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent ?? ''
    );
  }

  /** Sans paramètre ni résultat, attend la mise à jour Angular après une réponse. */
  async function renderResponse(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('affiche l’attente et désactive la relance pendant le GET', () => {
    expect(statusText()).toContain('Vérification en cours');
    expect((fixture.nativeElement as HTMLElement).querySelector('button')?.disabled).toBe(true);
    const request = http.expectOne('/api/v1/health');
    expect(request.request.method).toBe('GET');
    request.flush({ status: 'ok' });
  });
  it('affiche disponible quand le JSON respecte le contrat', async () => {
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await renderResponse();
    expect(statusText()).toContain('API disponible');
    expect((fixture.nativeElement as HTMLElement).querySelector('button')?.disabled).toBe(false);
  });
  it('affiche indisponible après une erreur HTTP', async () => {
    http
      .expectOne('/api/v1/health')
      .flush('Service arrêté', { status: 503, statusText: 'Unavailable' });
    await renderResponse();
    expect(statusText()).toContain('API indisponible');
  });
  it('affiche indisponible après une erreur réseau', async () => {
    http.expectOne('/api/v1/health').error(new ProgressEvent('error'));
    await renderResponse();
    expect(statusText()).toContain('API indisponible');
  });
  // HTTP 200 seul ne suffit pas : on contrôle aussi le contrat JSON réellement reçu.
  it.each([null, { status: 'down' }, {}, 'ok'])(
    'refuse une réponse inattendue : %j',
    async (response) => {
      http.expectOne('/api/v1/health').flush(response);
      await renderResponse();
      expect(statusText()).toContain('API indisponible');
    },
  );
  it('retrouve l’état disponible après un clic de relance', async () => {
    http.expectOne('/api/v1/health').error(new ProgressEvent('error'));
    await renderResponse();
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    fixture.detectChanges();
    expect(statusText()).toContain('Vérification en cours');
    http.expectOne('/api/v1/health').flush({ status: 'ok' });
    await renderResponse();
    expect(statusText()).toContain('API disponible');
  });
  it('annule la requête quand la page est détruite', () => {
    const request = http.expectOne('/api/v1/health');
    fixture.destroy();
    expect(request.cancelled).toBe(true);
  });
});
