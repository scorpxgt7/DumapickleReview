/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Court } from '../types';

export const INITIAL_COURTS: Court[] = [
  {
    id: "duma-sports-center",
    name: "Dumaguete Pickleball & Sports Arena",
    city: "Dumaguete",
    address: "Valencia Road, Dumaguete City, Negros Oriental (Near Silliman Farm)",
    coordinates: { lat: 9.3090, lng: 123.2933 },
    indoor: true,
    fee: "Paid",
    lighting: true,
    amenities: ["Parking", "Showers", "Pro Shop", "Equipment Rental", "Restrooms", "Canteen", "Coaching Staff"],
    description: "The newly opened, absolute largest dedicated pickleball court facility in the Philippines. Features 12 state-of-the-art cushioned courts, high-end LED illumination, and international standards. Unofficially cementing Dumaguete as the Pickleball Capital of the Philippines.",
    image: "https://upload.wikimedia.org/wikipedia/commons/3/39/Outdoor_pickleball_courts.jpg",
    rating: 0,
    reviewCount: 0,
    isPremium: true
  },
  {
    id: "duma-boulevard-courts",
    name: "Rizal Boulevard Community Court",
    city: "Dumaguete",
    address: "Rizal Boulevard (Seafront Area), Dumaguete City, Negros Oriental",
    coordinates: { lat: 9.3072, lng: 123.3115 },
    indoor: false,
    fee: "Free",
    lighting: true,
    amenities: ["Restrooms", "Spectator Benches", "Food Vendors Nearby"],
    description: "A lively seafront court open to the public. Perfect for morning play or breezy evening matches under high-quality floodlights. A popular gathering spot for Dumaguete's tight-knit local pickleball family.",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/71/Pickleball_court_in_La_Crosse%2C_Wisconsin_01.jpg",
    rating: 0,
    reviewCount: 0
  },
  {
    id: "duma-silliman-court",
    name: "Silliman University Activity Courts",
    city: "Dumaguete",
    address: "Silliman University Campus, Dumaguete City, Negros Oriental",
    coordinates: { lat: 9.3120, lng: 123.3075 },
    indoor: false,
    fee: "Free",
    lighting: false,
    amenities: ["Parking", "Restrooms", "Drinking Fountain"],
    description: "Outdoor university recreational courts. Excellent student-friendly vibe, available for open play during afternoons and weekends. Home court to the Silliman Pickleball Club.",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Parc_des_Moissons%2C_terrains_de_pickleball.jpg",
    rating: 0,
    reviewCount: 0
  },
  {
    id: "cebu-banilad-hub",
    name: "Cebu Pickleball Hub (Banilad)",
    city: "Cebu City",
    address: "A.S. Fortuna St, Banilad, Cebu City, Cebu",
    coordinates: { lat: 10.3421, lng: 123.9165 },
    indoor: true,
    fee: "Paid",
    lighting: true,
    amenities: ["Parking", "Showers", "Pro Shop", "Restrooms", "Air Conditioning Lobby"],
    description: "Premium indoor venue catering to players in Metro Cebu. Well-maintained courts, active training leagues, and regular beginner clinics.",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e8/20251212_pickleball_pitch_poliforum_playa_del_carmen.jpg",
    rating: 0,
    reviewCount: 0,
    isPremium: true
  },
  {
    id: "manila-bgc-courts",
    name: "BGC Arena Outdoor Courts",
    city: "Metro Manila",
    address: "9th Avenue, Bonifacio Global City, Taguig, Metro Manila",
    coordinates: { lat: 14.5492, lng: 121.0478 },
    indoor: false,
    fee: "Paid",
    lighting: true,
    amenities: ["Parking", "Restrooms", "Equipment Rental", "Lounge Area"],
    description: "High-octane urban pickleball center in the heart of Bonifacio Global City. Known for professional players, competitive matching events, and prime location.",
    image: "https://upload.wikimedia.org/wikipedia/commons/b/bc/Parc_Edmour-J.-Harvey%2C_terrains_de_pickleball.jpg",
    rating: 0,
    reviewCount: 0,
    isPremium: true
  }
];
