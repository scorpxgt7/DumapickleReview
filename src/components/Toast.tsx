/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'info' | 'error';
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-3rem)] pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void; key?: string }) {
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, duration, onDismiss]);

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
      layout
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl backdrop-blur-xl border text-slate-900 dark:text-slate-100 ${
        isSuccess
          ? 'bg-emerald-950/90 dark:bg-slate-900/95 border-emerald-500/40 text-emerald-50 shadow-emerald-950/20'
          : isError
          ? 'bg-rose-950/90 dark:bg-slate-900/95 border-rose-500/40 text-rose-50'
          : 'bg-slate-900/90 dark:bg-slate-900/95 border-slate-700/60 text-slate-100'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mt-0.5 flex-shrink-0">
        {isSuccess ? (
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        ) : isError ? (
          <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <AlertCircle className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
            <Info className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <h5 className="text-xs font-bold leading-snug tracking-wide">
          {toast.title}
        </h5>
        {toast.description && (
          <p className="text-[11px] text-slate-300 dark:text-slate-300 font-medium leading-relaxed mt-0.5">
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
