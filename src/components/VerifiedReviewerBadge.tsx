import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Award, CheckCircle2, Info } from 'lucide-react';
import { isUserVerifiedReviewer, getUniqueCourtCount } from '../lib/reviewerUtils';
import { UserProfile } from '../types';

interface VerifiedReviewerBadgeProps {
  userId?: string;
  profile?: UserProfile | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  showProgress?: boolean;
  className?: string;
}

export default function VerifiedReviewerBadge({
  userId,
  profile,
  size = 'sm',
  showText = true,
  showProgress = false,
  className = ''
}: VerifiedReviewerBadgeProps) {
  const uid = userId || profile?.uid || '';
  const isVerified = isUserVerifiedReviewer(uid, profile);
  const uniqueCount = getUniqueCourtCount(uid, profile);
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isVerified && !showProgress) {
    return null;
  }

  // Size variations
  const sizeClasses = {
    xs: {
      container: 'px-1.5 py-0.5 text-[9px] gap-1',
      icon: 'w-2.5 h-2.5',
    },
    sm: {
      container: 'px-2 py-0.5 text-[10px] gap-1',
      icon: 'w-3 h-3',
    },
    md: {
      container: 'px-2.5 py-1 text-xs gap-1.5',
      icon: 'w-3.5 h-3.5',
    },
    lg: {
      container: 'px-3 py-1.5 text-xs gap-2',
      icon: 'w-4 h-4',
    }
  }[size];

  if (isVerified) {
    return (
      <div className="relative inline-flex items-center">
        <div
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip(!showTooltip)}
          className={`relative inline-flex items-center font-extrabold rounded-full cursor-pointer select-none transition-all duration-300 shadow-sm ${sizeClasses.container} bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white hover:brightness-110 active:scale-95 ${className}`}
        >
          {/* Subtle glowing ring animation */}
          <span className="absolute -inset-0.5 rounded-full bg-emerald-400/40 blur-[2px] animate-pulse pointer-events-none" />

          {/* Badge Icon with spin/sparkle effect */}
          <div className="relative flex items-center justify-center">
            <ShieldCheck className={`${sizeClasses.icon} text-white drop-shadow-xs`} />
          </div>

          {showText && (
            <span className="relative tracking-tight font-bold flex items-center gap-0.5">
              Verified Reviewer
              <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
            </span>
          )}
        </div>

        {/* Hover / Tap Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 p-2.5 bg-slate-900/95 backdrop-blur-md text-white text-[11px] rounded-xl shadow-xl border border-emerald-500/30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Award className="w-3.5 h-3.5" />
              <span>Verified Reviewer Badge</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Earned by submitting authentic reviews for <strong className="text-white">{uniqueCount} unique courts</strong> in the directory!
            </p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
          </div>
        )}
      </div>
    );
  }

  // Unverified - Show progress if requested
  if (showProgress) {
    const remaining = Math.max(0, 2 - uniqueCount);
    return (
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer ${sizeClasses.container} ${className}`}
      >
        <CheckCircle2 className={`${sizeClasses.icon} text-slate-400`} />
        {showText && (
          <span>
            {uniqueCount}/2 Unique Courts Reviewed
          </span>
        )}

        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 p-2.5 bg-slate-900/95 backdrop-blur-md text-white text-[11px] rounded-xl shadow-xl border border-slate-700 space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Info className="w-3.5 h-3.5" />
              <span>Unlock Verified Badge</span>
            </div>
            <p className="text-slate-300 text-[10px] leading-relaxed">
              Review <strong className="text-emerald-400">{remaining} more unique court{remaining > 1 ? 's' : ''}</strong> to earn your official <strong className="text-emerald-400">Verified Reviewer Badge</strong>!
            </p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900/95" />
          </div>
        )}
      </div>
    );
  }

  return null;
}
