// Bornes locales du parcours ; elles ne remplacent pas une future validation serveur.
export const PHOTO_LIMITS = {
  maxInputBytes: 24 * 1024 * 1024,
  maxInputPixels: 24_000_000,
  maxInputSide: 8192,
  maxHeaderBytes: 256 * 1024,
  maxOutputBytes: 1.5 * 1024 * 1024,
  maxOutputSide: 1920,
  fallbackOutputSide: 1600,
  qualities: [0.86, 0.78, 0.7],
} as const;

interface ImageHeader {
  width: number;
  height: number;
  type: string;
}
export interface PreparedPhoto {
  blob: Blob;
  width: number;
  height: number;
}

function readBytes(blob: Blob, signal: AbortSignal): Promise<Uint8Array> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => reader.abort();
    signal.addEventListener('abort', abort, { once: true });
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(new Error('lecture impossible'));
    reader.onabort = () => reject(new DOMException('Préparation annulée', 'AbortError'));
    reader.onloadend = () => signal.removeEventListener('abort', abort);
    reader.readAsArrayBuffer(blob);
  });
}

// Lire au plus 256 Kio avant tout décodage évite d'allouer des pixels sur la seule
// foi de l'extension/MIME. Un en-tête trop éloigné est refusé, jamais deviné.
export async function inspectPhoto(blob: Blob, signal: AbortSignal): Promise<ImageHeader> {
  const bytes = await readBytes(blob.slice(0, PHOTO_LIMITS.maxHeaderBytes), signal);
  const view = new DataView(bytes.buffer);
  const starts = (...values: number[]) => values.every((value, i) => bytes[i] === value);
  const word = (offset: number, value: string) =>
    [...value].every((char, i) => bytes[offset + i] === char.charCodeAt(0));
  const invalid = () =>
    new Error('image impossible à décoder dans le format annoncé (en-tête invalide ou trop long)');
  try {
    if (
      blob.type === 'image/png' &&
      starts(137, 80, 78, 71, 13, 10, 26, 10) &&
      view.getUint32(8) === 13 &&
      word(12, 'IHDR')
    ) {
      return { width: view.getUint32(16), height: view.getUint32(20), type: blob.type };
    }
    if (blob.type === 'image/jpeg' && starts(255, 216, 255)) {
      let offset = 2;
      while (offset + 4 <= bytes.length) {
        if (bytes[offset++] !== 255) throw invalid();
        while (bytes[offset] === 255) offset++;
        const marker = bytes[offset++];
        if (marker === 0xda || marker === 0xd9) break;
        const size = view.getUint16(offset);
        if (size < 2 || offset + size > bytes.length) throw invalid();
        if ([0xc0, 0xc1, 0xc2].includes(marker)) {
          if (size < 8) throw invalid();
          return {
            width: view.getUint16(offset + 5),
            height: view.getUint16(offset + 3),
            type: blob.type,
          };
        }
        offset += size;
      }
    }
    if (blob.type === 'image/webp' && word(0, 'RIFF') && word(8, 'WEBP')) {
      let canvas: { width: number; height: number } | undefined;
      const uint24 = (offset: number) =>
        bytes[offset] + bytes[offset + 1] * 256 + bytes[offset + 2] * 65536;
      for (let offset = 12; offset + 8 <= bytes.length;) {
        const size = view.getUint32(offset + 4, true),
          data = offset + 8;
        if (word(offset, 'VP8X')) {
          if (size < 10 || data + 10 > bytes.length || bytes[data] & 2) throw invalid();
          canvas = { width: uint24(data + 4) + 1, height: uint24(data + 7) + 1 };
        }
        let dimensions: { width: number; height: number } | undefined;
        if (word(offset, 'VP8 ') && size >= 10 && word(data + 3, '\u009d\u0001\u002a')) {
          dimensions = {
            width: view.getUint16(data + 6, true) & 0x3fff,
            height: view.getUint16(data + 8, true) & 0x3fff,
          };
        }
        if (word(offset, 'VP8L') && size >= 5 && bytes[data] === 0x2f) {
          const bits = view.getUint32(data + 1, true);
          dimensions = { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
        }
        if (dimensions) {
          if (canvas && (canvas.width !== dimensions.width || canvas.height !== dimensions.height))
            throw invalid();
          return { ...dimensions, type: blob.type };
        }
        offset = data + size + (size % 2);
      }
    }
  } catch {
    throw invalid();
  }
  throw invalid();
}

function checkInputDimensions({ width, height }: ImageHeader): void {
  if (
    !width ||
    !height ||
    width > PHOTO_LIMITS.maxInputSide ||
    height > PHOTO_LIMITS.maxInputSide ||
    width * height > PHOTO_LIMITS.maxInputPixels
  ) {
    throw new Error('image trop grande (24 mégapixels et 8 192 px par dimension maximum)');
  }
}

export async function preparePhoto(file: File, signal: AbortSignal): Promise<PreparedPhoto> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('format refusé (JPEG, PNG ou WebP)');
  if (!file.size || file.size > PHOTO_LIMITS.maxInputBytes)
    throw new Error('fichier vide ou dépassant 24 Mio');
  const header = await inspectPhoto(file, signal);
  checkInputDimensions(header);
  signal.throwIfAborted();
  let bitmap: ImageBitmap;
  try {
    // Le navigateur applique EXIF, y compris les orientations avec miroir. Aucune
    // rotation manuelle supplémentaire : cela tournerait deux fois certaines photos.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('image impossible à décoder sur ce navigateur');
  }
  const canvas = document.createElement('canvas');
  try {
    signal.throwIfAborted();
    const { width, height } = bitmap;
    checkInputDimensions({ width, height, type: file.type });
    if (!(
      (width === header.width && height === header.height) ||
      (width === header.height && height === header.width)
    ))
      throw new Error('dimensions décodées incohérentes');
    const scale = Math.min(1, PHOTO_LIMITS.maxOutputSide / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('préparation indisponible sur ce navigateur');
    // JPEG ne conserve pas l'alpha : fond blanc explicite plutôt qu'un fond noir.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  } catch (error) {
    canvas.width = canvas.height = 0;
    throw error;
  } finally {
    bitmap.close();
  }
  try {
    for (const side of [PHOTO_LIMITS.maxOutputSide, PHOTO_LIMITS.fallbackOutputSide]) {
      signal.throwIfAborted();
      if (Math.max(canvas.width, canvas.height) > side) {
        const scale = side / Math.max(canvas.width, canvas.height);
        // Une petite copie seulement après fermeture du bitmap d'entrée ; jamais
        // deux originaux décodés. Le canvas temporaire est aussitôt libéré.
        const smaller = document.createElement('canvas');
        try {
          smaller.width = Math.max(1, Math.round(canvas.width * scale));
          smaller.height = Math.max(1, Math.round(canvas.height * scale));
          const context = smaller.getContext('2d');
          if (!context) throw new Error('préparation indisponible');
          context.drawImage(canvas, 0, 0, smaller.width, smaller.height);
          canvas.width = smaller.width;
          canvas.height = smaller.height;
          const target = canvas.getContext('2d');
          if (!target) throw new Error('préparation indisponible');
          target.drawImage(smaller, 0, 0);
        } finally {
          smaller.width = smaller.height = 0;
        }
      } else if (side === PHOTO_LIMITS.fallbackOutputSide) break;
      for (const quality of PHOTO_LIMITS.qualities) {
        signal.throwIfAborted();
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error('réencodage impossible'))),
            'image/jpeg',
            quality,
          );
        });
        signal.throwIfAborted();
        if (blob.type !== 'image/jpeg' || !blob.size) throw new Error('format de sortie incorrect');
        if (blob.size > PHOTO_LIMITS.maxOutputBytes) continue;
        const output = await inspectPhoto(blob, signal);
        if (output.width !== canvas.width || output.height !== canvas.height)
          throw new Error('dimensions de sortie incorrectes');
        let decoded: ImageBitmap;
        try {
          decoded = await createImageBitmap(blob, { imageOrientation: 'from-image' });
        } catch {
          throw new Error('photo réencodée impossible à décoder');
        }
        try {
          signal.throwIfAborted();
          if (decoded.width !== canvas.width || decoded.height !== canvas.height)
            throw new Error('sortie illisible');
        } finally {
          decoded.close();
        }
        return { blob, width: canvas.width, height: canvas.height };
      }
    }
    throw new Error(
      'impossible de préparer une photo de moins de 1,5 Mio ; choisissez une autre image',
    );
  } finally {
    canvas.width = canvas.height = 0;
  }
}
