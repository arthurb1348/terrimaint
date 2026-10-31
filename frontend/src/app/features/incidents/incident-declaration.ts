import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';

const nonBlank: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() ? null : { blank: true };

@Component({
  selector: 'app-incident-declaration',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './incident-declaration.html',
  styleUrl: './incident-declaration.css',
})
export class IncidentDeclaration {
  private readonly route = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly equipmentId = computed(() => this.params().get('equipmentId'));
  protected readonly equipment = computed(() =>
    DEMO_EQUIPMENT.find((item) => item.id === this.equipmentId()),
  );
  protected readonly search = computed(() => this.queryParams().get('q') ?? '');
  protected readonly step = signal<'form' | 'review' | 'complete'>('form');
  protected readonly submitted = signal(false);
  protected readonly priorities = [
    { value: 'low', label: 'Basse', explanation: 'intervention à planifier' },
    { value: 'high', label: 'Haute', explanation: 'intervention rapide' },
    { value: 'urgent', label: 'Urgente', explanation: 'danger immédiat' },
  ] as const;
  // Bornes de démonstration : elles ne constituent pas encore un contrat de validation serveur.
  protected readonly titleLimit = 120;
  protected readonly descriptionLimit = 2000;
  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [nonBlank, Validators.maxLength(this.titleLimit)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      // Des espaces seuls représentent une absence ; la borne porte sur les détails fournis.
      validators: [
        (control) =>
          control.value.trim() ? Validators.maxLength(this.descriptionLimit)(control) : null,
      ],
    }),
    priority: new FormControl('', {
      nonNullable: true,
      validators: [
        (control) =>
          this.priorities.some((priority) => priority.value === control.value)
            ? null
            : { priority: true },
      ],
    }),
    risk: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      // Le routeur réutilise le composant : aucune saisie ne doit passer à un autre matériel.
      // q reste indépendant : modifier la recherche seule n'efface pas le formulaire.
      this.equipmentId();
      this.form.reset();
      this.submitted.set(false);
      this.step.set('form');
      afterNextRender(() => this.document.getElementById('main-content')?.focus(), {
        injector: this.injector,
      });
    });
  }

  protected invalid(field: 'title' | 'description' | 'priority'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (this.submitted() || control.touched);
  }

  protected review(): void {
    if (!this.equipment() || this.step() !== 'form') return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      const field = (['title', 'description', 'priority'] as const).find(
        (name) => this.form.controls[name].invalid,
      )!;
      this.focusAfterRender(field === 'priority' ? '#priority-low' : `#incident-${field}`);
      return;
    }
    this.step.set('review');
    this.focusAfterRender('#incident-title-heading');
  }

  protected edit(): void {
    this.step.set('form');
    this.focusAfterRender('#incident-title');
  }

  protected complete(): void {
    if (!this.equipment() || this.step() !== 'review' || this.form.invalid) return;
    // Cette étape ne transmet rien et n'attribue aucun numéro d'incident.
    this.step.set('complete');
    this.focusAfterRender('#incident-title-heading');
  }

  protected priorityLabel(): string {
    const priority = this.priorities.find(
      (item) => item.value === this.form.controls.priority.value,
    );
    return priority ? `${priority.label} — ${priority.explanation}` : '';
  }

  protected descriptionLabel(): string {
    const description = this.form.controls.description.value;
    // Le texte d'absence reste une présentation : Modifier retrouve la saisie intacte.
    return description.trim() ? description : 'Non renseignée';
  }

  protected revealDescription(control: HTMLTextAreaElement): void {
    // Au focus, le navigateur peut ne dégager que le curseur de saisie : centrer le champ
    // multiligne évite que sa partie basse reste cachée derrière la navigation Agent.
    control.scrollIntoView?.({ block: 'center' });
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
