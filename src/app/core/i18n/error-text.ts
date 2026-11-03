import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { switchMap } from 'rxjs';
import { ErrorState } from './error-state';

@Injectable({ providedIn: 'root' })
export class ErrorText {
  private readonly transloco = inject(TranslocoService);
  private readonly loaded = toSignal(
    this.transloco.langChanges$.pipe(switchMap((lang) => this.transloco.load(lang))),
  );

  state(): ErrorState {
    return new ErrorState(() => {
      this.loaded();
      return this.transloco.translate('errors.generic');
    });
  }
}
