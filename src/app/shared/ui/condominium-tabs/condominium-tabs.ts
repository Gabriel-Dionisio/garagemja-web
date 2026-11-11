import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { TabLink, TabNav } from '../tab-nav/tab-nav';

@Component({
  selector: 'app-condominium-tabs',
  imports: [TabNav],
  template: `<app-tab-nav
    [tabs]="tabs()"
    [label]="transloco.translate('condominiums.tabs.label')"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumTabs {
  protected readonly transloco = inject(TranslocoService);
  readonly id = input.required<string>();
  readonly residents = input(true);
  readonly managers = input(true);
  readonly history = input(true);

  protected readonly tabs = computed<TabLink[]>(() => {
    const base = ['/condominiums', this.id()];
    const tab = (section: string, enabled: boolean): TabLink[] =>
      enabled
        ? [
            {
              link: [...base, section],
              label: this.transloco.translate(`condominiums.tabs.${section}`),
            },
          ]
        : [];
    return [
      { link: base, label: this.transloco.translate('condominiums.tabs.details'), exact: true },
      ...tab('residents', this.residents()),
      ...tab('managers', this.managers()),
      ...tab('history', this.history()),
    ];
  });
}
