import { DatePipe, DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DEMO_EQUIPMENT } from '../equipements/equipements-demo';
import { DEMO_INCIDENTS } from '../incidents/incidents-demo';
import { DEMO_AGENTS } from './agents-demo';
import { INTERVENTION_STATUSES } from './intervention';
import {
  InterventionFilters,
  interventionQueryParams,
  readInterventionFilters,
} from './intervention-filters';
import { DEMO_INTERVENTIONS } from './interventions-demo';

@Component({
  selector: 'app-interventions',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './interventions.html',
  styleUrls: ['../incidents/incident-presentation.css', './interventions.css'],
})
export class Interventions {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly filters = computed(() => readInterventionFilters(this.queryParams()));
  protected readonly query = computed(() => interventionQueryParams(this.filters()));
  protected readonly statuses = INTERVENTION_STATUSES;
  protected readonly statusOptions = Object.entries(INTERVENTION_STATUSES);
  protected readonly agents = DEMO_AGENTS;
  protected readonly total = DEMO_INTERVENTIONS.length;
  protected readonly counts = this.statusOptions.map(([status, label]) => ({
    status,
    label,
    count: DEMO_INTERVENTIONS.filter((item) => item.status === status).length,
  }));
  private readonly rows = DEMO_INTERVENTIONS.map((intervention) => {
    const incident = DEMO_INCIDENTS.find((item) => item.id === intervention.incidentId);
    return {
      intervention,
      equipment: DEMO_EQUIPMENT.find((item) => item.id === incident?.equipmentId),
      agent: DEMO_AGENTS.find((item) => item.id === intervention.agentId),
    };
  });
  protected readonly filteredInterventions = computed(() => {
    const { q, status, assignee } = this.filters();
    const search = q.trim().toLowerCase();
    return this.rows.filter(
      ({ intervention, equipment }) =>
        (!status || intervention.status === status) &&
        (!assignee || intervention.agentId === assignee) &&
        [intervention.id, intervention.title, equipment?.id ?? '', equipment?.name ?? ''].some(
          (value) => value.toLowerCase().includes(search),
        ),
    );
  });

  constructor() {
    afterNextRender(() => this.document.getElementById('main-content')?.focus());
  }

  protected updateFilter(name: keyof InterventionFilters, value: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.query(), [name]: value || null },
      replaceUrl: true,
    });
  }

  protected async resetFilters(input: HTMLInputElement): Promise<void> {
    await this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    input.focus();
  }
}
