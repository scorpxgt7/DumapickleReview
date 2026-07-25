/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID provisioned for this applet
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard auth triggers
export { signInWithPopup, fbSignOut };

export interface FirestoreErrorInfo {
  error_code: "PERMISSIONS_DENIED" | "DATA_INTEGRITY_VIOLATION" | "AUTH_EXPIRED" | "UNKNOWN";
  operation: "create" | "update" | "delete" | "list" | "get" | "write";
  path: string;
  payload: any;
  user_id: string | null;
  dpa_consent_active: boolean;
  message: string;
}

export function handleFirestoreError(
  err: any,
  operation: "create" | "update" | "delete" | "list" | "get" | "write",
  path: string,
  payload: any,
  userId: string | null,
  dpaConsentActive: boolean
): never {
  const isPermissionDenied = err.code === 'permission-denied' || err.message?.toLowerCase().includes('permission');
  const errorInfo: FirestoreErrorInfo = {
    error_code: isPermissionDenied ? "PERMISSIONS_DENIED" : "UNKNOWN",
    operation,
    path,
    payload,
    user_id: userId,
    dpa_consent_active: dpaConsentActive,
    message: err.message || String(err)
  };
  throw new Error(JSON.stringify(errorInfo));
}
