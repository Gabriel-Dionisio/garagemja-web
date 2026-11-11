import { DatePipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, forkJoin, map, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Badge } from '../../../../shared/ui/badge/badge';
import { Button } from '../../../../shared/ui/button/button';
import { ConfirmService } from '../../../../shared/ui/confirm-dialog/confirm-service';
import { IconButton } from '../../../../shared/ui/icon-button/icon-button';
import { Icon } from '../../../../shared/ui/icon/icon';
import { Card } from '../../../../shared/ui/card/card';
import { Checkbox } from '../../../../shared/ui/checkbox/checkbox';
import { ListItem } from '../../../../shared/ui/list-item/list-item';
import { Page } from '../../../../shared/ui/page/page';
import { Skeleton } from '../../../../shared/ui/skeleton/skeleton';
import { PageHeader } from '../../../../shared/ui/page-header/page-header';
import { UserSummary } from '../../../../shared/ui/user-summary/user-summary';
import { CondominiumTabs } from '../../../../shared/ui/condominium-tabs/condominium-tabs';
import {
  ManagerEmailDialog,
  ManagerEmailDialogData,
  ManagerEmailResult,
} from '../../components/manager-email-dialog/manager-email-dialog';
import { Condominium, Manager, ManagerInvite } from '../../condominium.model';
import { CondominiumsApi } from '../../data/condominiums-api';

