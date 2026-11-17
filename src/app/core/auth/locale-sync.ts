import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, untracked } from '@angular/core';
import { EMPTY, catchError } from 'rxjs';
import { LocaleService } from '../i18n/locale-service';
import { AuthService } from './auth-service';

@Injectable({ providedIn: 'root' })
export class LocaleSync {
  private readonly http = inject(HttpClient);
  private readonly locale = inject(LocaleService);
  private readonly auth = inject(AuthService);
  private readonly userId = computed(() => this.auth.user()?.id ?? null);

  constructor() {
    effect(() => {
      const id = this.userId();
      const language = this.locale.language();
      if (id === null) return;
      untracked(() =>
        this.http
          .patch(`/api/v1/users/${id}`, { locale: language })
          .pipe(catchError(() => EMPTY))
          .subscribe(),
      );
    });
  }
}
