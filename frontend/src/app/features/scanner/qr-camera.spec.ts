import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QrCamera } from './qr-camera';
import { QrDecoder } from './qr-decoder';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

describe('Cycle de vie caméra (flux et décodeur simulés)', () => {
  let camera: QrCamera;
  let video: HTMLVideoElement;
  let track: EventTarget & { stop: ReturnType<typeof vi.fn> };
  let stream: MediaStream;
  const media = vi.fn(),
    decode = vi.fn(),
    ready = vi.fn(),
    value = vi.fn(),
    error = vi.fn();
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: media } });
    track = Object.assign(new EventTarget(), { stop: vi.fn() });
    stream = { getTracks: () => [track], getVideoTracks: () => [track] } as unknown as MediaStream;
    media.mockResolvedValue(stream);
    decode.mockResolvedValue(null);
    video = document.createElement('video');
    vi.spyOn(video, 'play').mockResolvedValue();
    vi.spyOn(video, 'pause').mockImplementation(() => undefined);
    Object.defineProperties(video, {
      readyState: { value: 2 },
      videoWidth: { value: 1280 },
      videoHeight: { value: 720 },
    });
    canvas = document.createElement('canvas');
    const create = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
      tag === 'canvas' ? canvas : create(tag),
    );
    vi.spyOn(canvas, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    } as unknown as CanvasRenderingContext2D);
    TestBed.configureTestingModule({
      providers: [QrCamera, { provide: QrDecoder, useValue: { decode } }],
    });
    camera = TestBed.inject(QrCamera);
  });
  afterEach(() => {
    camera.stop();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  const start = () => camera.start(video, ready, value, error);

  it('ne demande rien avant démarrage, décode une fois et libère toutes les ressources', async () => {
    expect(media).not.toHaveBeenCalled();
    decode.mockResolvedValue('EQ-OUT-0001');
    await start();
    await flush();
    expect(media).toHaveBeenCalledExactlyOnceWith({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    });
    expect(value).toHaveBeenCalledExactlyOnceWith('EQ-OUT-0001');
    expect(track.stop).toHaveBeenCalledOnce();
    expect(video.srcObject).toBeNull();
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(decode).toHaveBeenCalledOnce();
    expect(value).toHaveBeenCalledOnce();
  });
  it('arrête puis reprend avec un nouveau flux, sans lectures simultanées', async () => {
    const pending = deferred<string | null>();
    decode.mockReturnValueOnce(pending.promise);
    await start();
    await vi.advanceTimersByTimeAsync(1000);
    expect(decode).toHaveBeenCalledOnce();
    expect(canvas.width).toBe(640);
    camera.stop();
    pending.resolve('EQ-OUT-0001');
    await flush();
    expect(value).not.toHaveBeenCalled();
    await start();
    await flush();
    expect(media).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(200);
    expect(decode).toHaveBeenCalledTimes(3);
  });
  it.each(['stop', 'restart'])('ferme une permission tardive après %s', async (action) => {
    const late = deferred<MediaStream>();
    media.mockReturnValueOnce(late.promise);
    const first = start();
    camera.stop();
    if (action === 'restart') await start();
    const lateTrack = { stop: vi.fn() };
    late.resolve({ getTracks: () => [lateTrack] } as unknown as MediaStream);
    await first;
    expect(lateTrack.stop).toHaveBeenCalledOnce();
    expect(value).not.toHaveBeenCalled();
    expect(ready).toHaveBeenCalledTimes(action === 'restart' ? 1 : 0);
  });
  it('ignore une permission refusée après abandon', async () => {
    const late = deferred<MediaStream>();
    media.mockReturnValueOnce(late.promise);
    const first = start();
    camera.stop();
    late.reject(new DOMException('', 'NotAllowedError'));
    await first;
    expect(error).not.toHaveBeenCalled();
  });
  it.each(['resolve', 'reject'])('ignore un décodage tardif (%s) après arrêt', async (outcome) => {
    const pending = deferred<string | null>();
    decode.mockReturnValueOnce(pending.promise);
    await start();
    camera.stop();
    if (outcome === 'resolve') pending.resolve('EQ-OUT-0001');
    else pending.reject(new Error('late'));
    await flush();
    await vi.advanceTimersByTimeAsync(1000);
    expect(value).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('ignore la fin tardive de play après arrêt', async () => {
    const play = deferred<void>();
    vi.mocked(video.play).mockReturnValueOnce(play.promise);
    const first = start();
    await flush();
    camera.stop();
    play.resolve();
    await first;
    expect(ready).not.toHaveBeenCalled();
    expect(decode).not.toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalledOnce();
  });
  it.each([
    ['NotAllowedError', 'refusé'],
    ['SecurityError', 'refusé'],
    ['NotFoundError', 'Aucune caméra'],
    ['NotReadableError', 'occupée'],
    ['AbortError', 'occupée'],
    ['Unexpected', 'erreur technique'],
  ])('explique %s', async (name, message) => {
    media.mockRejectedValueOnce(new DOMException('', name));
    await start();
    expect(error).toHaveBeenCalledWith(expect.stringContaining(message));
    expect(value).not.toHaveBeenCalled();
  });
  it.each([false, true])(
    'explique un contexte incompatible ou API absente : %s',
    async (secure) => {
      vi.stubGlobal('isSecureContext', secure);
      vi.stubGlobal('navigator', {});
      await start();
      expect(error).toHaveBeenCalledWith(expect.stringContaining('HTTPS'));
      expect(media).not.toHaveBeenCalled();
    },
  );
  it('libère le flux après erreur technique du décodeur', async () => {
    decode.mockRejectedValue(new Error('decode failed'));
    await start();
    await flush();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('erreur technique'));
    expect(track.stop).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('traite la déconnexion physique et retire son écouteur', async () => {
    await start();
    track.dispatchEvent(new Event('ended'));
    expect(error).toHaveBeenCalledWith(expect.stringContaining('déconnectée'));
    track.dispatchEvent(new Event('ended'));
    expect(error).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
