import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { describe, expect, it } from 'vitest';
import { routes } from '../../app.routes';
import { IncidentDeclaration } from './incident-declaration';
import { IncidentPhotos } from './incident-photos';

describe('Association des photos au parcours', () => {
  it('conserve q, efface au changement de matériel puis au départ', async () => {
    await TestBed.configureTestingModule({ providers: [provideRouter(routes)] }).compileComponents();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/agent/incidents/nouveau/EQ-OUT-0001', IncidentDeclaration);
    const component = harness.routeDebugElement!.componentInstance;
    const media = (component as { media: IncidentPhotos }).media;
    media.photos.set([{ id: 1, name: 'photo.png', src: 'blob:test', alt: 'Photo sélectionnée' }]);
    await harness.navigateByUrl('/agent/incidents/nouveau/EQ-OUT-0001?q=tondeuse', IncidentDeclaration);
    expect(media.photos()).toHaveLength(1);
    await harness.navigateByUrl('/agent/incidents/nouveau/EQ-OUT-0002', IncidentDeclaration);
    expect(harness.routeDebugElement!.componentInstance).toBe(component);
    expect(media.photos()).toHaveLength(0);
    media.photos.set([{ id: 2, name: 'autre.png', src: 'blob:autre', alt: 'Autre photo' }]);
    await harness.navigateByUrl('/agent/equipements');
    expect(media.photos()).toHaveLength(0);
    harness.fixture.destroy();
  });
});
