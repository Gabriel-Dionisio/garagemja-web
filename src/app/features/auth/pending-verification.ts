import { Injectable } from '@angular/core';

export interface PendingVerification {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class PendingVerificationStore {
  private pending: PendingVerification | null = null;

  hold(value: PendingVerification): void {
    this.pending = value;
  }

  take(): PendingVerification | null {
    const value = this.pending;
    this.pending = null;
    return value;
  }
}
