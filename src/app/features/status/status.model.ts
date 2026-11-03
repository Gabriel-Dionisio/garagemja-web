export type HealthState = 'up' | 'down' | 'unreachable';

export interface ServiceComponent {
  name: string;
  up: boolean;
}

export interface ServiceStatus {
  state: HealthState;
  version: string | null;
  components: ServiceComponent[];
  latencyMs: number | null;
  checkedAt: Date;
}

export type BucketState = 'up' | 'degraded' | 'down' | 'noData';

export interface HistoryBucket {
  start: Date;
  state: BucketState;
}

export interface StatusHistory {
  bucketMinutes: number;
  uptimePercent: number | null;
  buckets: HistoryBucket[];
}
