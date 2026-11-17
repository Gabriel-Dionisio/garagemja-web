import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Alert } from '../alert/alert';
import { ChipGroup } from '../chip-group/chip-group';
import { EmptyState } from '../empty-state/empty-state';
import { LoadingBlock } from '../loading-block/loading-block';
import { Chart, ChartSeries, ValueFormat } from './chart';
import { CHART_PERIOD_OPTIONS, ChartPeriod } from './period';

@Component({
  selector: 'app-period-chart',
  imports: [TranslocoPipe, Alert, Chart, ChipGroup, EmptyState, LoadingBlock],
  templateUrl: './period-chart.html',
  styleUrl: './period-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeriodChart {
  readonly heading = input.required<string>();
  readonly period = input.required<ChartPeriod>();
  readonly labels = input.required<readonly string[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly loadingLabel = input.required<string>();
  readonly emptyText = input.required<string>();
  readonly yLabel = input<string>();
  readonly format = input<ValueFormat>((value) => String(value));
  readonly showValues = input(true);
  readonly periodChange = output<ChartPeriod>();

  protected readonly options = CHART_PERIOD_OPTIONS;
  protected readonly empty = computed(() =>
    this.series().every((series) => series.data.every((value) => value === 0)),
  );

  protected choose(period: ChartPeriod | null): void {
    if (period && period !== this.period()) this.periodChange.emit(period);
  }
}
