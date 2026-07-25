import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Review, UserProfile, Court } from '../types';
import { Star, User as UserIcon, ShieldAlert } from 'lucide-react';

interface ReviewSubmissionProps {
  selectedCourt: Court;
  currentUser: UserProfile | null;
  onShowConsentModal: () => void;
  onSuccess?: (mockRecord?: Review) => void;
}

function StarRating({ value, onChange, label }: { value: number, onChange: (val: number) => void, label: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 focus:outline-none transition-colors ${star <= value ? 'text-amber-400' : 'text-slate-200 dark:text-slate-600 hover:text-amber-200 dark:hover:text-amber-400/50'}`}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewSubmission({ selectedCourt, currentUser, onShowConsentModal, onSuccess }: ReviewSubmissionProps) {
  const [newComment, setNewComment] = useState("");
  const [rateQuality, setRateQuality] = useState(5);
  const [rateLighting, setRateLighting] = useState(5);
  const [rateParking, setRateParking] = useState(5);
  const [rateCrowding, setRateCrowding] = useState(5);
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setReviewError("Please register/login and agree to data processing to write reviews.");
      onShowConsentModal();
      return;
    }

    if (!currentUser.dpaConsent) {
      setReviewError("You must agree to the Data Privacy Act (DPA) policy first.");
      onShowConsentModal();
      return;
    }

    if (!newComment.trim()) {
      setReviewError("Please enter your feedback comment.");
      return;
    }

    setReviewError("");
    setSubmittingReview(true);

    const overallRating = parseFloat(
      ((rateQuality + rateLighting + rateParking + rateCrowding) / 4).toFixed(1)
    );

    const newReview: Omit<Review, 'id'> = {
      courtId: selectedCourt.id,
      userId: currentUser.uid,
      userName: currentUser.displayName || "Anonymous Player",
      userEmail: currentUser.email,
      ratingCourtQuality: rateQuality,
      ratingLighting: rateLighting,
      ratingParking: rateParking,
      ratingCrowding: rateCrowding,
      overallRating: overallRating,
      comment: newComment,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "courts", selectedCourt.id, "reviews"), newReview);
      setNewComment("");
      setRateQuality(5);
      setRateLighting(5);
      setRateParking(5);
      setRateCrowding(5);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.warn("Failed to write to Firestore, storing in local fallback: ", err);
      const localKey = `mock_reviews_${selectedCourt.id}`;
      const existing = localStorage.getItem(localKey);
      const currentMockList: Review[] = existing ? JSON.parse(existing) : [];
      const mockRecord: Review = {
        id: `local_${Date.now()}`,
        ...newReview
      };
      const updatedList = [mockRecord, ...currentMockList];
      localStorage.setItem(localKey, JSON.stringify(updatedList));
      setNewComment("");
      if (onSuccess) onSuccess(mockRecord);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Write a review
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Share your experience with the community</p>
        </div>
      </div>

      <form onSubmit={handleSubmitReview} className="space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
        {/* Rating selection matrix */}
        <div className="grid grid-cols-2 gap-6">
          <StarRating value={rateQuality} onChange={setRateQuality} label="Court Quality" />
          <StarRating value={rateLighting} onChange={setRateLighting} label="Lighting" />
          <StarRating value={rateParking} onChange={setRateParking} label="Parking" />
          <StarRating value={rateCrowding} onChange={setRateCrowding} label="Crowd Mgmt" />
        </div>

        {/* Feedback Textarea */}
        <div className="space-y-1 pt-2">
          <textarea
            id="review-comment-textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tell us about your experience... (e.g. great lighting, surface is slippery, etc.)"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 h-28 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {reviewError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl flex items-center gap-2 border border-rose-100 dark:border-rose-800" id="review-error-msg">
            <ShieldAlert className="w-4 h-4" /> {reviewError}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="submit-review-btn"
            disabled={submittingReview}
            className="bg-emerald-600 text-white font-bold text-sm px-8 py-3 rounded-full hover:bg-emerald-500 disabled:bg-slate-400 transition-colors shadow-sm hover:shadow active:scale-[0.98]"
          >
            {submittingReview ? "Submitting..." : "Post Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
