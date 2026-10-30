import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { Incidents } from './incidents';
import { DEMO_INCIDENTS } from './incidents-demo';

describe('Liste locale des signalements', () => {
  let harness: RouterTestingHarness;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
    harness = await RouterTestingHarness.create();
    document.body.appendChild(harness.fixture.nativeElement);
  });
  afterEach(() => {
    harness.fixture.nativeElement.remove();
    harness.fixture.destroy();
  });
  function content(): HTMLElement {
    return harness.routeNativeElement!;
  }
  function rows(): HTMLTableRowElement[] {
    return Array.from(content().querySelectorAll('tbody tr'));
  }
  async function change(id: string, value: string): Promise<void> {
    const control = content().querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
    control.value = value;
    control.dispatchEvent(new Event(control.tagName === 'INPUT' ? 'input' : 'change'));
    await harness.fixture.whenStable();
  }

  it('conserve six références uniques reliées au matériel et les trois priorités/statuts', () => {
    expect(DEMO_INCIDENTS).toHaveLength(6);
    expect(new Set(DEMO_INCIDENTS.map((item) => item.id)).size).toBe(6);
    for (const item of DEMO_INCIDENTS) {
      expect(DEMO_EQUIPMENT.some((equipment) => equipment.id === item.equipmentId)).toBe(true);
    }
    expect(new Set(DEMO_INCIDENTS.map((item) => item.priority))).toEqual(
      new Set(['low', 'high', 'urgent']),
    );
    expect(new Set(DEMO_INCIDENTS.map((item) => item.status))).toEqual(
      new Set(['open', 'in-progress', 'closed']),
    );
    expect(DEMO_INCIDENTS.some((item) => !item.description?.trim())).toBe(true);
  });

  it.each(['agent', 'responsable'])(
    'affiche la même liste complète dans %s avec de vrais liens et dates fixes',
    async (space) => {
      await harness.navigateByUrl(`/${space}/incidents`, Incidents);
      expect(rows()).toHaveLength(6);
      expect(content().textContent).toContain('Données de démonstration');
      expect(content().querySelector('[role="status"]')?.textContent?.trim()).toBe(
        '6 signalements trouvés.',
      );
      expect(rows()[0].querySelector('a')?.getAttribute('href')).toBe(
        `/${space}/incidents/INC-2026-045`,
      );
      expect(rows()[0].textContent).toContain('Débroussailleuse n°3');
      expect(rows()[0].textContent).toContain('Faible');
      expect(rows()[0].textContent).toContain('Ouvert');
      expect(rows()[0].querySelector('time')?.getAttribute('datetime')).toBe('2026-10-28');
      expect(rows()[0].querySelector('time')?.textContent).toBe('28/10/2026');
      expect(content().textContent).not.toMatch(/Disponible|Immobilisé|Maintenance|Synchronisé/);
    },
  );

  it.each([
    ['  mOTEUR  ', 'INC-2026-045'],
    ['inc-2026-048', 'INC-2026-048'],
    ['  tONDEUSE  ', 'INC-2026-048'],
    ['  eq-veh-0042  ', 'INC-2026-046'],
  ])('recherche %j dans intitulé/référence/nom/id matériel', async (query, id) => {
    await harness.navigateByUrl(`/agent/incidents?${new URLSearchParams({ q: query })}`, Incidents);
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain(id);
    expect(content().querySelector<HTMLInputElement>('input')!.value).toBe(query);
  });

  it.each(['', '   '])('retrouve tous les signalements pour une recherche %j', async (query) => {
    await harness.navigateByUrl(`/agent/incidents?${new URLSearchParams({ q: query })}`, Incidents);
    expect(rows()).toHaveLength(6);
  });

  it.each(['agent', 'responsable'])(
    'initialise aussi les menus depuis une URL filtrée dans %s et suit les nouveaux paramètres',
    async (space) => {
      const first = await harness.navigateByUrl(
        `/${space}/incidents?q=OUT&priority=high&status=in-progress`,
        Incidents,
      );
      expect(content().querySelector<HTMLSelectElement>('#incident-priority-filter')!.value).toBe(
        'high',
      );
      expect(content().querySelector<HTMLSelectElement>('#incident-status-filter')!.value).toBe(
        'in-progress',
      );
      expect(rows()).toHaveLength(1);
      expect(rows()[0].textContent).toContain('INC-2026-048');
      expect(
        await harness.navigateByUrl(
          `/${space}/incidents?q=OUT&priority=urgent&status=closed`,
          Incidents,
        ),
      ).toBe(first);
      expect(content().querySelector<HTMLSelectElement>('#incident-priority-filter')!.value).toBe(
        'urgent',
      );
      expect(content().querySelector<HTMLSelectElement>('#incident-status-filter')!.value).toBe(
        'closed',
      );
      expect(rows()[0].textContent).toContain('INC-2026-050');
    },
  );

  it.each(['agent', 'responsable'])(
    'combine recherche/priorité/statut dans %s, annonce le vide et réinitialise au clavier',
    async (space) => {
      const source = JSON.stringify(DEMO_INCIDENTS);
      await harness.navigateByUrl(`/${space}/incidents`, Incidents);
      await change('incident-search', '  EQ-OUT  ');
      await change('incident-priority-filter', 'high');
      await change('incident-status-filter', 'in-progress');
      expect(rows()).toHaveLength(1);
      expect(rows()[0].textContent).toContain('INC-2026-048');
      const router = TestBed.inject(Router);
      expect(router.parseUrl(router.url).queryParams).toEqual({
        q: '  EQ-OUT  ',
        priority: 'high',
        status: 'in-progress',
      });
      const link = rows()[0].querySelector('a')!;
      expect(router.parseUrl(link.getAttribute('href')!).queryParams).toEqual(
        router.parseUrl(router.url).queryParams,
      );
      await change('incident-status-filter', 'closed');
      expect(rows()).toHaveLength(0);
      expect(content().textContent).toContain('Aucun signalement ne correspond');
      expect(content().querySelector('[role="status"]')?.textContent?.trim()).toBe(
        '0 signalement trouvé.',
      );
      content().querySelector('button')!.click();
      await harness.fixture.whenStable();
      expect(rows()).toHaveLength(6);
      expect(router.url).toBe(`/${space}/incidents`);
      expect(document.activeElement).toBe(content().querySelector('input'));
      expect(JSON.stringify(DEMO_INCIDENTS)).toBe(source);
    },
  );

  it.each(['inconnu', 'toString', '__proto__'])(
    'traite le filtre inconnu %s comme Toutes/Tous sans perdre q',
    async (value) => {
      await harness.navigateByUrl(
        `/responsable/incidents?${new URLSearchParams({ q: 'moteur', priority: value, status: value })}`,
        Incidents,
      );
      expect(rows()).toHaveLength(1);
      for (const select of content().querySelectorAll('select')) expect(select.value).toBe('');
      await change('incident-priority-filter', 'low');
      expect(TestBed.inject(Router).parseUrl(TestBed.inject(Router).url).queryParams).toEqual({
        q: 'moteur',
        priority: 'low',
      });
    },
  );
});
