import { Dialog } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { EMPTY, catchError, filter, finalize, switchMap } from 'rxjs';
import { ErrorText } from '../../../../core/i18n/error-text';
import { LocaleService } from '../../../../core/i18n/locale-service';
import { dateTimeFormatter, moneyFormatter } from '../../../../shared/forms/format';
import { Page as PageResult } from '../../../../shared/models/page';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { ChipGroup, ChipOption } from '../../../../shared/ui/chip-group/chip-group';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { ListState } from '../../../../shared/ui/list-state/list-state';
import { Page } from '../../../../shared/ui/page/page';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  Paginator,
} from '../../../../shared/ui/paginator/paginator';
import { StatCard } from '../../../../shared/ui/stat-card/stat-card';
import {
  WithdrawDialog,
  WithdrawDialogData,
} from '../../components/withdraw-dialog/withdraw-dialog';
import { WalletsApi } from '../../data/wallets-api';
import { WalletEntry, WalletSummary } from '../../wallet.model';

const keyOf = (wallet: WalletSummary) => `${wallet.type}:${wallet.refId}`;

@Component({
  selector: 'app-wallet-page',
  imports: [
    TranslocoPipe,
    Alert,
    Badge,
    Button,
    ChipGroup,
    ListItem,
    ListState,
    Page,
    PageHeader,
    Paginator,
    StatCard,
  ],
  templateUrl: './wallet-page.html',
  styleUrl: './wallet-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(WalletsApi);
  private readonly dialog = inject(Dialog);
  private readonly locale = inject(LocaleService);

  protected readonly pageSizes = PAGE_SIZES;
  protected readonly money = computed(() => moneyFormatter(this.locale.language()));
  protected readonly dateTime = computed(() => dateTimeFormatter(this.locale.language()));
  protected readonly error = inject(ErrorText).state();
  protected readonly wallets = signal<WalletSummary[] | null>(null);
  protected readonly selectedKey = signal<string | null>(null);
  protected readonly selected = computed(() => {
    const wallets = this.wallets();
    return wallets?.find((wallet) => keyOf(wallet) === this.selectedKey()) ?? wallets?.[0] ?? null;
  });
  protected readonly activeKey = computed(() => {
    const wallet = this.selected();
    return wallet ? keyOf(wallet) : null;
  });
  protected readonly options = computed<readonly ChipOption[]>(() =>
    (this.wallets() ?? []).map((wallet) => ({
      value: keyOf(wallet),
      ...(wallet.name ? { label: wallet.name } : { labelKey: `wallet.type.${wallet.type}` }),
    })),
  );
  protected readonly page = signal(0);
  protected readonly size = signal(DEFAULT_PAGE_SIZE);
  protected readonly loading = signal(true);
  protected readonly result = signal<PageResult<WalletEntry> | null>(null);
  private readonly reloads = signal(0);

  constructor() {
    toObservable(this.reloads)
      .pipe(
        switchMap(() =>
          this.api.list().pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.loading.set(false);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((wallets) => {
        this.wallets.set(wallets);
        if (wallets.length === 0) this.loading.set(false);
      });

    toObservable(
      computed(() => ({
        wallet: this.selected(),
        page: this.page(),
        size: this.size(),
      })),
    )
      .pipe(
        filter(
          (query): query is { wallet: WalletSummary; page: number; size: number } =>
            query.wallet !== null,
        ),
        switchMap(({ wallet, page, size }) => {
          this.loading.set(true);
          this.error.clear();
          return this.api.entries(wallet, page, size).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.result.set(null);
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.result.set(result));
  }

  protected select(key: string | null): void {
    if (key === null) return;
    this.selectedKey.set(key);
    this.page.set(0);
  }

  protected withdraw(wallet: WalletSummary): void {
    const data: WithdrawDialogData = { wallet };
    this.dialog
      .open<boolean>(WithdrawDialog, { data, ariaLabelledBy: 'withdraw-title', disableClose: true })
      .closed.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((done) => {
        if (done) this.reloads.update((count) => count + 1);
      });
  }

  protected changeSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }
}
