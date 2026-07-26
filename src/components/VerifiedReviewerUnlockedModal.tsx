import React from 'react';
import { Award, Sparkles, X, Check, ShieldCheck, Share2 } from 'lucide-react';
import VerifiedReviewerBadge from './VerifiedReviewerBadge';
import { UserProfile } from '../types';

interface VerifiedReviewerUnlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  uniqueCourtCount: number;
}

export default function VerifiedReviewerUnlockedModal({
  isOpen,
  onClose,
  currentUser,
  uniqueCourtCount,
}: VerifiedReviewerUnlockedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="relative bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 text-white text-center space-y-6 shadow-2xl overflow-hidden">
        {/* Animated Background glow effects */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none animate-pulse delay-700" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Big Trophy / Shield Icon Animation */}
        <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-emerald-400 animate-pulse" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-7 h-7 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
            Achievement Unlocked!
          </span>
          <h3 className="font-display font-black text-2xl text-white">
            You're Now a Verified Reviewer!
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            Congratulations <span className="text-emerald-400 font-bold">{currentUser?.displayName || 'Player'}</span>! By sharing authentic reviews across <strong className="text-white">{uniqueCourtCount} unique courts</strong>, you have earned the official <strong className="text-emerald-400">Verified Reviewer Badge</strong>!
          </p>
        </div>

        {/* Badge Preview Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Your Official Profile Badge</span>
          <VerifiedReviewerBadge profile={currentUser} size="lg" showText={true} />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Awesome, Show Off My Badge!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
