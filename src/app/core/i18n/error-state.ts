import { Signal, computed, signal } from '@angular/core';
import { ApiError } from '../../shared/models/api-error';
import { toApiError } from '../../shared/models/api-error.mapper';

export class ErrorState {
  private readonly error = signal<ApiError | null>(null);
  readonly text: Signal<string | null>;
  readonly status: Signal<number | null>;

  constructor(fallback: () => string) {
    this.status = computed(() => this.error()?.status ?? null);
    this.text = computed(() => {
      const error = this.error();
      return error && (error.message ?? fallback());
    });
  }

  set(error: ApiError): void {
    this.error.set(error);
  }

  setFrom(error: unknown): void {
    this.error.set(toApiError(error));
  }

  clear(): void {
    this.error.set(null);
  }
}
