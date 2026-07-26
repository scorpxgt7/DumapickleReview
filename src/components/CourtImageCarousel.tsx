/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

interface CourtImageCarouselProps {
  images?: string[];
  fallbackImage: string;
  courtName: string;
  isPremium?: boolean;
  indoor?: boolean;
  fee?: string;
  className?: string;
}

export default function CourtImageCarousel({
  images,
  fallbackImage,
  courtName,
  isPremium,
  indoor,
  fee,
  className = ''
}: CourtImageCarouselProps) {
  const imageList = images && images.length > 0 ? images : [fallbackImage];
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden group bg-slate-900 border border-slate-200/60 dark:border-slate-800 ${className}`}
      id="court-image-carousel"
    >
      {/* Current Active Image */}
      <img
        src={imageList[currentIndex]}
        alt={`${courtName} photo ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackImage;
        }}
      />

      {/* Subtle Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isPremium && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3" /> Premium
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${indoor ? 'bg-sky-500 text-white' : 'bg-amber-500/90 text-slate-950'}`}>
            {indoor ? 'Indoor' : 'Outdoor'}
          </span>
        </div>

        <span className="px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-mono font-bold backdrop-blur-md border border-white/20 flex items-center gap-1">
          <Camera className="w-3 h-3 text-emerald-400" />
          {currentIndex + 1}/{imageList.length}
        </span>
      </div>

      {/* Carousel Navigation Arrows (Visible on Hover or Touch) */}
      {imageList.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-emerald-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"
            aria-label="Previous court photo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/70 hover:bg-emerald-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"
            aria-label="Next court photo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Bottom Indicator Dots */}
      {imageList.length > 1 && (
        <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
          {imageList.map((_, idx) => (
            <button
              key={`carousel-dot-${idx}`}
              onClick={(e) => handleDotClick(idx, e)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex
                  ? 'w-5 bg-emerald-400 shadow-md'
                  : 'w-1.5 bg-white/60 hover:bg-white'
              }`}
              aria-label={`Go to photo ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
