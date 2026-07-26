/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  homeCourtId: string | null;
  skillLevel: string;
  playerRatingId?: string;
  createdAt: string;
  dpaConsent: boolean;
  dpaConsentDate: string;
  reviewedCourtIds?: string[];
  isVerifiedReviewer?: boolean;
}

export interface Court {
  id: string;
  name: string;
  city: "Dumaguete" | "Cebu City" | "Metro Manila";
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  indoor: boolean;
  fee: "Free" | "Paid";
  lighting: boolean;
  amenities: string[];
  description: string;
  image: string;
  rating: number;
  reviewCount: number;
  isPremium?: boolean;
  status?: 'approved' | 'pending';
  submittedBy?: string;
  submittedByUid?: string;
  createdAt?: string;
}

export interface Review {
  id: string;
  courtId: string;
  userId: string; // Multi-tenant key
  userName: string;
  userEmail: string;
  ratingCourtQuality: number; // 1-5
  ratingLighting: number; // 1-5
  ratingParking: number; // 1-5
  ratingCrowding: number; // 1-5
  overallRating: number; // calculated
  comment: string;
  photos?: string[];
  createdAt: string;
  isVerifiedReviewer?: boolean;
}

export interface Paddle {
  id: string;
  name: string;
  brand: string;
  pricePhp: number;
  twistWeight: number; // 1-10
  durability: number; // 1-10
  power: number; // 1-10
  control: number; // 1-10
  spin: number; // 1-10
  balancePoint: "Head Heavy" | "Even" | "Head Light";
  description: string;
  affiliateLink: string;
  image: string;
  category?: "paddle" | "edge-guard" | "lead-tape" | "eraser" | "cover" | "accessory";
}

export interface PlayEvent {
  id: string;
  courtId: string;
  courtName: string;
  organizerId: string;
  organizerName: string;
  dateTime: string;
  skillLevelTarget: string;
  maxPlayers: number;
  joinedPlayerIds: string[];
  joinedPlayerNames: string[];
  description: string;
}

export interface Article {
  id?: string;
  title: string;
  category: "Community" | "Tutorial" | "Privacy & Tech" | "Tournament" | "Pro Tactics" | string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  tag: string;
  status?: 'published' | 'draft';
  featured?: boolean;
  views?: number;
  createdAt?: string;
}