@Component({
  selector: 'app-condominium-managers-page',
  imports: [
    DatePipe,
    TranslocoPipe,
    Alert,
    Badge,
    Button,
    Card,
    Checkbox,
    CondominiumTabs,
    Icon,
    IconButton,
    ListItem,
    Page,
    PageHeader,
    Skeleton,
    UserSummary,
  ],
  templateUrl: './condominium-managers-page.html',
  styleUrl: './condominium-managers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondominiumManagersPage {
  private readonly api = inject(CondominiumsApi);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly errorText = inject(ErrorText);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  protected readonly condominium = signal<Condominium | null>(null);
  protected readonly managers = signal<Manager[]>([]);
  protected readonly invites = signal<ManagerInvite[]>([]);
  protected readonly sentInvites = computed(() => this.invites().filter((i) => !i.requested));
  protected readonly requests = computed(() => this.invites().filter((i) => i.requested));
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = this.errorText.state({
    403: 'errors.condominium.forbidden',
    404: 'errors.condominium.notFound',
  });
  protected readonly showEmail = new FormControl(false, { nonNullable: true });
  protected readonly ownManager = computed(() =>
    this.managers().find((manager) => manager.userId === this.currentUserId()),
  );
  protected readonly canSeeResidents = computed(
    () => !this.isAdmin() && this.condominium()?.canManage === true,
  );
  protected readonly hasHistory = computed(() => this.condominium()?.status !== 'PENDING');
  protected readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  protected readonly currentUserId = computed(() => this.auth.user()?.id);
  protected readonly canInvite = computed(
    () => !this.isAdmin() && this.condominium()?.status === 'ACTIVE',
  );
  protected readonly canTransfer = computed(() => {
    const status = this.condominium()?.status;
    return status === 'ACTIVE' || status === 'BLOCKED';
  });
  private readonly dialog = inject(Dialog);

  constructor() {
    effect(() => {
      const own = this.ownManager();
      if (own) this.showEmail.setValue(own.showEmail, { emitEvent: false });
    });
    this.showEmail.valueChanges
      .pipe(
        switchMap((value) =>
          this.api.setShowManagerEmail(this.id(), value).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();

    toObservable(this.id)
      .pipe(
        switchMap((id) => {
          this.loading.set(true);
          this.error.clear();
          return forkJoin({
            condominium: this.api.get(id),
            managers: this.api.managers(id),
            invites: this.api.invites(id),
          }).pipe(
            catchError((error: unknown) => {
              this.error.setFrom(error);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ condominium, managers, invites }) => {
        this.condominium.set(condominium);
        this.managers.set(managers);
        this.invites.set(invites);
        this.loading.set(false);
      });
  }

  protected removeLabel(manager: Manager): string {
    return manager.userId === this.currentUserId()
      ? 'condominiums.managers.leave'
      : 'condominiums.managers.remove';
  }

  protected canRemove(manager: Manager): boolean {
    if (this.isAdmin()) return true;
    return manager.userId === this.currentUserId() && this.managers().length > 1;
  }

  protected openInvite(): void {
    this.askEmail(
      {
        title: 'condominiums.managers.inviteTitle',
        hint: 'condominiums.managers.inviteHint',
        confirmLabel: 'condominiums.managers.invite',
      },
      ({ email }) => this.api.invite(this.id(), email),
      () => this.sent.set(true),
    );
  }

  protected openTransfer(manager: Manager): void {
    this.askEmail(
      {
        title: 'condominiums.managers.transfer.title',
        hint: 'condominiums.managers.transfer.hint',
        confirmLabel: 'condominiums.managers.transfer.confirm',
        params: { manager: manager.name },
        withReason: true,
      },
      ({ email, reason }) =>
        this.api.transferManager(this.id(), { fromUserId: manager.userId, email, reason }),
      () => undefined,
    );
  }

  protected remove(manager: Manager): void {
    const current = this.condominium();
    if (!current || this.busy()) return;
    const leaving = manager.userId === this.currentUserId();
    const action = leaving ? 'leave' : 'remove';
    this.sent.set(false);
    const dialog = {
      title: `condominiums.managers.dialog.${action}.title`,
      message: `condominiums.managers.dialog.${action}.message`,
      params: { name: current.name, manager: manager.name },
      confirmLabel: `condominiums.managers.dialog.${action}.confirm`,
      danger: true,
    };
    const confirmed$ = this.isAdmin()
      ? this.confirm.askReason({
          ...dialog,
          reason: { label: 'condominiums.managers.removeReason', maxLength: 500 },
        })
      : this.confirm.confirm(dialog).pipe(map((ok) => (ok ? '' : null)));
    this.run(
      confirmed$.pipe(
        switchMap((reason) =>
          reason === null
            ? EMPTY
            : this.api.removeManager(this.id(), manager.userId, reason || undefined),
        ),
      ),
      () => {
        if (leaving) this.afterLeaving();
      },
    );
  }

  protected approve(request: ManagerInvite): void {
    if (this.busy()) return;
    this.sent.set(false);
    this.run(this.api.approveRequest(this.id(), request.id), () => undefined);
  }

  protected cancelInvite(invite: ManagerInvite): void {
    if (this.busy()) return;
    this.sent.set(false);
    this.run(this.api.cancelInvite(this.id(), invite.id), () => undefined);
  }

  private afterLeaving(): void {
    this.auth
      .loadSession()
      .pipe(
        catchError(() => EMPTY),
        finalize(() => void this.router.navigate(['/condominiums'])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private askEmail(
    data: ManagerEmailDialogData,
    call: (result: ManagerEmailResult) => Observable<unknown>,
    onDone: () => void,
  ): void {
    if (this.busy()) return;
    this.sent.set(false);
    this.run(
      this.dialog
        .open<ManagerEmailResult>(ManagerEmailDialog, {
          data,
          ariaLabelledBy: 'manager-email-title',
        })
        .closed.pipe(switchMap((result) => (result ? call(result) : EMPTY))),
      onDone,
    );
  }

  private run(call: Observable<unknown>, onDone: () => void): void {
    this.busy.set(true);
    this.error.clear();
    call
      .pipe(
        tap(onDone),
        switchMap(() => this.refresh()),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ managers, invites }) => {
          this.managers.set(managers);
          this.invites.set(invites);
        },
        error: (error: unknown) => this.error.setFrom(error),
      });
  }

  private refresh() {
    const id = this.id();
    return forkJoin({ managers: this.api.managers(id), invites: this.api.invites(id) });
  }
}
