import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class QrDecoder {
  async decode(frame: ImageData, signal: AbortSignal): Promise<string | null> {
    // Le décodeur ne se télécharge qu'au premier scan, sans dépendre de BarcodeDetector.
    const { default: jsQR } = await import('jsqr');
    // Un import terminé après arrêt ne doit pas commencer à analyser une ancienne image.
    if (signal.aborted) return null;
    return jsQR(frame.data, frame.width, frame.height)?.data ?? null;
  }
}
