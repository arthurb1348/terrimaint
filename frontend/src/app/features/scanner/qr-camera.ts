import { inject, Injectable } from '@angular/core';
import { QrDecoder } from './qr-decoder';

export function cameraErrorMessage(error: unknown): string {
  const name = error instanceof Error || error instanceof DOMException ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Accès à la caméra refusé. Vous pouvez saisir la référence ou autoriser la caméra dans les réglages du navigateur puis reprendre.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Aucune caméra disponible. Saisissez la référence du matériel.';
    case 'NotReadableError':
    case 'AbortError':
      return 'Caméra indisponible ou occupée. Fermez les autres applications qui l’utilisent puis reprenez, ou saisissez la référence.';
    default:
      return 'La lecture a été interrompue par une erreur technique. Reprenez la caméra ou saisissez la référence.';
  }
}

@Injectable()
export class QrCamera {
  private readonly decoder = inject(QrDecoder);
  private generation = 0;
  private stream?: MediaStream;
  private video?: HTMLVideoElement;
  private canvas?: HTMLCanvasElement;
  private timer?: ReturnType<typeof setTimeout>;
  private ended?: () => void;
  private abort?: AbortController;

  stop(): void {
    // Invalider aussi les promesses : getUserMedia ne peut pas être annulé par AbortSignal.
    this.generation++;
    this.abort?.abort();
    this.abort = undefined;
    clearTimeout(this.timer);
    this.timer = undefined;
    for (const track of this.stream?.getTracks() ?? []) {
      if (this.ended) track.removeEventListener('ended', this.ended);
      track.stop();
    }
    this.stream = undefined;
    this.ended = undefined;
    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
    }
    this.video = undefined;
    if (this.canvas) this.canvas.width = this.canvas.height = 0;
    this.canvas = undefined;
  }

  async start(
    video: HTMLVideoElement,
    onReady: () => void,
    onValue: (value: string) => void,
    onError: (message: string) => void,
  ): Promise<void> {
    this.stop();
    const generation = this.generation;
    const abort = new AbortController();
    this.abort = abort;
    const current = () => generation === this.generation;
    const fail = (message: string) => {
      if (!current()) return;
      this.stop();
      onError(message);
    };
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      fail(
        'Caméra non accessible dans ce contexte. Utilisez HTTPS et un navigateur compatible, ou saisissez la référence.',
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      if (!current()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      this.video = video;
      this.ended = () =>
        fail('La caméra a été déconnectée. Reprenez la caméra ou saisissez la référence.');
      stream.getVideoTracks().forEach((track) => track.addEventListener('ended', this.ended!));
      this.canvas = document.createElement('canvas');
      video.srcObject = stream;
      await video.play();
      if (!current()) return;
      onReady();
      const read = async () => {
        if (!current()) return;
        try {
          if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
            const canvas = this.canvas!;
            const scale = Math.min(1, 640 / video.videoWidth, 640 / video.videoHeight);
            canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
            canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) throw new Error('Canvas unavailable');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const value = await this.decoder.decode(
              context.getImageData(0, 0, canvas.width, canvas.height),
              abort.signal,
            );
            if (!current()) return;
            if (value !== null) {
              this.stop();
              onValue(value);
              return;
            }
          }
          // Une seule lecture en vol ; limiter les pixels et la fréquence sur téléphone.
          if (current()) this.timer = setTimeout(() => void read(), 200);
        } catch (error) {
          fail(cameraErrorMessage(error));
        }
      };
      void read();
    } catch (error) {
      fail(cameraErrorMessage(error));
    }
  }
}
