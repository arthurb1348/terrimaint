import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IncidentPhotos } from './incident-photos';

describe('Photos en mémoire du parcours', () => {
  let count = 0;
  beforeEach(() => {
    count = 0;
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => `blob:test-${++count}`), revokeObjectURL: vi.fn() });
  });
  afterEach(() => vi.unstubAllGlobals());
  const file = (name = 'photo.png', type = 'image/png', size = 12) => {
    const bytes = new Uint8Array(size);
    bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
    return new File([bytes], name, { type });
  };

  it('garde les fichiers acceptés et les autres valides d’une sélection mixte', async () => {
    const photos = new IncidentPhotos(async (url) => { if (url === 'blob:test-2') throw new Error(); });
    await photos.add([file('a.png')]);
    await photos.add([file('texte.txt', 'text/plain'), file('casse.png'), file('b.png')]);
    expect(photos.photos().map((p) => p.name)).toEqual(['a.png', 'b.png']);
    expect(photos.errors()).toHaveLength(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-2');
  });
  it('borne à trois photos et refuse strictement plus de 5 Mio', async () => {
    const decode = vi.fn(async () => {});
    const photos = new IncidentPhotos(decode);
    await photos.add([file('grand.png', 'image/png', 5 * 1024 * 1024 + 1)]);
    expect(decode).not.toHaveBeenCalled();
    await photos.add([file('limite.png', 'image/png', 5 * 1024 * 1024), file(), file(), file()]);
    expect(photos.photos()).toHaveLength(3);
    expect(photos.errors()[0]).toContain('3 photos maximum');
  });
  it('sérialise les sélections pour ne pas dépasser la capacité', async () => {
    const photos = new IncidentPhotos(async () => {});
    await Promise.all([photos.add([file(), file()]), photos.add([file(), file()])]);
    expect(photos.photos()).toHaveLength(3);
    expect(photos.busy()).toBe(false);
  });
  it('ne restaure pas une photo supprimée quand une autre termine son décodage', async () => {
    let finish!: () => void;
    let calls = 0;
    const photos = new IncidentPhotos(async () => {
      if (++calls === 2) await new Promise<void>((resolve) => { finish = resolve; });
    });
    await photos.add([file('premiere.png')]);
    const id = photos.photos()[0].id;
    const task = photos.add([file('seconde.png')]);
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    photos.remove(id);
    finish();
    await task;
    expect(photos.photos().map((photo) => photo.name)).toEqual(['seconde.png']);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    photos.clear();
  });
  it('permet au nouveau contexte de choisir avant la fin d’un ancien décodage', async () => {
    let finish!: () => void;
    let calls = 0;
    const photos = new IncidentPhotos(async () => {
      if (++calls === 1) await new Promise<void>((resolve) => { finish = resolve; });
    });
    const previous = photos.add([file('ancien.png')]);
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    photos.clear();
    await photos.add([file('nouveau.png')]);
    finish();
    await previous;
    expect(photos.photos().map((photo) => photo.name)).toEqual(['nouveau.png']);
    expect(photos.errors()).toEqual([]);
    expect(photos.busy()).toBe(false);
    photos.clear();
  });
  it('ignore les résultats tardifs et libère immédiatement les URL en attente au changement de contexte', async () => {
    let finish!: () => void;
    const photos = new IncidentPhotos(() => new Promise<void>((resolve) => { finish = resolve; }));
    const operation = photos.add([file('ancien.png')]);
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    photos.clear();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    finish();
    await operation;
    expect(photos.photos()).toEqual([]);
    expect(photos.errors()).toEqual([]);
    expect(photos.busy()).toBe(false);
  });
  it('refuse un contenu dont la signature ne correspond pas au type annoncé', async () => {
    const decode = vi.fn(async () => {});
    const photos = new IncidentPhotos(decode);
    await photos.add([new File(['GIF89a'], 'faux.png', { type: 'image/png' })]);
    expect(decode).not.toHaveBeenCalled();
    expect(photos.photos()).toHaveLength(0);
    expect(photos.errors()[0]).toContain('format annoncé');
  });
  it('révoque toutes les URL acceptées à la destruction et ne les révoque pas deux fois', async () => {
    const photos = new IncidentPhotos(async () => {});
    await photos.add([file(), file()]);
    photos.remove(photos.photos()[0].id);
    photos.clear();
    photos.clear();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
