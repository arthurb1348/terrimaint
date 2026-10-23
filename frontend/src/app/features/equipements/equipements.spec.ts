import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Equipements } from './equipements';

describe('Liste de matériel de démonstration', () => {
  let fixture: ComponentFixture<Equipements>;
  let element: HTMLElement;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Equipements] }).compileComponents();
    fixture = TestBed.createComponent(Equipements);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    input = element.querySelector('input') as HTMLInputElement;
  });

  afterEach(() => fixture.destroy());

  function items(): HTMLLIElement[] {
    return Array.from(element.querySelectorAll('li'));
  }

  async function search(value: string): Promise<void> {
    // Passer par l'événement utilisateur vérifie aussi le lien entre HTML et signal.
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('affiche six équipements identifiés, leurs emplacements et la mention de démonstration', () => {
    expect(element.querySelector('h1')?.textContent).toBe('Matériel');
    expect(element.textContent).toContain('Données de démonstration');
    expect(element.querySelector('label')?.htmlFor).toBe(input.id);
    expect(items()).toHaveLength(6);
    expect(items().map((item) => item.querySelector('.equipment-id')?.textContent)).toEqual([
      'EQ-OUT-0001',
      'EQ-OUT-0002',
      'EQ-OUT-0003',
      'EQ-VEH-0042',
      'EQ-BAT-0011',
      'EQ-OUT-0004',
    ]);
    for (const item of items()) {
      expect(item.querySelector('h2')?.textContent?.trim()).toBeTruthy();
      expect(item.textContent).toMatch(/Emplacement : \S/);
    }
    expect(items()[2].textContent).toContain('Atelier municipal');
  });

  it.each([
    ['Tondeuse', 'Tondeuse autoportée'],
    ['EQ-VEH-0042', 'Fourgon de voirie'],
    ['  tONDeUSE  ', 'Tondeuse autoportée'],
    ['  eq-veh-0042  ', 'Fourgon de voirie'],
  ])('recherche %s par nom ou identifiant sans distinction de casse', async (query, name) => {
    await search(query);
    expect(items()).toHaveLength(1);
    expect(items()[0].querySelector('h2')?.textContent).toBe(name);
  });

  it.each(['', '   ', '\t  '])(
    'affiche toute la liste pour une recherche vide : %j',
    async (query) => {
      await search('Tondeuse');
      await search(query);
      expect(items()).toHaveLength(6);
    },
  );

  it('explique une absence de résultat et conserve la mention de démonstration', async () => {
    await search('introuvable');
    expect(items()).toHaveLength(0);
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Aucun équipement ne correspond à votre recherche',
    );
    expect(element.textContent).toContain('Données de démonstration');
  });

  it('ne recherche pas dans l’emplacement', async () => {
    await search('Atelier municipal');
    expect(items()).toHaveLength(0);
  });

  it.each(['Tondeuse', 'introuvable'])(
    'efface %s et restitue la liste avec le focus au champ',
    async (query) => {
      await search(query);
      element.querySelector('button')?.click();
      await fixture.whenStable();
      expect(input.value).toBe('');
      expect(items()).toHaveLength(6);
      expect(element.querySelector('[role="status"]')?.textContent).toContain('6 équipement(s)');
      expect(document.activeElement).toBe(input);
    },
  );
});
