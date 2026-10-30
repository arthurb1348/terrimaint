import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { IncidentDetail } from './incident-detail';
import { Incidents } from './incidents';

describe('Détail local du signalement', () => {
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
  });
  afterEach(() => harness.fixture.destroy());
  function content(): HTMLElement {
    return harness.routeNativeElement!;
  }

  for (const space of ['agent', 'responsable']) {
    const base = `/${space}/incidents`;
    it(`ouvre directement le bon détail dans ${space} et lie le matériel sans lui transmettre les filtres`, async () => {
      await harness.navigateByUrl(
        `${base}/INC-2026-045?q=moteur&priority=low&status=open`,
        IncidentDetail,
      );
      expect(content().querySelector('h1')?.textContent).toBe('Moteur qui cale à l’accélération');
      expect(content().textContent).toContain('Données de démonstration');
      expect(content().textContent).toContain('INC-2026-045');
      expect(content().querySelector('.description')?.textContent).toBe(
        'Le moteur cale lors de l’accélération et devient difficile à redémarrer.',
      );
      expect(content().querySelector('time')?.textContent).toBe('28/10/2026');
      expect(content().querySelector('.metadata')?.textContent).toContain('Faible');
      expect(content().querySelector('.metadata')?.textContent).toContain('Ouvert');
      expect(content().querySelector('.equipment-summary')?.textContent).toContain(
        'Débroussailleuse n°3',
      );
      expect(content().querySelector('.equipment-summary')?.textContent).toContain(
        'Atelier municipal',
      );
      expect(content().querySelector('.equipment-summary a')?.getAttribute('href')).toBe(
        `/${space}/equipements/EQ-OUT-0003`,
      );
      expect(content().querySelector('.risk-note')).toBeNull();
      expect(content().textContent).not.toMatch(
        /Disponible|Synchronisé|Récurrence|Créer une intervention/,
      );
    });

    it(`conserve q/priorité/statut au retour à la liste de ${space} après un accès direct`, async () => {
      const query = '  tONDEUSE  ';
      const params = { q: query, priority: 'high', status: 'in-progress' };
      await harness.navigateByUrl(
        `${base}/INC-2026-048?${new URLSearchParams(params)}`,
        IncidentDetail,
      );
      expect(content().querySelector('.description')?.textContent).toBe('Non renseignée');
      content().querySelector<HTMLAnchorElement>('.back-link')!.click();
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).queryParams).toEqual(
        params,
      );
      expect(content().querySelector<HTMLInputElement>('input')!.value).toBe(query);
      expect(content().querySelector<HTMLSelectElement>('#incident-priority-filter')!.value).toBe(
        'high',
      );
      expect(content().querySelector<HTMLSelectElement>('#incident-status-filter')!.value).toBe(
        'in-progress',
      );
      expect(content().querySelectorAll('tbody tr')).toHaveLength(1);
      expect(content().querySelector('tbody')?.textContent).toContain('INC-2026-048');
    });

    it(`actualise id dans une même instance de ${space}, y compris description absente et identifiant inconnu`, async () => {
      const first = await harness.navigateByUrl(`${base}/INC-2026-045`, IncidentDetail);
      expect(await harness.navigateByUrl(`${base}/INC-2026-046`, IncidentDetail)).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe(
        'Bruit au freinage du fourgon de voirie',
      );
      expect(content().textContent).not.toContain('Débroussailleuse');
      expect(content().querySelector('.risk-note')?.textContent).toContain(
        'ne change pas le statut du matériel',
      );
      expect(
        await harness.navigateByUrl(
          `${base}/absent?q=OUT&priority=urgent&status=closed`,
          IncidentDetail,
        ),
      ).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe('Signalement introuvable');
      expect(content().querySelector('dl')).toBeNull();
      expect(content().querySelector('.equipment-summary')).toBeNull();
      expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(
        `${base}?q=OUT&priority=urgent&status=closed`,
      );
      expect(await harness.navigateByUrl(`${base}/INC-2026-048`, IncidentDetail)).toBe(first);
      expect(content().querySelector('.description')?.textContent).toBe('Non renseignée');
      expect(content().querySelector('.risk-note')).toBeNull();
      expect(content().textContent).not.toContain('Bruit au freinage');
    });
  }

  it('actualise les paramètres de retour sur le même détail et retire les filtres inconnus', async () => {
    const first = await harness.navigateByUrl('/agent/incidents/INC-2026-045', IncidentDetail);
    expect(
      await harness.navigateByUrl(
        '/agent/incidents/INC-2026-045?q=OUT&priority=incorrect&status=incorrect',
        IncidentDetail,
      ),
    ).toBe(first);
    expect(content().querySelector('.back-link')?.getAttribute('href')).toBe(
      '/agent/incidents?q=OUT',
    );
  });

  it('relit la même source au retour par lien depuis une liste filtrée', async () => {
    await harness.navigateByUrl('/responsable/incidents?priority=urgent&status=open', Incidents);
    content().querySelector<HTMLAnchorElement>('tbody a')!.click();
    await harness.fixture.whenStable();
    expect(content().querySelector('h1')?.textContent).toBe(
      'Bruit au freinage du fourgon de voirie',
    );
    content().querySelector<HTMLAnchorElement>('.back-link')!.click();
    await harness.fixture.whenStable();
    expect(content().querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it.each(['INC-2026-045', 'INC-2026-047'])(
    'propose la programmation au Responsable pour %s et conserve les filtres',
    async (id) => {
      await harness.navigateByUrl(
        `/responsable/incidents/${id}?q=%20OUT%20&priority=high&status=in-progress`,
        IncidentDetail,
      );
      expect(content().querySelector('.planning-link')?.getAttribute('href')).toBe(
        `/responsable/interventions/nouvelle/${id}?q=%20OUT%20&priority=high&status=in-progress`,
      );
      expect(content().querySelector('.planning-note')).toBeNull();
    },
  );

  it('explique le blocage d’un signalement clôturé au Responsable sans action factice', async () => {
    await harness.navigateByUrl('/responsable/incidents/INC-2026-049', IncidentDetail);
    expect(content().querySelector('.planning-link')).toBeNull();
    expect(content().querySelector('.planning-note')?.textContent).toContain('clôturé');
    expect(content().querySelector('button[disabled]')).toBeNull();
  });

  it.each(['INC-2026-045', 'INC-2026-047', 'INC-2026-049'])(
    'préserve la consultation Agent sans programmation pour %s',
    async (id) => {
      await harness.navigateByUrl(`/agent/incidents/${id}`, IncidentDetail);
      expect(content().querySelector('.planning-link')).toBeNull();
      expect(content().querySelector('.planning-note')).toBeNull();
    },
  );
});
