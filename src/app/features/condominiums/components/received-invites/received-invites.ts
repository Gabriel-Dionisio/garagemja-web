import { DatePipe } from '@angular/common';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
import { ErrorText } from '../../../../core/i18n/error-text';
import { NavBadges } from '../../../../core/layout/nav-badges';
import { Alert } from '../../../../shared/ui/alert/alert';
import { Button } from '../../../../shared/ui/button/button';
import { Card } from '../../../../shared/ui/card/card';
import { Checkbox } from '../../../../shared/ui/checkbox/checkbox';
import { ManagerInvite } from '../../condominium.model';
import { CondominiumsApi } from '../../data/condominiums-api';

@Component({
  selector: 'app-received-invites',
  imports: [DatePipe, TranslocoPipe, Alert, Button, Card, Checkbox],
  templateUrl: './received-invites.html',
  styleUrl: './received-invites.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceivedInvites {
  private readonly api = inject(CondominiumsApi);
  private readonly auth = inject(AuthService);
  private readonly navBadges = inject(NavBadges);
  private readonly errorText = inject(ErrorText);
  private readonly destroyRef = inject(DestroyRef);

  readonly accepted = output<void>();

  protected readonly invites = signal<ManagerInvite[]>([]);
  protected readonly busy = signal(false);
  protected readonly activeId = signal<string | null>(null);
  protected readonly error = this.errorText.state();

  private readonly notResidentControls = new Map<string, FormControl<boolean>>();

  constructor() {
    this.api
      .myInvites()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (invites) => this.invites.set(invites), error: () => undefined });
  }

  protected notResident(inviteId: string): FormControl<boolean> {
    let control = this.notResidentControls.get(inviteId);
    if (!control) {
      control = new FormControl(false, { nonNullable: true });
      this.notResidentControls.set(inviteId, control);
    }
    return control;
  }

  protected accept(invite: ManagerInvite): void {
    this.run(
      invite.id,
      this.api
        .acceptInvite(invite.id, !this.notResident(invite.id).value)
        .pipe(switchMap(() => this.auth.loadSession())),
      () => this.accepted.emit(),
    );
  }

  protected decline(invite: ManagerInvite): void {
    this.run(invite.id, this.api.declineInvite(invite.id), () => undefined);
  }

  private run<T>(id: string, call: Observable<T>, onDone: () => void): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.activeId.set(id);
    this.error.clear();
    const previous = this.invites();
    this.invites.update((current) => current.filter((invite) => invite.id !== id));
    call
      .pipe(
        finalize(() => {
          this.busy.set(false);
          this.activeId.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.navBadges.refresh();
          onDone();
        },
        error: (error: unknown) => {
          this.invites.set(previous);
          this.error.setFrom(error);
        },
      });
  }
}
