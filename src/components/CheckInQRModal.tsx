/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, Download, Copy, Check, ShieldCheck, MapPin, Sparkles, Building2, Smartphone } from 'lucide-react';
import { Court } from '../types';

interface CheckInQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  court: Court | null;
  onAddToast?: (toast: { type: 'success' | 'info' | 'error'; title: string; message: string }) => void;
}

export default function CheckInQRModal({
  isOpen,
  onClose,
  court,
  onAddToast,
}: CheckInQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  if (!isOpen || !court) return null;

  const checkInPayload = JSON.stringify({
    app: 'DumaguetePickleballHub',
    type: 'COURT_CHECK_IN',
    courtId: court.id,
    courtName: court.name,
    city: court.city,
    timestamp: new Date().toISOString(),
    checkInCode: `CHECKIN-${court.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const checkInUrl = `${window.location.origin}/#checkin?courtId=${court.id}&code=${court.id.toUpperCase()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    if (onAddToast) {
      onAddToast({
        type: 'success',
        title: 'Check-in Link Copied!',
        message: `Shareable QR check-in link for ${court.name} saved to clipboard.`
      });
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateCheckIn = () => {
    setCheckedIn(true);
    if (onAddToast) {
      onAddToast({
        type: 'success',
        title: 'Arrived at Court!',
        message: `Successfully verified check-in at ${court.name} (${court.city}). Have a great match!`
      });
    }
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById('court-checkin-qr-svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 300, 300);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${court.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-checkin-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();

      if (onAddToast) {
        onAddToast({
          type: 'info',
          title: 'QR Code Downloaded',
          message: `Saved QR code image for ${court.name} to your device.`
        });
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden"
          id="checkin-qr-modal"
        >
          {/* Header background subtle gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Title & Court Details */}
          <div className="text-center space-y-1.5 mb-6 pr-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200/80 dark:border-emerald-800/80 mb-1">
              <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Court Arrival Check-In
            </div>
            <h3 className="text-xl font-bold font-display text-slate-900 dark:text-slate-100 tracking-tight">
              {court.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              {court.city} • {court.indoor ? 'Indoor Court' : 'Outdoor Court'} • {court.fee}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-inner relative">
            <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center relative">
              <QRCodeSVG
                id="court-checkin-qr-svg"
                value={checkInPayload}
                size={180}
                level="H"
                includeMargin={false}
                fgColor="#0f172a"
              />
              {/* Center Pickleball icon badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-9 h-9 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                CODE: CHECKIN-{court.id.toUpperCase()}
              </span>
              <p className="text-[12px] text-slate-600 dark:text-slate-300 font-medium">
                Scan with any smartphone camera at the court desk to check in.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700/80 active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied Link' : 'Copy Check-in Link'}
              </button>
            </div>

            {/* Quick arrival test trigger */}
            {!checkedIn ? (
              <button
                type="button"
                onClick={handleSimulateCheckIn}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                Simulate Instant Check-in
              </button>
            ) : (
              <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Checked in at {court.name}!
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
