import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { EquipmentDetail } from './equipment-detail';

describe('Fiche de matériel de démonstration', () => {
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

  function returnUrl(): string {
    return content().querySelector('a')!.getAttribute('href')!;
  }

  it.each(['agent', 'responsable'])(
    'ouvre directement une fiche dans %s avec le même composant et les données existantes',
    async (space) => {
      await harness.navigateByUrl(`/${space}/equipements/EQ-OUT-0003`, EquipmentDetail);
      expect(content().querySelector('h1')?.textContent).toBe('Débroussailleuse n°3');
      expect(Array.from(content().querySelectorAll('dd'), (field) => field.textContent)).toEqual([
        'EQ-OUT-0003',
        'Atelier municipal',
      ]);
      expect(content().textContent).toContain('Données de démonstration');
      expect(returnUrl()).toBe(`/${space}/equipements`);
      expect(content().querySelector('a')?.textContent).toBe('Retour au matériel');
      const declaration = content().querySelector<HTMLAnchorElement>('.declaration-link')!;
      expect(declaration.textContent?.trim()).toBe('Déclarer un incident');
      expect(declaration.getAttribute('href')).toBe(`/${space}/incidents/nouveau/EQ-OUT-0003`);
      expect(content().textContent).not.toMatch(/Synchronisé|Disponible/);
    },
  );

  it.each(['agent', 'responsable'])(
    'explique un identifiant inconnu dans %s et permet le retour avec q',
    async (space) => {
      await harness.navigateByUrl(`/${space}/equipements/inconnu?q=Souffleur`, EquipmentDetail);
      expect(content().querySelector('h1')?.textContent).toBe('Équipement introuvable');
      expect(content().querySelector('dl')).toBeNull();
      expect(content().querySelector('.declaration-link')).toBeNull();
      expect(content().textContent).toContain('Données de démonstration');
      expect(returnUrl()).toBe(`/${space}/equipements?q=Souffleur`);
    },
  );

  it.each(['agent', 'responsable'])(
    'actualise la fiche réutilisée quand id change dans %s, y compris après un inconnu',
    async (space) => {
      const first = await harness.navigateByUrl(
        `/${space}/equipements/EQ-OUT-0003`,
        EquipmentDetail,
      );
      const second = await harness.navigateByUrl(
        `/${space}/equipements/EQ-VEH-0042`,
        EquipmentDetail,
      );
      expect(second).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe('Fourgon de voirie');
      expect(content().textContent).toContain('Garage municipal');
      expect(content().textContent).not.toContain('Débroussailleuse');
      expect(content().textContent).not.toContain('Atelier municipal');

      const unknown = await harness.navigateByUrl(`/${space}/equipements/inconnu`, EquipmentDetail);
      expect(unknown).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe('Équipement introuvable');
      expect(content().textContent).not.toContain('Fourgon');

      const last = await harness.navigateByUrl(
        `/${space}/equipements/EQ-OUT-0001`,
        EquipmentDetail,
      );
      expect(last).toBe(first);
      expect(content().querySelector('h1')?.textContent).toBe('Tondeuse autoportée');
      expect(content().textContent).not.toContain('Équipement introuvable');
    },
  );

  it.each(['agent', 'responsable'])(
    'conserve q pour le retour et suit ses modifications sur la même fiche dans %s',
    async (space) => {
      const component = await harness.navigateByUrl(
        `/${space}/equipements/EQ-OUT-0001?q=%20%20tONDeUSE%20%20`,
        EquipmentDetail,
      );
      const router = TestBed.inject(Router);
      expect(router.parseUrl(returnUrl()).queryParams['q']).toBe('  tONDeUSE  ');
      expect(
        router.parseUrl(content().querySelector('.declaration-link')!.getAttribute('href')!)
          .queryParams['q'],
      ).toBe('  tONDeUSE  ');
      expect(
        await harness.navigateByUrl(`/${space}/equipements/EQ-OUT-0001?q=EQ-OUT`, EquipmentDetail),
      ).toBe(component);
      expect(router.parseUrl(returnUrl()).queryParams['q']).toBe('EQ-OUT');
    },
  );
});
