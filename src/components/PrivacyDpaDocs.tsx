/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PrivacyDpaDocsProps {
  onClose?: () => void;
  showToS?: boolean;
}

export default function PrivacyDpaDocs({ onClose, showToS = false }: PrivacyDpaDocsProps) {
  return (
    <div className="bg-white p-6 rounded-2xl max-h-[80vh] overflow-y-auto text-slate-800 font-sans space-y-6 text-sm leading-relaxed" id="dpa-docs-container">
      {showToS ? (
        <>
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-display font-bold text-2xl text-slate-900">Terms of Service</h2>
            <p className="text-xs text-slate-500 mt-1">Effective Date: July 15, 2026</p>
          </div>

          <div className="space-y-4">
            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">1. Acceptance of Terms</h3>
              <p>
                By accessing, browsing, or utilizing the Duma Pickleball Platform (dumapicklecourtfinder.online), 
                you acknowledge that you have read, understood, and agree to be bound by these Terms of Service 
                and all applicable laws in the Republic of the Philippines.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">2. Scope of Services</h3>
              <p>
                We provide a community-oriented portal to browse court directories, post interactive court and equipment reviews, 
                interact in play matchmaking, and access local community event details. Commercial operations or facility listings 
                are subject to separate premium service arrangements.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">3. User Conduct & Content Separation</h3>
              <p>
                You retain ownership of any reviews or profiles you author on the site. However, you guarantee that all content 
                is factual, respects copyright laws, and does not contain defamatory or abusive language. To support strict 
                multi-tenant isolation, user accounts must only access their own respective data and review modification capabilities.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">4. Disclaimers of Liability</h3>
              <p>
                Court listings, playing conditions, and crowd status metrics are community-sourced and provided for informational 
                purposes only. We do not assume responsibility for physical hazards, accidents, scheduling conflicts, or reservation 
                disputes occurring at any listed physical court facility.
              </p>
            </section>
          </div>
        </>
      ) : (
        <>
          <div className="border-b border-slate-100 pb-4">
            <h2 className="font-display font-bold text-2xl text-slate-900">Data Privacy Policy</h2>
            <p className="text-xs text-slate-500 mt-1">In compliance with the Philippine Data Privacy Act of 2012 (R.A. 10173)</p>
          </div>

          <div className="space-y-4">
            <section className="bg-emerald-50 text-emerald-900 p-3 rounded-lg text-xs">
              <strong>Data Privacy Commitment:</strong> We are committed to safeguarding your personal data in accordance with the 
              rules set forth by the National Privacy Commission (NPC) of the Philippines. Your data is strictly isolated to prevent multi-tenant cross-contamination.
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">1. Personal Information We Collect</h3>
              <p>To provide community reviews, home court preferences, and interactive matchmaking, we collect:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Identity Credentials:</strong> Full name, email address, profile picture (via Google authentication).</li>
                <li><strong>Sports Profile:</strong> Preferred skill level, player rating ID, home court assignments.</li>
                <li><strong>User-Generated Content:</strong> Custom ratings (court quality, lighting, parking, crowding) and textual reviews.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">2. Purpose of Collection & Processing</h3>
              <p>Your information is stored securely in Firebase Firestore and processed purely to:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Create and personalize your community profile.</li>
                <li>Attribute court reviews to actual verified players (curbing spam/fake rating profiles).</li>
                <li>Coordinate localized sports matchmaking games (connecting you with similarly skilled players).</li>
                <li>Ensure proper multi-tenant isolation so no other user can alter your personal records or reviews.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">3. Your Rights as a Data Subject</h3>
              <p>Under Chapter IV of R.A. 10173, you retain powerful rights over your information:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Right to be Informed:</strong> Knowing whether your personal data is being processed (satisfied by this policy).</li>
                <li><strong>Right to Access & Portability:</strong> You can download a complete structured JSON copy of all personal data we store on you.</li>
                <li><strong>Right to Rectification:</strong> You can update your profile information or edit your reviews at any time.</li>
                <li><strong>Right to Erasure (Blocking/Deletion):</strong> You can permanently delete your user profile and all associated reviews with a single click.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-base mb-2">4. Storage, Security, & Retention</h3>
              <p>
                All information is securely routed through encrypted channels (HTTPS) and hosted on enterprise-grade Google Cloud Platform (GCP) 
                infrastructure via Firebase. We enforce multi-tenant separation rules which authenticate each write request. 
                Data is kept as long as your account is active, or until you exercise your right to erasure.
              </p>
            </section>

            <section className="border-t border-slate-100 pt-4 text-xs text-slate-500">
              For any questions regarding your DPA 2012 rights or processing details, contact our designated Data Protection Officer (DPO) at 
              <span className="text-emerald-600 ml-1 font-semibold">dpo@dumapicklecourtfinder.online</span>.
            </section>
          </div>
        </>
      )}

      {onClose && (
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button 
            id="close-docs-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Close Document
          </button>
        </div>
      )}
    </div>
  );
}
