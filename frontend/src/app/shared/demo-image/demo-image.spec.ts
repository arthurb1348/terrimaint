import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DemoImage } from './demo-image';

describe('Illustration locale', () => {
  it('réserve le ratio et choisit la vignette sans changer le texte alternatif', async () => {
    const fixture = TestBed.createComponent(DemoImage);
    fixture.componentRef.setInput('source', { src: '/grand.webp', thumbnail: '/petit.webp', alt: 'Tondeuse fictive' });
    fixture.componentRef.setInput('thumbnail', true);
    await fixture.whenStable();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('/petit.webp');
    expect(img.getAttribute('alt')).toBe('Tondeuse fictive');
    expect(img.getAttribute('width')).toBe('900');
    expect(img.getAttribute('height')).toBe('675');
  });
  it('remplace une image cassée et retrouve une nouvelle association sans ancien visuel', async () => {
    const fixture = TestBed.createComponent(DemoImage);
    fixture.componentRef.setInput('source', { src: '/ancien.webp', alt: 'Ancien matériel' });
    await fixture.whenStable();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Image indisponible — Ancien matériel');
    fixture.componentRef.setInput('source', { src: '/nouveau.webp', alt: 'Nouveau matériel' });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('/nouveau.webp');
    expect(fixture.nativeElement.textContent).not.toContain('Ancien matériel');
  });
  it('prévoit une association absente', async () => {
    const fixture = TestBed.createComponent(DemoImage);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Illustration non disponible');
  });
});
