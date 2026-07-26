import { UserProfile } from '../types';

/**
 * Utility functions for tracking user court reviews and Verified Reviewer badge status.
 * A user becomes a "Verified Reviewer" when they have submitted reviews for 2 or more unique courts.
 */

export function getUserReviewedCourtIds(userId: string, profile?: UserProfile | null): string[] {
  if (!userId) return [];
  const uniqueCourts = new Set<string>();

  // 1. Check profile.reviewedCourtIds if available
  if (profile && Array.isArray(profile.reviewedCourtIds)) {
    profile.reviewedCourtIds.forEach(id => uniqueCourts.add(id));
  }

  // 2. Check local user_reviewed_courts_${userId}
  try {
    const saved = localStorage.getItem(`user_reviewed_courts_${userId}`);
    if (saved) {
      const parsed: string[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach(id => uniqueCourts.add(id));
      }
    }
  } catch (err) {
    // ignore parsing errors
  }

  // 3. Scan all mock_reviews_* entries in localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mock_reviews_')) {
        const courtIdFromKey = key.replace('mock_reviews_', '');
        const val = localStorage.getItem(key);
        if (val) {
          const reviews = JSON.parse(val);
          if (Array.isArray(reviews)) {
            reviews.forEach((r: any) => {
              if (
                (r.userId === userId || (profile?.email && r.userEmail === profile.email)) &&
                (r.courtId || courtIdFromKey)
              ) {
                uniqueCourts.add(r.courtId || courtIdFromKey);
              }
            });
          }
        }
      }
    }
  } catch (err) {
    // ignore
  }

  return Array.from(uniqueCourts);
}

export function getUniqueCourtCount(userId: string, profile?: UserProfile | null): number {
  if (!userId && !profile) return 0;
  const uid = userId || profile?.uid || '';
  return getUserReviewedCourtIds(uid, profile).length;
}

export function isUserVerifiedReviewer(userId: string, profile?: UserProfile | null): boolean {
  if (profile?.isVerifiedReviewer) return true;
  return getUniqueCourtCount(userId, profile) >= 2;
}

export function recordUserCourtReview(
  userId: string, 
  courtId: string, 
  profile?: UserProfile | null
): { uniqueCourtsCount: number; isNewlyVerified: boolean; isVerified: boolean } {
  if (!userId || !courtId) {
    return { uniqueCourtsCount: 0, isNewlyVerified: false, isVerified: false };
  }

  const existingCourts = getUserReviewedCourtIds(userId, profile);
  const beforeCount = existingCourts.length;

  const set = new Set(existingCourts);
  set.add(courtId);
  const updatedCourts = Array.from(set);
  const afterCount = updatedCourts.length;

  try {
    localStorage.setItem(`user_reviewed_courts_${userId}`, JSON.stringify(updatedCourts));
  } catch (err) {
    console.warn("Failed to persist user reviewed courts:", err);
  }

  const isNewlyVerified = beforeCount < 2 && afterCount >= 2;
  const isVerified = afterCount >= 2;

  return {
    uniqueCourtsCount: afterCount,
    isNewlyVerified,
    isVerified
  };
}
