import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { resolveEquipmentReference } from './equipment-reference';
import { QrCamera } from './qr-camera';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [RouterLink],
  providers: [QrCamera],
  templateUrl: './scanner.html',
  styleUrl: './scanner.css',
})
export class Scanner {
  private readonly camera = inject(QrCamera);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>('preview');
  private readonly referenceInput = viewChild.required<ElementRef<HTMLInputElement>>('reference');
  private navigating = false;
  private alive = true;
  protected readonly state = signal<'idle' | 'starting' | 'scanning' | 'stopped' | 'error'>('idle');
  protected readonly message = signal('Caméra arrêtée. Démarrez-la ou saisissez la référence.');
  protected readonly referenceError = signal('');

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) this.stop();
    });
    this.destroyRef.onDestroy(() => {
      this.alive = false;
      this.camera.stop();
    });
  }

  protected start(): void {
    if (
      !this.alive ||
      this.navigating ||
      this.state() === 'starting' ||
      this.state() === 'scanning'
    )
      return;
    this.referenceError.set('');
    this.state.set('starting');
    this.message.set(
      'Autorisation de la caméra en attente. Vous pouvez annuler ou saisir la référence.',
    );
    void this.camera.start(
      this.video().nativeElement,
      () => {
        this.state.set('scanning');
        this.message.set('Caméra active. Cadrez le QR code du matériel.');
      },
      (value) => {
        this.state.set('stopped');
        this.identify(value, false);
      },
      (message) => {
        this.state.set('error');
        this.message.set(message);
      },
    );
  }

  protected stop(): void {
    this.camera.stop();
    this.state.set('stopped');
    this.message.set('Caméra arrêtée. Reprenez-la ou saisissez la référence.');
  }

  @HostListener('window:pagehide')
  protected pageHidden(): void {
    this.stop();
  }

  @HostListener('document:visibilitychange')
  protected visibilityChanged(): void {
    if (this.document.hidden) this.stop();
  }

  protected identify(value: string, manual = true): void {
    if (!this.alive || this.navigating) return;
    const result = resolveEquipmentReference(value);
    if ('error' in result) {
      this.referenceError.set(result.error);
      if (!manual)
        this.message.set(
          'QR code lu, matériel non identifié. Reprenez la caméra ou saisissez la référence.',
        );
      this.referenceInput().nativeElement.focus();
      return;
    }
    this.navigating = true;
    this.camera.stop();
    this.state.set('stopped');
    this.referenceError.set('');
    this.message.set('Matériel reconnu. Ouverture de la fiche.');
    // Seul l’identifiant issu de la source typée construit une route interne.
    void this.router
      .navigate(['/agent/equipements', result.equipment.id])
      .then((success) => {
        if (!success) this.navigationFailed();
      })
      .catch(() => this.navigationFailed());
  }

  private navigationFailed(): void {
    if (!this.alive) return;
    this.navigating = false;
    this.message.set(
      'La fiche n’a pas pu être ouverte. Réessayez avec la référence ou reprenez la caméra.',
    );
  }
}
