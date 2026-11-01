import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IncidentPhotos } from './incident-photos';
import { PreparedPhoto } from './photo-preparation';

// Ici la préparation est doublée : ces tests prouvent l'état du parcours et les
// ressources, pas le codec. Les vraies images sont couvertes dans Playwright.
describe('Photos en mémoire du parcours', () => {
  let count = 0;
  const prepared = (): PreparedPhoto => ({
    blob: new Blob(['préparée'], { type: 'image/jpeg' }),
    width: 100,
    height: 75,
  });
  const file = (name = 'photo.png') => new File(['original'], name, { type: 'image/png' });
  beforeEach(() => {
    count = 0;
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => `blob:test-${++count}`),
      revokeObjectURL: vi.fn(),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('garde les fichiers acceptés et les autres valides d’une sélection mixte', async () => {
    const prepare = vi.fn(async (f: File) => {
      if (f.name === 'casse.png' || f.name === 'texte.txt')
        throw new Error('image impossible à décoder');
      return prepared();
    });
    const photos = new IncidentPhotos(prepare);
    await photos.add([file('a.png')]);
    await photos.add([file('texte.txt'), file('casse.png'), file('b.png')]);
    expect(photos.photos().map((p) => p.name)).toEqual(['a.png', 'b.png']);
    expect(photos.errors()).toHaveLength(2);
    expect(URL.createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image/jpeg' }),
    );
    photos.clear();
  });
  it('borne à trois photos ; la préparation décide des limites de fichiers', async () => {
    const prepare = vi.fn(async () => prepared());
    const photos = new IncidentPhotos(prepare);
    await photos.add([file(), file(), file(), file()]);
    expect(photos.photos()).toHaveLength(3);
    expect(prepare).toHaveBeenCalledTimes(3);
    expect(photos.errors()[0]).toContain('3 photos maximum');
    photos.clear();
  });
  it('sérialise les sélections rapprochées pour ne pas dépasser la capacité', async () => {
    const photos = new IncidentPhotos(async () => prepared());
    await Promise.all([photos.add([file(), file()]), photos.add([file(), file()])]);
    expect(photos.photos()).toHaveLength(3);
    expect(photos.busy()).toBe(false);
    photos.clear();
  });
  it('ne restaure pas une photo supprimée quand une autre termine sa préparation', async () => {
    let finish!: () => void;
    let calls = 0;
    const photos = new IncidentPhotos(async () => {
      if (++calls === 2)
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
      return prepared();
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
  it('accepte le nouveau contexte mais attend le nettoyage du décodage ancien', async () => {
    let finish!: () => void;
    const prepare = vi.fn(async () => {
      if (prepare.mock.calls.length === 1)
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
      return prepared();
    });
    const photos = new IncidentPhotos(prepare);
    const previous = photos.add([file('ancien.png'), file('ancien-en-attente.png')]);
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    photos.clear();
    const next = photos.add([file('nouveau.png')]);
    expect(photos.busy()).toBe(true);
    expect(prepare).toHaveBeenCalledTimes(1);
    finish();
    await Promise.all([previous, next]);
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(photos.photos().map((photo) => photo.name)).toEqual(['nouveau.png']);
    expect(photos.errors()).toEqual([]);
    expect(photos.busy()).toBe(false);
    photos.clear();
  });
  it('ignore résultats et erreurs tardifs après annulation/destruction', async () => {
    let fail!: (reason: Error) => void;
    const photos = new IncidentPhotos(
      () =>
        new Promise<PreparedPhoto>((_, reject) => {
          fail = reject;
        }),
    );
    const operation = photos.add([file('ancien.png')]);
    await vi.waitFor(() => expect(fail).toBeTypeOf('function'));
    photos.clear();
    fail(new Error('erreur tardive'));
    await operation;
    expect(photos.photos()).toEqual([]);
    expect(photos.errors()).toEqual([]);
    expect(photos.busy()).toBe(false);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('une sélection annulée ne change ni photos, ni erreurs, ni attente', async () => {
    const photos = new IncidentPhotos(async () => prepared());
    await photos.add([file()]);
    photos.errors.set(['message précédent']);
    await photos.add([]);
    expect(photos.photos()).toHaveLength(1);
    expect(photos.errors()).toEqual(['message précédent']);
    expect(photos.busy()).toBe(false);
    photos.clear();
  });
  it('révoque toutes les URL acceptées à la destruction sans double révocation', async () => {
    const photos = new IncidentPhotos(async () => prepared());
    await photos.add([file(), file()]);
    photos.remove(photos.photos()[0].id);
    photos.clear();
    photos.clear();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
