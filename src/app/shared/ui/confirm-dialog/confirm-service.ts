import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(Dialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<boolean>(ConfirmDialog, { data, ariaLabelledBy: 'confirm-title', role: 'alertdialog' })
      .closed.pipe(map((confirmed) => confirmed === true));
  }
}
