import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { SkeletonBlock } from '../skeleton/skeleton-block';
import { TabLink, TabNav } from '../tab-nav/tab-nav';
import { CondominiumTabsState, tabAccess } from './condominium-tabs-state';

@Component({
  selector: 'app-condominium-tabs',
  imports: [TabNav, SkeletonBlock],
  template: `
    @if (pending()) {
      <div class="pending" aria-hidden="true">
        <app-skeleton-block width="5rem" height="1.5rem" />
        <app-skeleton-block width="5rem" height="1.5rem" />
        <app-skeleton-block width="5rem" height="1.5rem" />
      </div>
    } @else if (visible()) {
      <app-tab-nav [tabs]="tabs()" [label]="transloco.translate('condominiums.tabs.label')" />
    }
  `,
  styles: `
    .pending {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      min-height: 2.75rem;
      margin-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumTabs {
  protected readonly transloco = inject(TranslocoService);
  private readonly state = inject(CondominiumTabsState);

  readonly id = input.required<string>();
  readonly loading = input(false);
  readonly residents = input(true);
  readonly parkingSpots = input(true);
  readonly rules = input(true);
  readonly managers = input(true);
  readonly history = input(true);

  private readonly access = computed(() => {
    const known = this.state.current();
    return known?.condominium.id === this.id() ? tabAccess(known.condominium, known.admin) : null;
  });

  protected readonly pending = computed(() => this.loading() && !this.access());
  protected readonly visible = computed(() => this.access()?.visible ?? true);

  protected readonly tabs = computed<TabLink[]>(() => {
    const access = this.access();
    const base = ['/condominiums', this.id()];
    const tab = (section: string, enabled: boolean, label = section): TabLink[] =>
      enabled
        ? [
            {
              link: [...base, section],
              label: this.transloco.translate(`condominiums.tabs.${label}`),
            },
          ]
        : [];
    return [
      { link: base, label: this.transloco.translate('condominiums.tabs.details'), exact: true },
      ...tab('residents', access?.residents ?? this.residents()),
      ...tab('parking-spots', access?.parkingSpots ?? this.parkingSpots(), 'parkingSpots'),
      ...tab('rules', access?.rules ?? this.rules()),
      ...tab('managers', access?.managers ?? this.managers()),
      ...tab('history', access?.history ?? this.history()),
    ];
  });
}
