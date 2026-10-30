import { FormControl } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { localToday, plannedDateValidator } from './planning-date';

describe('Date calendaire de programmation', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 30, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('utilise le jour local plutôt que le jour UTC', () => {
    const local = new Date(2026, 9, 31, 0, 15);
    vi.setSystemTime(local);
    expect(localToday()).toBe('2026-10-31');
  });

  it.each([
    ['', 'required'],
    ['2026-10-29', 'pastDate'],
    ['2026-02-30', 'calendarDate'],
    ['2027-02-29', 'calendarDate'],
    ['2100-02-29', 'calendarDate'],
    ['2026-13-01', 'calendarDate'],
    ['2026-00-01', 'calendarDate'],
    ['2026-10-00', 'calendarDate'],
    ['0000-10-30', 'calendarDate'],
    ['2026-1-1', 'calendarDate'],
    ['2026-10-30T12:00:00Z', 'calendarDate'],
    ['invalide', 'calendarDate'],
  ])('refuse %j avec une erreur %s, indépendamment du contrôle HTML', (value, error) => {
    expect(plannedDateValidator(new FormControl(value))).toEqual({ [error]: true });
  });

  it.each(['2026-10-30', '2026-10-31', '2028-02-29', '2400-02-29'])(
    'accepte la date valide présente ou future %s',
    (value) => expect(plannedDateValidator(new FormControl(value))).toBeNull(),
  );
});
