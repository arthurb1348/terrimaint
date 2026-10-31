import { describe, expect, it, vi } from 'vitest';
import { QrDecoder } from './qr-decoder';

const jsQR = vi.hoisted(() => vi.fn());
vi.mock('jsqr', () => ({ default: jsQR }));

describe('Chargement asynchrone du décodeur', () => {
  const frame = { data: new Uint8ClampedArray(4), width: 1, height: 1 } as ImageData;
  it('ne commence pas le décodage si l’import se termine après abandon', async () => {
    jsQR.mockClear();
    const abort = new AbortController();
    const result = new QrDecoder().decode(frame, abort.signal);
    abort.abort();
    expect(await result).toBeNull();
    expect(jsQR).not.toHaveBeenCalled();
  });
  it('transmet les pixels au décodeur actif et restitue son résultat', async () => {
    jsQR.mockReturnValueOnce({ data: 'EQ-OUT-0001' });
    expect(await new QrDecoder().decode(frame, new AbortController().signal)).toBe('EQ-OUT-0001');
    expect(jsQR).toHaveBeenCalledWith(frame.data, 1, 1);
  });
});
