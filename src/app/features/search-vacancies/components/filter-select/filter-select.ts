import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Icon } from '../../../../shared/ui/icon/icon';

export interface FilterOption<T extends string> {
  value: T;
  /** Chave de tradução do rótulo. */
  labelKey: string;
}

/** Seletor compacto em formato de pílula, usado nos filtros e na ordenação da busca. */
@Component({
  selector: 'app-filter-select',
  imports: [TranslocoPipe, Icon],
  templateUrl: './filter-select.html',
  styleUrl: './filter-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSelect<T extends string> {
  /** Nome acessível do seletor (já traduzido). */
  readonly label = input.required<string>();
  readonly options = input.required<readonly FilterOption<T>[]>();
  readonly value = model.required<T>();

  protected onChange(event: Event): void {
    const next = (event.target as HTMLSelectElement).value;
    const option = this.options().find((item) => item.value === next);
    if (option) this.value.set(option.value);
  }
}
