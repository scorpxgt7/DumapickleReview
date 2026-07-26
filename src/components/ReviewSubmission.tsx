import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Review, UserProfile, Court } from '../types';
import {
  Star, User as UserIcon, ShieldAlert, Camera, Image as ImageIcon,
  X, RefreshCw, Check, Sparkles, FlipHorizontal, Eye
} from 'lucide-react';
import VerifiedReviewerBadge from './VerifiedReviewerBadge';
import VerifiedReviewerUnlockedModal from './VerifiedReviewerUnlockedModal';
import { recordUserCourtReview } from '../lib/reviewerUtils';

interface ReviewSubmissionProps {
  selectedCourt: Court;
  currentUser: UserProfile | null;
  onShowConsentModal: () => void;
  onSuccess?: (mockRecord?: Review) => void;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 focus:outline-none transition-colors ${
              star <= value
                ? 'text-amber-400'
                : 'text-slate-200 dark:text-slate-600 hover:text-amber-200 dark:hover:text-amber-400/50'
            }`}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Utility to compress image to base64 JPEG data URL for lightweight storage
function compressImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function ReviewSubmission({
  selectedCourt,
  currentUser,
  onShowConsentModal,
  onSuccess
}: ReviewSubmissionProps) {
  const [newComment, setNewComment] = useState("");
  const [rateQuality, setRateQuality] = useState(5);
  const [rateLighting, setRateLighting] = useState(5);
  const [rateParking, setRateParking] = useState(5);
  const [rateCrowding, setRateCrowding] = useState(5);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reviewError, setReviewError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [processingPhotos, setProcessingPhotos] = useState(false);

  // Live Camera Modal states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start live camera stream
  const startCameraStream = async (mode: 'environment' | 'user') => {
    setCameraError("");
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera stream initialization error:", err);
      setCameraError(
        "Could not access live camera. You can still use the standard device camera picker below."
      );
    }
  };

  useEffect(() => {
    if (showCameraModal) {
      startCameraStream(facingMode);
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
    }
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCameraModal, facingMode]);

  // Capture frame from live camera modal
  const capturePhotoFromLiveStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth, 800);
    canvas.height = Math.min(
      video.videoHeight,
      Math.round((video.videoHeight * 800) / video.videoWidth)
    );

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhotos((prev) => [...prev, dataUrl]);
    }
  };

  // Handle files selected from camera input or gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessingPhotos(true);
    const newCompressedPhotos: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i]);
        newCompressedPhotos.push(compressed);
      }
      setPhotos((prev) => [...prev, ...newCompressedPhotos]);
    } catch (err) {
      console.error("Error processing court photo:", err);
      setReviewError("Failed to process selected photos. Please try again.");
    } finally {
      setProcessingPhotos(false);
      if (e.target) e.target.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const [showUnlockedModal, setShowUnlockedModal] = useState(false);
  const [unlockedCourtCount, setUnlockedCourtCount] = useState(0);

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
      photos: photos.length > 0 ? photos : undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, "courts", selectedCourt.id, "reviews"), newReview);
      
      const { uniqueCourtsCount, isNewlyVerified } = recordUserCourtReview(currentUser.uid, selectedCourt.id, currentUser);
      if (isNewlyVerified) {
        setUnlockedCourtCount(uniqueCourtsCount);
        setShowUnlockedModal(true);
      }

      setNewComment("");
      setPhotos([]);
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

      const { uniqueCourtsCount, isNewlyVerified } = recordUserCourtReview(currentUser.uid, selectedCourt.id, currentUser);
      if (isNewlyVerified) {
        setUnlockedCourtCount(uniqueCourtsCount);
        setShowUnlockedModal(true);
      }

      setNewComment("");
      setPhotos([]);
      if (onSuccess) onSuccess(mockRecord);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-4">
      {/* Unlocked Modal */}
      <VerifiedReviewerUnlockedModal
        isOpen={showUnlockedModal}
        onClose={() => setShowUnlockedModal(false)}
        currentUser={currentUser}
        uniqueCourtCount={unlockedCourtCount}
      />

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Write a review
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share your experience and photos with the community
            </p>
          </div>
        </div>

        {currentUser && (
          <VerifiedReviewerBadge profile={currentUser} size="sm" showProgress={true} />
        )}
      </div>

      <form
        onSubmit={handleSubmitReview}
        className="space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm"
      >
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
            placeholder="Tell us about your experience... (e.g. court traction, net height, lighting, surface condition)"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 h-28 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Camera & Photo Upload Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-500" />
              Court Photos ({photos.length})
            </span>

            <div className="flex items-center gap-2">
              {/* Take Photo with Camera */}
              <button
                type="button"
                onClick={() => {
                  // Try direct mobile camera input first or open stream modal
                  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    setShowCameraModal(true);
                  } else {
                    cameraInputRef.current?.click();
                  }
                }}
                className="py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Camera Photo</span>
              </button>

              {/* Upload from Gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-1.5 transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Gallery Upload</span>
              </button>
            </div>
          </div>

          {/* Processing Indicator */}
          {processingPhotos && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 py-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing & compressing photos...
            </div>
          )}

          {/* Photos Thumbnails Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
              {photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
                >
                  <img
                    src={photo}
                    alt={`Court capture ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover Overlay Actions */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLightboxPhoto(photo)}
                      className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                      title="View Full Size"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="p-1.5 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                      title="Remove Photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {reviewError && (
          <p
            className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 p-3 rounded-xl flex items-center gap-2 border border-rose-100 dark:border-rose-800"
            id="review-error-msg"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" /> {reviewError}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="submit-review-btn"
            disabled={submittingReview || processingPhotos}
            className="bg-emerald-600 text-white font-bold text-sm px-8 py-3 rounded-full hover:bg-emerald-500 disabled:bg-slate-400 transition-colors shadow-sm hover:shadow active:scale-[0.98] flex items-center gap-2"
          >
            {submittingReview ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Post Review"
            )}
          </button>
        </div>
      </form>

      {/* LIVE CAMERA VIEWFINDER MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Camera Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-bold text-sm">Court Camera</h3>
              </div>
              <button
                onClick={() => setShowCameraModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder Canvas / Video Feed */}
            <div className="relative bg-black aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-rose-400 space-y-3">
                  <ShieldAlert className="w-8 h-8 mx-auto" />
                  <p className="text-xs">{cameraError}</p>
                  <button
                    onClick={() => {
                      setShowCameraModal(false);
                      cameraInputRef.current?.click();
                    }}
                    className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl hover:bg-emerald-500"
                  >
                    Use Native Camera Picker
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Camera Controls Footer */}
            <div className="p-5 bg-slate-900 flex items-center justify-around gap-4 border-t border-slate-800">
              {/* Flip camera facing mode */}
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="p-3 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                title="Switch Camera (Front / Back)"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={() => {
                  capturePhotoFromLiveStream();
                }}
                disabled={Boolean(cameraError)}
                className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center border-4 border-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-lg font-bold disabled:opacity-50"
                title="Take Photo"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              {/* Done / Close Button */}
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="py-2 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500"
              >
                Done ({photos.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FULLSCREEN PHOTO MODAL */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh]">
            <img
              src={lightboxPhoto}
              alt="Enlarged review photo"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
