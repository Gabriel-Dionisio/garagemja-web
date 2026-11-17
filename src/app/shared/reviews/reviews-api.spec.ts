import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReviewsApi, toPublicProfile, toRatedId, toReportItem, toReview } from './reviews-api';

const review = {
  id: 'v1',
  rentalId: 'r1',
  authorUserId: 'u1',
  direction: 'RENTER_TO_SPOT',
  rating: 5,
  comment: null,
  createdAt: '2026-11-15T10:00:00Z',
};
const item = {
  report: {
    id: 'p1',
    reviewId: 'v1',
    reason: 'FALSE',
    details: 'no',
    status: 'OPEN',
    resolutionNote: null,
    createdAt: '2026-11-15T10:00:00Z',
  },
  reviewRating: 2,
  reviewComment: 'meh',
  reviewStatus: 'VISIBLE',
  parkingSpotId: 's1',
  parkingSpotNumber: 'A-12',
  condominiumName: 'Solar',
};

describe('ReviewsApi', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    return { api: TestBed.inject(ReviewsApi), http: TestBed.inject(HttpTestingController) };
  }

  it('maps reviews and rejects malformed ones', () => {
    expect(toReview(review).rating).toBe(5);
    expect(() => toReview({ ...review, direction: 'X' })).toThrow();
    expect(() => toReview({ ...review, rating: 'a' })).toThrow();
  });

  it('maps report items and rejects unknown reasons', () => {
    expect(toReportItem(item)).toMatchObject({
      reviewRating: 2,
      parkingSpotNumber: 'A-12',
      condominiumName: 'Solar',
    });
    expect(toReportItem({ ...item, parkingSpotNumber: undefined }).parkingSpotNumber).toBeNull();
    expect(() => toReportItem({ ...item, report: { ...item.report, reason: 'X' } })).toThrow();
  });

  it('maps rated ids and profiles', () => {
    expect(toRatedId({ id: 's1', average: 4.5, total: 2 })).toEqual({
      id: 's1',
      average: 4.5,
      total: 2,
    });
    const profile = toPublicProfile({
      id: 'u1',
      displayName: 'Ana S.',
      photoUrl: null,
      memberSince: '2026-01-01T00:00:00Z',
      asHost: { average: 0, total: 0 },
      asRenter: { average: 4, total: 1 },
      spots: [{ id: 's1', number: '12', condominiumName: null, covered: true, dailyPrice: 30 }],
    });
    expect(profile.spots[0].covered).toBe(true);
    expect(() => toPublicProfile({ id: 'u1' })).toThrow();
  });

  it('sends the review without an empty comment', () => {
    const { api, http } = setup();
    api.create('r1', 4, '').subscribe();
    const request = http.expectOne('/api/v1/rentals/r1/reviews');
    expect(request.request.body).toEqual({ rating: 4, comment: null });
    request.flush(review);
  });

  it('skips the request for an empty id list', () => {
    const { api, http } = setup();
    let size = -1;
    api.spotRatings([]).subscribe((ratings) => (size = ratings.size));
    http.expectNone((r) => r.url.includes('ratings'));
    expect(size).toBe(0);
  });

  it('asks which rentals can still be reviewed and skips an empty list', () => {
    const { api, http } = setup();
    let pending: Set<string> | undefined;
    api.pendingReviews(['a', 'b']).subscribe((ids) => (pending = ids));
    const request = http.expectOne((r) => r.url === '/api/v1/reviews/pending');
    expect(request.request.params.getAll('rentalIds')).toEqual(['a', 'b']);
    request.flush(['a']);
    expect([...pending!]).toEqual(['a']);
    api.pendingReviews([]).subscribe();
    http.expectNone((r) => r.url.includes('pending'));
  });

  it('pages report queue with status filter and total', () => {
    const { api, http } = setup();
    let total: number | undefined;
    api.reports('OPEN', 0, 20).subscribe((page) => (total = page.total));
    const request = http.expectOne((r) => r.url === '/api/v1/review-reports');
    expect(request.request.params.get('status')).toBe('OPEN');
    request.flush([item], { headers: { 'X-Total-Count': '1' } });
    expect(total).toBe(1);
  });
});
