import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  ChartConfiguration,
  ChartData,
  LinearScale,
  Plugin,
  Tooltip,
} from 'chart.js';
import { BaseChartDirective, provideCharts } from 'ng2-charts';

export type ChartTone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted';
export type ChartKind = 'share' | 'bar';

export interface ChartSeries {
  label: string;
  data: readonly number[];
  tone: ChartTone | readonly ChartTone[];
}

interface LegendEntry {
  label: string;
  color: string;
  value: number;
  share: number | null;
}

const TONE_TOKENS: Record<ChartTone, string> = {
  primary: '--color-primary',
  secondary: '--color-secondary',
  success: '--color-success',
  warning: '--color-warning',
  danger: '--color-danger',
  muted: '--color-text-muted',
};

const DIMMED_ALPHA = 0.45;

function dimUnselected(isDimmed: (index: number) => boolean): Plugin<'bar'> {
  return {
    id: 'dimUnselected',
    beforeDatasetDraw(chart, args) {
      chart.ctx.globalAlpha = isDimmed(args.index) ? DIMMED_ALPHA : 1;
    },
    afterDatasetDraw(chart) {
      chart.ctx.globalAlpha = 1;
    },
  };
}

function valueLabels(color: string, isDimmed: (index: number) => boolean): Plugin<'bar'> {
  return {
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = '600 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = color;
      chart.data.datasets.forEach((dataset, index) => {
        ctx.globalAlpha = isDimmed(index) ? DIMMED_ALPHA : 1;
        chart.getDatasetMeta(index).data.forEach((bar, position) => {
          ctx.fillText(String(dataset.data[position]), bar.x, bar.y - 4);
        });
      });
      ctx.restore();
    },
  };
}

const CHART_PROVIDERS = provideCharts({
  registerables: [BarController, BarElement, CategoryScale, LinearScale, Tooltip],
});

@Component({
  selector: 'app-chart',
  imports: [BaseChartDirective],
  providers: [CHART_PROVIDERS],
  templateUrl: './chart.html',
  styleUrl: './chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chart {
  private readonly styles = inject(DOCUMENT).defaultView?.getComputedStyle(
    inject(DOCUMENT).documentElement,
  );

  private readonly canvas = viewChild(BaseChartDirective);

  readonly kind = input.required<ChartKind>();
  readonly labels = input.required<readonly string[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  readonly description = input.required<string>();
  readonly xLabel = input<string>();
  readonly yLabel = input<string>();

  protected readonly selected = signal<ReadonlySet<number>>(new Set());

  protected readonly entries = computed<LegendEntry[]>(() => {
    if (this.kind() === 'bar') {
      return this.series().map((series) => ({
        label: series.label,
        color: this.tones(series)[0],
        value: series.data.reduce((sum, value) => sum + value, 0),
        share: null,
      }));
    }
    const [first] = this.series();
    const colors = this.tones(first);
    const sum = first?.data.reduce((acc, value) => acc + value, 0) ?? 0;
    return this.labels().map((label, index) => {
      const value = first?.data[index] ?? 0;
      return {
        label,
        color: colors[index],
        value,
        share: sum ? Math.round((value / sum) * 100) : 0,
      };
    });
  });

  protected readonly single = computed(() => this.entries().length === 1);

  protected readonly total = computed(() =>
    this.entries().reduce((sum, entry) => sum + entry.value, 0),
  );

  protected readonly data = computed<ChartData>(() => {
    return {
      labels: [...this.labels()],
      datasets: this.series().map((series) => ({
        label: series.label,
        data: [...series.data],
        backgroundColor: this.tones(series)[0],
        borderRadius: 4,
        maxBarThickness: 28,
      })),
    } as ChartData;
  });

  protected readonly plugins = computed(() => [
    dimUnselected((index) => this.isDimmed(index)),
    valueLabels(this.token('--color-text'), (index) => this.isDimmed(index)),
  ]);

  protected readonly options = computed<ChartConfiguration['options']>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 20 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: this.token('--color-secondary'),
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: this.token('--color-divider') },
        title: this.axisTitle(this.yLabel()),
        ticks: { precision: 0, color: this.token('--color-text-muted'), maxTicksLimit: 5 },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        title: this.axisTitle(this.xLabel()),
        ticks: { color: this.token('--color-text-muted') },
      },
    },
  }));

  protected readonly rows = computed(() =>
    this.labels().map((label, index) => ({
      label,
      values: this.series().map((series) => series.data[index] ?? 0),
    })),
  );

  constructor() {
    effect(() => {
      this.selected();
      const chart = untracked(() => this.canvas()?.chart);
      if (!chart) return;
      chart.draw();
    });
  }

  protected toggle(index: number): void {
    if (this.single()) return;
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next.size === this.entries().length ? new Set() : next;
    });
  }

  private isDimmed(index: number): boolean {
    const picked = this.selected();
    return picked.size > 0 && !picked.has(index);
  }

  private axisTitle(text: string | undefined) {
    return {
      display: !!text,
      text: text ?? '',
      color: this.token('--color-text-muted'),
      font: { size: 12 },
    };
  }

  private tones(series: ChartSeries | undefined): string[] {
    if (!series) return [];
    const tones: readonly ChartTone[] = Array.isArray(series.tone)
      ? series.tone
      : Array.from({ length: this.labels().length }, () => series.tone as ChartTone);
    return tones.map((tone) => this.token(TONE_TOKENS[tone]));
  }

  private token(name: string): string {
    return this.styles?.getPropertyValue(name).trim() || '#94a3b8';
  }
}
