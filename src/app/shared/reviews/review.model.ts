export const REVIEW_DIRECTIONS = ['RENTER_TO_SPOT', 'OWNER_TO_RENTER'] as const;
export type ReviewDirection = (typeof REVIEW_DIRECTIONS)[number];

export const REPORT_REASONS = ['OFFENSIVE', 'FALSE', 'SPAM', 'OTHER'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ['OPEN', 'KEPT', 'HIDDEN'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface Review {
  id: string;
  rentalId: string;
  direction: ReviewDirection;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface RatingSummary {
  average: number;
  total: number;
}

export interface RatedId extends RatingSummary {
  id: string;
}

export interface ReviewReportItem {
  id: string;
  reviewId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  resolutionNote: string | null;
  createdAt: string;
  reviewRating: number;
  reviewComment: string | null;
  parkingSpotId: string;
}

export interface PublicSpot {
  id: string;
  number: string;
  condominiumName: string | null;
  covered: boolean;
  dailyPrice: number | null;
}

export interface PublicProfile {
  id: string;
  displayName: string;
  photoUrl: string | null;
  memberSince: string;
  asHost: RatingSummary;
  asRenter: RatingSummary;
  spots: PublicSpot[];
}

export type ReviewDecision = 'KEEP' | 'HIDE';
