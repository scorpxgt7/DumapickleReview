/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ChevronRight, FileText } from 'lucide-react';
import PrivacyDpaDocs from './PrivacyDpaDocs';

interface DpaNoticeProps {
  onConsent: () => void;
  onDecline: () => void;
}

export default function DpaNotice({ onConsent, onDecline }: DpaNoticeProps) {
  const [showDocs, setShowDocs] = useState<"privacy" | "tos" | null>(null);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="dpa-notice-modal">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all">
        {showDocs ? (
          <div className="p-4">
            <PrivacyDpaDocs 
              showToS={showDocs === 'tos'} 
              onClose={() => setShowDocs(null)} 
            />
          </div>
        ) : (
          <div className="p-6 md:p-8 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="inline-block text-[10px] font-bold tracking-widest text-emerald-600 uppercase">
                Republic of the Philippines • RA 10173
              </span>
              <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                Data Privacy & Consent Agreement
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Welcome to the **Duma Pickleball Platform** (dumapicklecourtfinder.online). In compliance with the 
                <strong> Philippine Data Privacy Act of 2012 (DPA)</strong>, we require your active consent to collect 
                and securely process your sports profile, email, DUPR parameters, and user-submitted reviews.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
              <div 
                id="view-privacy-btn"
                onClick={() => setShowDocs('privacy')}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white cursor-pointer hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-xs font-semibold text-slate-700">Read Data Privacy Policy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div 
                id="view-tos-btn"
                onClick={() => setShowDocs('tos')}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white cursor-pointer hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-xs font-semibold text-slate-700">Read Terms of Service</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="text-xs text-slate-500 leading-relaxed border-l-2 border-emerald-500 pl-3">
              By clicking <strong>&quot;Agree & Consent&quot;</strong>, you authorize the secure collection, multi-tenant 
              isolation, and storage of your profile data. You retain full rights to access, export, or permanently erase 
              your data at any time from your Profile menu.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                id="decline-consent-btn"
                onClick={onDecline}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Decline
              </button>
              <button
                id="agree-consent-btn"
                onClick={onConsent}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 shadow-lg shadow-slate-950/10 transition-colors"
              >
                Agree & Consent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
