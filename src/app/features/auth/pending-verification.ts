import { Injectable } from '@angular/core';

export interface PendingVerification {
  email: string;
  password: string;
  returnUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class PendingVerificationStore {
  private pending: PendingVerification | null = null;
  private email: string | null = null;

  hold(value: PendingVerification): void {
    this.pending = value;
    this.email = value.email;
  }

  recentEmail(): string | null {
    return this.email;
  }

  take(): PendingVerification | null {
    const value = this.pending;
    this.pending = null;
    return value;
  }
}
