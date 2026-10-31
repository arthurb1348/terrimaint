import { signal } from '@angular/core';

export interface SelectedPhoto {
  readonly id: number;
  readonly name: string;
  readonly src: string;
  readonly alt: string;
}

async function matchesFormat(file: File): Promise<boolean> {
  const bytes = await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lecture impossible'));
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
  const starts = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  if (file.type === 'image/png') return starts(137, 80, 78, 71, 13, 10, 26, 10);
  if (file.type === 'image/jpeg') return starts(255, 216, 255);
  return starts(82, 73, 70, 70) && [87, 69, 66, 80].every((value, index) => bytes[index + 8] === value);
}

export function decodePhoto(url: string): Promise<void> {
  const image = new Image();
  image.src = url;
  return image.decode().then(() => {
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Image vide');
  });
}

// Une instance par parcours : ni service global, ni stockage, ni envoi de fichiers.
export class IncidentPhotos {
  readonly photos = signal<readonly SelectedPhoto[]>([]);
  readonly errors = signal<readonly string[]>([]);
  readonly busy = signal(false);
  private generation = 0;
  private nextId = 0;
  private queue: Promise<void> = Promise.resolve();
  private readonly urls = new Set<string>();

  constructor(private readonly decode = decodePhoto) {}

  add(files: readonly File[]): Promise<void> {
    const generation = this.generation;
    this.busy.set(true);
    const operation = this.queue.then(async () => {
      if (generation !== this.generation) return;
      const errors: string[] = [];
      for (const file of files) {
        if (generation !== this.generation) break;
        let reason = '';
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) reason = 'format refusé (JPEG, PNG ou WebP)';
        else if (file.size > 5 * 1024 * 1024) reason = 'dépasse 5 Mio';
        else if (this.photos().length >= 3) reason = '3 photos maximum';
        if (reason) { errors.push(`${file.name} : ${reason}.`); continue; }
        try {
          if (!await matchesFormat(file)) {
            errors.push(`${file.name} : image impossible à décoder dans le format annoncé.`);
            continue;
          }
        } catch {
          if (generation === this.generation) errors.push(`${file.name} : lecture impossible.`);
          continue;
        }
        if (generation !== this.generation) break;
        const url = URL.createObjectURL(file);
        this.urls.add(url);
        try {
          await this.decode(url);
          // Une annulation/déconnexion du parcours invalide aussi les résultats en attente.
          if (generation !== this.generation) continue;
          this.photos.update((photos) => [...photos, {
            id: ++this.nextId, name: file.name, src: url, alt: `Photo sélectionnée : ${file.name}`,
          }]);
        } catch {
          if (generation === this.generation) errors.push(`${file.name} : image impossible à décoder.`);
        } finally {
          if (!this.photos().some((photo) => photo.src === url)) this.release(url);
        }
      }
      if (generation === this.generation) this.errors.set(errors);
    });
    this.queue = operation.finally(() => {
      if (generation === this.generation && this.queue === completed) this.busy.set(false);
    });
    const completed = this.queue;
    return completed;
  }

  remove(id: number): void {
    const photo = this.photos().find((item) => item.id === id);
    if (photo) this.release(photo.src);
    this.photos.update((photos) => photos.filter((item) => item.id !== id));
  }

  clear(): void {
    this.generation++;
    for (const url of this.urls) this.release(url);
    this.photos.set([]);
    this.errors.set([]);
    this.busy.set(false);
    // Une nouvelle sélection n'attend pas un ancien décodage devenu inutile.
    this.queue = Promise.resolve();
  }

  private release(url: string): void {
    if (this.urls.delete(url)) URL.revokeObjectURL(url);
  }
}
