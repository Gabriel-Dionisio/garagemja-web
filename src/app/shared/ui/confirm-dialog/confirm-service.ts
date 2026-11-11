import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData, ConfirmResult } from './confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(Dialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.open(data).pipe(map((result) => result !== false && result !== undefined));
  }

  askReason(data: ConfirmDialogData): Observable<string | null> {
    return this.open(data).pipe(map((result) => (typeof result === 'string' ? result : null)));
  }

  private open(data: ConfirmDialogData): Observable<ConfirmResult | undefined> {
    return this.dialog.open<ConfirmResult>(ConfirmDialog, {
      data,
      ariaLabelledBy: 'confirm-title',
      role: 'alertdialog',
    }).closed;
  }
}
