import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { Equipment } from '../equipements/equipment';

export type ReferenceResult = { equipment: Equipment } | { error: string };

export function resolveEquipmentReference(value: string): ReferenceResult {
  const reference = value.trim().toUpperCase();
  if (!/^EQ-[A-Z]{3}-[0-9]{4}$/.test(reference)) {
    return {
      error: 'Référence invalide. Saisissez une référence complète, par exemple EQ-OUT-0001.',
    };
  }
  const equipment = DEMO_EQUIPMENT.find((item) => item.id === reference);
  return equipment
    ? { equipment }
    : {
        error:
          'Référence inconnue dans le matériel de démonstration. Vérifiez le code puis réessayez.',
      };
}
