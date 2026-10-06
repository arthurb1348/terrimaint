/** Vérifie qu'une API silencieuse ne bloque pas indéfiniment la vérification. */
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiAvailability, ApiHealth } from './api-health';

describe('Délai de santé', () => {
  // Rétablit les vraies horloges même en cas d'échec d'une assertion.
  afterEach(() => vi.useRealTimers());
  it('émet indisponible et annule le GET après cinq secondes sans réponse', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    let result: ApiAvailability | undefined;
    // L'abonné reçoit le résultat observable du service ; le temps est simulé.
    TestBed.inject(ApiHealth)
      .check()
      .subscribe((availability) => {
        result = availability;
      });
    const request = http.expectOne('/api/v1/health');
    vi.advanceTimersByTime(4999);
    expect(result).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(result).toBe('unavailable');
    expect(request.cancelled).toBe(true);
    http.verify();
  });
});
