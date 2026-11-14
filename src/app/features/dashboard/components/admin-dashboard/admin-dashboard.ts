import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { SplitLayout } from '../../../../shared/ui/split-layout/split-layout';
import { Card } from '../../../../shared/ui/card/card';
import { monthLabels } from '../../data/month-labels';
import { AdminMonthlyStats, StatsApi } from '../../data/stats-api';
import { Chart, ChartSeries, ChartTone } from '../../../../shared/ui/chart/chart';
import { LoadingBlock } from '../../../../shared/ui/loading-block/loading-block';
import { StatCard } from '../../../../shared/ui/stat-card/stat-card';
import {
  CondominiumsTotals,
  PlatformSummaryApi,
  UsersTotals,
} from '../../data/platform-summary-api';

interface UserKpi {
  key: keyof UsersTotals;
  status?: 'ACTIVE' | 'BLOCKED';
  highlight?: boolean;
}

type Part = readonly [labelKey: string, value: number, tone: ChartTone];

const USER_KPIS: readonly UserKpi[] = [
  { key: 'total' },
  { key: 'active', status: 'ACTIVE' },
  { key: 'blocked', status: 'BLOCKED' },
];

const CONDOMINIUM_KPIS: readonly (keyof CondominiumsTotals)[] = [
  'total',
  'active',
  'pending',
  'blocked',
];

type Subject = 'users' | 'condominiums';

const SUBJECT_OPTIONS: readonly ChipOption<Subject>[] = [
  { value: 'users', labelKey: 'admin.dashboard.usersTitle' },
  { value: 'condominiums', labelKey: 'admin.dashboard.condominiumsTitle' },
];

@Component({
  selector: 'app-admin-dashboard',
  imports: [TranslocoPipe, Alert, Card, Chart, ChipGroup, LoadingBlock, SplitLayout, StatCard],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly stats = inject(StatsApi);
  private readonly platform = inject(PlatformSummaryApi);
  private readonly errorText = inject(ErrorText);
  private readonly transloco = inject(TranslocoService);
  private readonly language = toSignal(this.transloco.langChanges$);

  protected readonly userKpis = USER_KPIS;
  protected readonly condominiumKpis = CONDOMINIUM_KPIS;
  protected readonly usersSummary = signal<UsersTotals | null>(null);
  protected readonly condominiumsSummary = signal<CondominiumsTotals | null>(null);
  protected readonly error = this.errorText.state();

  protected readonly monthly = signal<AdminMonthlyStats | null>(null);

  protected readonly newUsersThisMonth = computed(
    () => this.monthly()?.users.at(-1)?.count ?? null,
  );

  protected readonly subjectOptions = SUBJECT_OPTIONS;
  protected readonly subject = signal<Subject>('users');

  protected readonly monthlyChart = computed(() => {
    const stats = this.monthly();
    const language = this.language();
    if (!stats || !language) return null;
    const subject = this.subject();
    const title = this.transloco.translate('admin.dashboard.monthlyChart');
    return {
      title,
      labels: monthLabels(stats.users, language),
      series: [
        {
          label: this.transloco.translate(`admin.dashboard.monthly.${subject}`),
          data: stats[subject].map((point) => point.count),
          tone: subject === 'users' ? 'primary' : 'secondary',
        },
      ] satisfies ChartSeries[],
    };
  });

  protected readonly userChart = computed(() => {
    const summary = this.usersSummary();
    if (!summary) return null;
    return this.donut('admin.dashboard.usersChart', [
      ['admin.dashboard.kpi.active', summary.active, 'success'],
      ['admin.dashboard.kpi.blocked', summary.blocked, 'danger'],
      ['admin.dashboard.kpi.other', remainder(summary), 'muted'],
    ]);
  });

  protected readonly condominiumChart = computed(() => {
    const summary = this.condominiumsSummary();
    if (!summary) return null;
    return this.donut('admin.dashboard.condominiumsChart', [
      ['condominiums.dashboard.kpi.active', summary.active, 'success'],
      ['condominiums.dashboard.kpi.pending', summary.pending, 'warning'],
      ['condominiums.dashboard.kpi.blocked', summary.blocked, 'danger'],
      ['admin.dashboard.kpi.other', remainder(summary), 'muted'],
    ]);
  });

  constructor() {
    this.stats
      .adminMonthly()
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({ next: (stats) => this.monthly.set(stats), error: () => this.monthly.set(null) });
    forkJoin({ users: this.platform.users(), condominiums: this.platform.condominiums() })
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe({
        next: ({ users, condominiums }) => {
          this.usersSummary.set(users);
          this.condominiumsSummary.set(condominiums);
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  protected chooseSubject(subject: Subject | null): void {
    if (subject) this.subject.set(subject);
  }

  private donut(titleKey: string, parts: readonly Part[]) {
    this.language();
    const title = this.transloco.translate(titleKey);
    const series: ChartSeries[] = [
      {
        label: title,
        data: parts.map(([, value]) => value),
        tone: parts.map(([, , tone]) => tone),
      },
    ];
    return { title, labels: parts.map(([key]) => this.transloco.translate(key)), series };
  }
}

function remainder(summary: UsersTotals | CondominiumsTotals): number {
  const pending = 'pending' in summary ? summary.pending : 0;
  return Math.max(summary.total - summary.active - pending - summary.blocked, 0);
}
