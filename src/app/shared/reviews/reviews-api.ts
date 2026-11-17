import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { fields, textOrNull } from '../models/fields';
import { Page, toResponsePage } from '../models/page';
import {
  PublicProfile,
  PublicSpot,
  RatedId,
  RatingSummary,
  REPORT_REASONS,
  REPORT_STATUSES,
  REVIEW_DIRECTIONS,
  ReportReason,
  ReportStatus,
  Review,
  ReviewDecision,
  ReviewDirection,
  ReviewReportItem,
} from './review.model';

const API = '/api/v1';

function asList(body: unknown, what: string): unknown[] {
  if (!Array.isArray(body)) throw new Error(`Invalid ${what}`);
  return body;
}

export function toRatingSummary(value: unknown): RatingSummary {
  const row = fields(value, 'rating');
  const average = Number(row['average']);
  const total = Number(row['total']);
  if (!Number.isFinite(average) || !Number.isInteger(total)) throw new Error('Invalid rating');
  return { average, total };
}

export function toRatedId(value: unknown): RatedId {
  const row = fields(value, 'rated id');
  if (typeof row['id'] !== 'string') throw new Error('Invalid rated id');
  return { id: row['id'], ...toRatingSummary(row) };
}

export function toReview(value: unknown): Review {
  const row = fields(value, 'review');
  const { id, rentalId, direction, createdAt } = row;
  const rating = Number(row['rating']);
  if (
    typeof id !== 'string' ||
    typeof rentalId !== 'string' ||
    !REVIEW_DIRECTIONS.includes(direction as ReviewDirection) ||
    typeof createdAt !== 'string' ||
    !Number.isInteger(rating)
  ) {
    throw new Error('Invalid review');
  }
  return {
    id,
    rentalId,
    direction: direction as ReviewDirection,
    rating,
    comment: textOrNull(row['comment']),
    createdAt,
  };
}

export function toReportItem(value: unknown): ReviewReportItem {
  const row = fields(value, 'review report');
  const report = fields(row['report'], 'report');
  const { id, reviewId, reason, status, createdAt } = report;
  const reviewRating = Number(row['reviewRating']);
  if (
    typeof id !== 'string' ||
    typeof reviewId !== 'string' ||
    !REPORT_REASONS.includes(reason as ReportReason) ||
    !REPORT_STATUSES.includes(status as ReportStatus) ||
    typeof createdAt !== 'string' ||
    typeof row['parkingSpotId'] !== 'string' ||
    !Number.isInteger(reviewRating)
  ) {
    throw new Error('Invalid review report');
  }
  return {
    id,
    reviewId,
    reason: reason as ReportReason,
    details: textOrNull(report['details']),
    status: status as ReportStatus,
    resolutionNote: textOrNull(report['resolutionNote']),
    createdAt,
    reviewRating,
    reviewComment: textOrNull(row['reviewComment']),
    parkingSpotId: row['parkingSpotId'],
    parkingSpotNumber: textOrNull(row['parkingSpotNumber']),
    condominiumName: textOrNull(row['condominiumName']),
  };
}

function toPublicSpot(value: unknown): PublicSpot {
  const row = fields(value, 'public spot');
  const price = row['dailyPrice'];
  if (typeof row['id'] !== 'string' || typeof row['number'] !== 'string') {
    throw new Error('Invalid public spot');
  }
  return {
    id: row['id'],
    number: row['number'],
    condominiumName: textOrNull(row['condominiumName']),
    covered: row['covered'] === true,
    dailyPrice: typeof price === 'number' ? price : null,
  };
}

export function toPublicProfile(value: unknown): PublicProfile {
  const row = fields(value, 'profile');
  const { id, displayName, memberSince } = row;
  if (
    typeof id !== 'string' ||
    typeof displayName !== 'string' ||
    typeof memberSince !== 'string'
  ) {
    throw new Error('Invalid profile');
  }
  return {
    id,
    displayName,
    photoUrl: textOrNull(row['photoUrl']),
    memberSince,
    asHost: toRatingSummary(row['asHost']),
    asRenter: toRatingSummary(row['asRenter']),
    spots: asList(row['spots'], 'profile spots').map(toPublicSpot),
  };
}

@Injectable({ providedIn: 'root' })
export class ReviewsApi {
  private readonly http = inject(HttpClient);

  create(rentalId: string, rating: number, comment: string): Observable<Review> {
    return this.http
      .post<unknown>(`${API}/rentals/${rentalId}/reviews`, { rating, comment: comment || null })
      .pipe(map(toReview));
  }

  bySpot(spotId: string, page: number, size: number): Observable<Page<Review>> {
    return this.pagedReviews(`${API}/parking-spots/${spotId}/reviews`, page, size);
  }

  byUser(userId: string, page: number, size: number): Observable<Page<Review>> {
    return this.pagedReviews(`${API}/users/${userId}/reviews`, page, size);
  }

  spotRatings(ids: string[]): Observable<Map<string, RatingSummary>> {
    return this.ratings(`${API}/parking-spots/ratings`, ids);
  }

  renterRatings(ids: string[]): Observable<Map<string, RatingSummary>> {
    return this.ratings(`${API}/users/renter-ratings`, ids);
  }

  pendingReviews(rentalIds: string[]): Observable<Set<string>> {
    if (!rentalIds.length) return of(new Set<string>());
    const params = new HttpParams({ fromObject: { rentalIds } });
    return this.http.get<unknown>(`${API}/reviews/pending`, { params }).pipe(
      map((body) => {
        const ids = asList(body, 'pending reviews');
        if (!ids.every((id) => typeof id === 'string')) throw new Error('Invalid pending reviews');
        return new Set(ids as string[]);
      }),
    );
  }

  profile(userId: string): Observable<PublicProfile> {
    return this.http.get<unknown>(`${API}/users/${userId}/profile`).pipe(map(toPublicProfile));
  }

  report(reviewId: string, reason: ReportReason, details: string): Observable<void> {
    return this.http
      .post<unknown>(`${API}/reviews/${reviewId}/reports`, { reason, details: details || null })
      .pipe(map(() => undefined));
  }

  reports(
    status: ReportStatus | null,
    page: number,
    size: number,
  ): Observable<Page<ReviewReportItem>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http
      .get<unknown>(`${API}/review-reports`, { params, observe: 'response' })
      .pipe(
        map((response) =>
          toResponsePage(
            response,
            asList(response.body, 'review reports').map(toReportItem),
            page,
            size,
          ),
        ),
      );
  }

  resolve(reportId: string, decision: ReviewDecision, note: string): Observable<void> {
    return this.http
      .post<unknown>(`${API}/review-reports/${reportId}/resolution`, { decision, note })
      .pipe(map(() => undefined));
  }

  private pagedReviews(url: string, page: number, size: number): Observable<Page<Review>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http
      .get<unknown>(url, { params, observe: 'response' })
      .pipe(
        map((response) =>
          toResponsePage(response, asList(response.body, 'reviews').map(toReview), page, size),
        ),
      );
  }

  private ratings(url: string, ids: string[]): Observable<Map<string, RatingSummary>> {
    if (!ids.length) return of(new Map());
    const params = new HttpParams({ fromObject: { ids } });
    return this.http.get<unknown>(url, { params }).pipe(
      map(
        (body) =>
          new Map(
            asList(body, 'ratings')
              .map(toRatedId)
              .map(({ id, average, total }) => [id, { average, total }] as const),
          ),
      ),
    );
  }
}
