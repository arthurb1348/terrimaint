import { describe, expect, it } from 'vitest';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { resolveEquipmentReference } from './equipment-reference';

describe('Référence du matériel', () => {
  it.each(DEMO_EQUIPMENT)('retrouve $id dans la source unique', (equipment) => {
    expect(resolveEquipmentReference(equipment.id)).toEqual({ equipment });
    expect(
      'equipment' in resolveEquipmentReference(equipment.id) &&
        (resolveEquipmentReference(equipment.id) as { equipment: unknown }).equipment,
    ).toBe(equipment);
  });
  it.each(['  eq-out-0001  ', '\nEQ-out-0001\t'])(
    'ignore espaces de bord et casse : %s',
    (value) => {
      expect(resolveEquipmentReference(value)).toEqual({ equipment: DEMO_EQUIPMENT[0] });
    },
  );
  it('distingue référence inconnue et invalide', () => {
    expect(resolveEquipmentReference('EQ-OUT-9999')).toEqual({
      error: expect.stringContaining('inconnue'),
    });
  });
  it.each([
    '',
    '  ',
    'OUT-0001',
    'EQ-OUT-1',
    'EQ-OUT-0001x',
    'EQ OUT 0001',
    'EQ-OUT-0001\nEQ-OUT-0002',
    'https://example.org/EQ-OUT-0001',
    'javascript:alert(1)',
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '../EQ-OUT-0001',
    'ＥＱ-OUT-0001',
  ])('refuse entièrement %s', (value) => {
    expect(resolveEquipmentReference(value)).toEqual({
      error: expect.stringContaining('invalide'),
    });
  });
});
