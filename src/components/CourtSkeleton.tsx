/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export function CourtCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 animate-pulse flex flex-col sm:flex-row gap-5">
      {/* Thumbnail Skeleton */}
      <div className="w-full sm:w-48 h-32 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0 relative overflow-hidden" />

      {/* Content Skeleton */}
      <div className="flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-2/3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-2/5" />
          </div>
          <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>

        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-4/5" />

        <div className="flex flex-wrap gap-2 pt-1">
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/50">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-32" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-md w-24" />
        </div>
      </div>
    </div>
  );
}

export function CourtListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 max-h-[55vh] overflow-hidden pr-2" id="court-skeleton-container" aria-label="Loading court directory results">
      {Array.from({ length: count }).map((_, idx) => (
        <CourtCardSkeleton key={`court-skeleton-${idx}`} />
      ))}
    </div>
  );
}
