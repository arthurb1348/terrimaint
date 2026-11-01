import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inspectPhoto, PHOTO_LIMITS, preparePhoto } from './photo-preparation';

// En-têtes minimaux et codecs doublés : validations avant/après décodage, erreurs
// et nettoyage. Aucune affirmation de qualité visuelle issue de ces doublures.
const png = (width = 4000, height = 3000, size = 32) => {
  const bytes = new Uint8Array(size),
    view = new DataView(bytes.buffer);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return new File([bytes], 'photo.png', { type: 'image/png' });
};
const jpeg = (width: number, height: number, size = 16) => {
  const bytes = new Uint8Array(size),
    view = new DataView(bytes.buffer);
  bytes.set([255, 216, 255, 192, 0, 8, 8]);
  view.setUint16(7, height);
  view.setUint16(9, width);
  return new Blob([bytes], { type: 'image/jpeg' });
};
const signal = () => new AbortController().signal;

describe('Préparation locale bornée (API navigateur doublées)', () => {
  let canvases: HTMLCanvasElement[];
  let close: ReturnType<typeof vi.fn>;
  let decode: ReturnType<typeof vi.fn>;
  let encode: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    canvases = [];
    close = vi.fn();
    decode = vi.fn(async (blob: Blob) => {
      const dimensions =
        blob.type === 'image/png'
          ? { width: 4000, height: 3000 }
          : await inspectPhoto(blob, signal());
      return { ...dimensions, close };
    });
    vi.stubGlobal('createImageBitmap', decode);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      canvases.push(this);
      return {
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;
    });
    encode = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
    ) {
      callback(jpeg(this.width, this.height));
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('accepte plus de 5 Mio dans les bornes et produit un JPEG contrôlé', async () => {
    const result = await preparePhoto(png(4000, 3000, 6 * 1024 * 1024), signal());
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1440);
    expect(result.blob.type).toBe('image/jpeg');
    expect(result.blob.size).toBeLessThanOrEqual(PHOTO_LIMITS.maxOutputBytes);
    expect(decode).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(2);
    expect(canvases.at(-1)!.width).toBe(0);
  });
  it('refuse octets, dimensions et pixels avant tout décodage', async () => {
    for (const file of [
      png(1, 1, PHOTO_LIMITS.maxInputBytes + 1),
      png(8193, 1),
      png(6001, 4000),
      png(0, 4),
    ]) {
      await expect(preparePhoto(file, signal())).rejects.toThrow(/24 Mio|trop grande/);
    }
    expect(decode).not.toHaveBeenCalled();
    await expect(
      preparePhoto(png(6000, 4000, PHOTO_LIMITS.maxInputBytes), signal()),
    ).rejects.toThrow('incohérentes');
    expect(decode).toHaveBeenCalledTimes(1);
  });
  it('refuse signature/MIME incohérents, en-tête tronqué et lecture refusée', async () => {
    for (const f of [
      new File(['GIF89a'], 'faux.png', { type: 'image/png' }),
      new File(['x'], 'x.svg', { type: 'image/svg+xml' }),
      new File([], 'vide.png', { type: 'image/png' }),
    ]) {
      await expect(preparePhoto(f, signal())).rejects.toThrow();
    }
    const read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer').mockImplementation(function (
      this: FileReader,
    ) {
      this.dispatchEvent(new Event('error'));
    });
    await expect(preparePhoto(png(), signal())).rejects.toThrow('lecture impossible');
    read.mockRestore();
    expect(decode).not.toHaveBeenCalled();
  });
  it('refuse le décodage même si l’en-tête est plausible', async () => {
    decode.mockRejectedValueOnce(new Error('codec'));
    await expect(preparePhoto(png(), signal())).rejects.toThrow('impossible à décoder');
    expect(encode).not.toHaveBeenCalled();
  });
  it('ne fait aucun agrandissement et garde le ratio orienté', async () => {
    decode.mockResolvedValueOnce({ width: 75, height: 100, close });
    const result = await preparePhoto(png(100, 75), signal());
    expect([result.width, result.height]).toEqual([75, 100]);
  });
  it('mesure le poids à chaque essai et refuse une sortie toujours trop lourde', async () => {
    encode.mockImplementation((callback: BlobCallback) =>
      callback(jpeg(1920, 1440, PHOTO_LIMITS.maxOutputBytes + 1)),
    );
    await expect(preparePhoto(png(), signal())).rejects.toThrow('moins de 1,5 Mio');
    expect(encode).toHaveBeenCalledTimes(6);
    expect(canvases.at(-1)!.width).toBe(0);
  });
  it('essaie une qualité suivante si nécessaire, avec un poids réellement borné', async () => {
    encode.mockImplementationOnce((callback: BlobCallback) =>
      callback(jpeg(1920, 1440, PHOTO_LIMITS.maxOutputBytes + 1)),
    );
    const result = await preparePhoto(png(), signal());
    expect(encode).toHaveBeenCalledTimes(2);
    expect(result.blob.size).toBeLessThanOrEqual(PHOTO_LIMITS.maxOutputBytes);
  });
  it('refuse réencodage nul, mauvais format, dimensions erronées et sortie indécodable', async () => {
    encode.mockImplementationOnce((callback: BlobCallback) => callback(null));
    await expect(preparePhoto(png(), signal())).rejects.toThrow('réencodage impossible');
    encode.mockImplementationOnce((callback: BlobCallback) => callback(png()));
    await expect(preparePhoto(png(), signal())).rejects.toThrow('format de sortie');
    encode.mockImplementationOnce((callback: BlobCallback) => callback(jpeg(20, 15)));
    await expect(preparePhoto(png(), signal())).rejects.toThrow('dimensions de sortie');
    decode
      .mockResolvedValueOnce({ width: 4000, height: 3000, close })
      .mockRejectedValueOnce(new Error('sortie indécodable'));
    await expect(preparePhoto(png(), signal())).rejects.toThrow(
      'photo réencodée impossible à décoder',
    );
    expect(canvases.at(-1)!.width).toBe(0);
  });
  it('ferme le bitmap accordé après annulation et ne lance pas de réencodage', async () => {
    const controller = new AbortController();
    decode.mockImplementationOnce(async () => {
      controller.abort();
      return { width: 4000, height: 3000, close };
    });
    await expect(preparePhoto(png(), controller.signal)).rejects.toThrow();
    expect(close).toHaveBeenCalledOnce();
    expect(encode).not.toHaveBeenCalled();
  });
  it('ignore le réencodage terminé après annulation et libère son canvas', async () => {
    const controller = new AbortController();
    let finish!: BlobCallback;
    encode.mockImplementationOnce((callback: BlobCallback) => {
      finish = callback;
    });
    const task = preparePhoto(png(), controller.signal);
    const rejected = expect(task).rejects.toThrow();
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    controller.abort();
    finish(jpeg(1920, 1440));
    await rejected;
    expect(close).toHaveBeenCalledOnce();
    expect(decode).toHaveBeenCalledTimes(1);
    expect(canvases.at(-1)!.width).toBe(0);
  });
  it('ferme aussi le bitmap de sortie si son décodage arrive après annulation', async () => {
    const controller = new AbortController();
    decode
      .mockResolvedValueOnce({ width: 4000, height: 3000, close })
      .mockImplementationOnce(async () => {
        controller.abort();
        return { width: 1920, height: 1440, close };
      });
    await expect(preparePhoto(png(), controller.signal)).rejects.toThrow();
    expect(close).toHaveBeenCalledTimes(2);
    expect(canvases.at(-1)!.width).toBe(0);
  });
  it('refuse un en-tête JPEG trop éloigné sans lire le fichier entier', async () => {
    const bytes = new Uint8Array(PHOTO_LIMITS.maxHeaderBytes + 64);
    bytes.set([255, 216]);
    for (let offset = 2; offset + 4 < bytes.length; offset += 65537)
      bytes.set([255, 225, 255, 255], offset);
    const read = vi.spyOn(FileReader.prototype, 'readAsArrayBuffer');
    await expect(
      preparePhoto(new File([bytes], 'long.jpg', { type: 'image/jpeg' }), signal()),
    ).rejects.toThrow('en-tête invalide ou trop long');
    expect(read.mock.calls[0][0].size).toBe(PHOTO_LIMITS.maxHeaderBytes);
    expect(decode).not.toHaveBeenCalled();
  });
});
