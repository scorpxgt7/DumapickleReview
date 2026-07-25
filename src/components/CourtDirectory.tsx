/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Court, Review, UserProfile } from '../types';
import { INITIAL_COURTS } from '../data/courts';
import ReviewSubmission from './ReviewSubmission';
import CourtMap from './CourtMap';
import { 
  MapPin, SlidersHorizontal, Sparkles, Star, Sun, ShieldAlert,
  Compass, Check, Bookmark, ThumbsUp, Trash2, Calendar, Users, User as UserIcon, Share2, Map as MapIcon
} from 'lucide-react';

interface CourtDirectoryProps {
  currentUser: UserProfile | null;
  onSetHomeCourt: (courtId: string) => void;
  onShowConsentModal: () => void;
  externalSearchQuery?: string;
}

export default function CourtDirectory({ currentUser, onSetHomeCourt, onShowConsentModal, externalSearchQuery = "" }: CourtDirectoryProps) {
  // Cities list
  const cities: Array<"Dumaguete" | "Cebu City" | "Metro Manila"> = ["Dumaguete", "Cebu City", "Metro Manila"];
  
  // Selected City (Default is Dumaguete - Philippine Pickleball Capital!)
  const [selectedCity, setSelectedCity] = useState<"Dumaguete" | "Cebu City" | "Metro Manila">("Dumaguete");
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(INITIAL_COURTS[0]); // default selected is the main Dumaguete court
  
  // Filters state
  const [filterIndoor, setFilterIndoor] = useState<boolean | null>(null);
  const [filterFee, setFilterFee] = useState<"Free" | "Paid" | null>(null);
  const [filterLighting, setFilterLighting] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);

  // Synchronize external search query
  useEffect(() => {
    if (externalSearchQuery) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Filter and Search courts
  const filteredCourts = courts.filter(court => {
    if (court.city !== selectedCity) return false;
    if (filterIndoor !== null && court.indoor !== filterIndoor) return false;
    if (filterFee !== null && court.fee !== filterFee) return false;
    if (filterLighting !== null && court.lighting !== filterLighting) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return court.name.toLowerCase().includes(q) || court.address.toLowerCase().includes(q) || court.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Watch reviews for selected court
  useEffect(() => {
    if (!selectedCourt) return;
    setLoadingReviews(true);
    
    // Subscribe to Firestore Reviews under the selected court's sub-collection
    const q = collection(db, "courts", selectedCourt.id, "reviews");
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedReviews: Review[] = [];
      snapshot.forEach((doc) => {
        loadedReviews.push({ id: doc.id, ...doc.data() } as Review);
      });
      // Sort reviews newest first
      loadedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(loadedReviews);
      setLoadingReviews(false);
    }, (error) => {
      console.error("Firestore reviews subscription error: ", error);
      // Fallback to local mock storage if rules/connection are unavailable
      const localKey = `mock_reviews_${selectedCourt.id}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        setReviews(JSON.parse(saved));
      } else {
        setReviews([]);
      }
      setLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [selectedCourt]);

  // Handle Review delete (Multi-tenant ownership check)
  const handleDeleteReview = async (reviewId: string, reviewUserId: string) => {
    if (!currentUser || !selectedCourt) return;
    if (currentUser.uid !== reviewUserId) {
      alert("Multi-tenant security violation: You do not own this review and cannot delete it!");
      return;
    }

    if (confirm("Are you sure you want to delete your review? This is compliant with your DPA Right to Erasure.")) {
      try {
        if (reviewId.startsWith("local_")) {
          // Local fallback deletion
          const localKey = `mock_reviews_${selectedCourt.id}`;
          const updated = reviews.filter(r => r.id !== reviewId);
          localStorage.setItem(localKey, JSON.stringify(updated));
          setReviews(updated);
        } else {
          // Firestore deletion
          await deleteDoc(doc(db, "courts", selectedCourt.id, "reviews", reviewId));
        }
      } catch (err) {
        console.error("Failed to delete from Firestore: ", err);
        // Clean from current list
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    }
  };

  const handleShareCourt = async () => {
    if (!selectedCourt) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DUMA PICKLE - ${selectedCourt.name}`,
          text: `Check out ${selectedCourt.name} pickleball court: ${selectedCourt.description}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert('Web Share API is not supported in your browser.');
    }
  };

  // Switch city and auto-select its first court
  const handleCityChange = (city: "Dumaguete" | "Cebu City" | "Metro Manila") => {
    setSelectedCity(city);
    const firstOfNewCity = courts.find(c => c.city === city);
    if (firstOfNewCity) {
      setSelectedCourt(firstOfNewCity);
    } else {
      setSelectedCourt(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="court-directory-section">
      {/* LEFT: Search, Filters & Directory (7 Columns) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* City Hub Selection & Quick Stats */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 animate-spin-slow" /> Active Hub Selector
              </span>
              <h2 className="text-xl font-display font-bold">Pickleball Philippine Directory</h2>
            </div>
            
            {/* Hub Switchers */}
            <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
              {cities.map(city => (
                <button
                  key={city}
                  id={`hub-tab-${city.toLowerCase().replace(" ", "-")}`}
                  onClick={() => handleCityChange(city)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCity === city 
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Dumaguete Banner */}
          {selectedCity === "Dumaguete" && (
            <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-display font-black text-center leading-none text-xs">
                OFFICIAL<br/>CAPITAL
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-300">Dumaguete: The Unofficial Pickleball Capital</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Home to the country&apos;s biggest dedicated pickleball sports arena and the highest density of active public courts in the Philippines!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Search & Sliders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              id="court-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courts by name, address, dinks..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-4 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
            />
          </div>

          <div className="flex gap-2">
            <button
              id="toggle-map-btn"
              onClick={() => setShowMap(!showMap)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                showMap
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                  : 'border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> {showMap ? 'Hide Map' : 'Show Map'}
            </button>

            <button
              id="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                showFilters 
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>

            {(filterIndoor !== null || filterFee !== null || filterLighting !== null) && (
              <button
                id="clear-filters-btn"
                onClick={() => {
                  setFilterIndoor(null);
                  setFilterFee(null);
                  setFilterLighting(null);
                }}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 border border-rose-100 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Interactive Google Map Component */}
        {showMap && (
          <div className="animate-fade-in" id="court-google-maps-container">
            <CourtMap
              courts={filteredCourts}
              selectedCourt={selectedCourt}
              onSelectCourt={setSelectedCourt}
            />
          </div>
        )}

        {/* Expanded Filters Drawer */}
        {showFilters && (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-fade-in" id="expanded-filters-drawer">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Filter Coordinates</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Indoor Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Facility Style</label>
                <div className="flex bg-white p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setFilterIndoor(null)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${filterIndoor === null ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterIndoor(true)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${filterIndoor === true ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    Indoor
                  </button>
                  <button
                    onClick={() => setFilterIndoor(false)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${filterIndoor === false ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    Outdoor
                  </button>
                </div>
              </div>

              {/* Fee Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Pricing Model</label>
                <div className="flex bg-white p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setFilterFee(null)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${filterFee === null ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterFee("Free")}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${filterFee === "Free" ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setFilterFee("Paid")}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${filterFee === "Paid" ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    Paid
                  </button>
                </div>
              </div>

              {/* Lighting Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Night Lighting</label>
                <div className="flex bg-white p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setFilterLighting(null)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${filterLighting === null ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterLighting(true)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${filterLighting === true ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    Equipped
                  </button>
                  <button
                    onClick={() => setFilterLighting(false)}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg ${filterLighting === false ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    None
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Directory List of Courts */}
        <div className="space-y-4 h-[55vh] overflow-y-auto pr-2" id="court-list-container">
          {filteredCourts.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-2">
              <Compass className="w-10 h-10 text-slate-400 mx-auto" />
              <h5 className="font-bold text-slate-800">No Courts Match Your Filters</h5>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Try clearing search terms or selecting another Active Hub above.</p>
            </div>
          ) : (
            filteredCourts.map(court => {
              const isSelected = selectedCourt?.id === court.id;
              const isHomeCourt = currentUser?.homeCourtId === court.id;

              return (
                <div
                  key={court.id}
                  id={`court-card-${court.id}`}
                  onClick={() => setSelectedCourt(court)}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col sm:flex-row gap-5 ${
                    isSelected 
                      ? 'bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-500' 
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-slate-100 relative shrink-0">
                    <img
                      src={court.image}
                      alt={court.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {court.isPremium && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold tracking-wide px-2 py-1 rounded">
                        Sponsored
                      </span>
                    )}
                  </div>

                  {/* Info Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-bold text-slate-900 text-lg md:text-xl leading-tight">
                          {court.name}
                        </h3>
                      </div>
                      
                      {/* Trustpilot-style rating */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center">
                          {[1,2,3,4,5].map((star) => (
                            <div key={star} className={`w-6 h-6 flex items-center justify-center rounded-sm mr-0.5 ${star <= court.rating ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                              <Star className="w-4 h-4 fill-white text-white" />
                            </div>
                          ))}
                        </div>
                        <span className="text-sm text-slate-600 font-medium">
                          TrustScore <strong className="text-slate-900">{court.rating}</strong>
                        </span>
                        <span className="text-xs text-slate-500 ml-1">
                          | {court.reviewCount} reviews
                        </span>
                      </div>
                      
                      <p className="text-slate-500 text-sm flex items-center gap-1 mt-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{court.address}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded">
                        {court.indoor ? "Indoor" : "Outdoor"}
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-1 rounded">
                        {court.fee}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Review Details Panel (5 Columns) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Selected Court Details & Multi-Dimensional Review System */}
        {selectedCourt ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors duration-300" id="court-details-panel">
            {/* Header cover image */}
            <div className="h-32 bg-slate-100 dark:bg-slate-900 relative">
              <img
                src={selectedCourt.image}
                alt={selectedCourt.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent flex flex-col justify-end p-5">
                <h3 className="font-display font-black text-white text-xl md:text-2xl leading-tight">
                  {selectedCourt.name}
                </h3>
              </div>
            </div>

            {/* Quick Actions (Home Court button) */}
            <div className="px-5 py-4 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center">
                  {[1,2,3,4,5].map((star) => (
                    <div key={star} className={`w-5 h-5 flex items-center justify-center rounded-sm mr-0.5 ${star <= selectedCourt.rating ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                      <Star className="w-3 h-3 fill-white text-white" />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedCourt.rating}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">({selectedCourt.reviewCount} reviews)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareCourt}
                  className="py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                  title="Share this court"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <button
                  id="set-homecourt-btn"
                  onClick={() => onSetHomeCourt(selectedCourt.id)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentUser?.homeCourtId === selectedCourt.id
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100'
                      : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${currentUser?.homeCourtId === selectedCourt.id ? 'fill-emerald-800 dark:fill-emerald-100' : ''}`} />
                  {currentUser?.homeCourtId === selectedCourt.id ? 'My Home Court' : 'Set as Home Court'}
                </button>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="p-5 space-y-6 text-slate-700 dark:text-slate-300">
              <div className="space-y-1">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {selectedCourt.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedCourt.amenities.map(amenity => (
                    <span key={amenity} className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-md">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Multi-Dimensional Ratings breakdown */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-500" /> Score Breakdown
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Court Quality</span>
                      <span className="font-bold text-slate-800">4.8/5</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '96%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Night Lighting</span>
                      <span className="font-bold text-slate-800">4.5/5</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Parking/Access</span>
                      <span className="font-bold text-slate-800">4.2/5</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">Crowd Management</span>
                      <span className="font-bold text-slate-800">4.0/5</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit a New Review Form */}
              <ReviewSubmission 
                selectedCourt={selectedCourt} 
                currentUser={currentUser} 
                onShowConsentModal={onShowConsentModal} 
                onSuccess={(mockRecord) => {
                  if (mockRecord) {
                    setReviews(prev => [mockRecord, ...prev]);
                  }
                }} 
              />

              {/* Reviews Feed List */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-lg font-display font-bold text-slate-900">
                  Reviews
                </h4>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2" id="reviews-feed">
                  {loadingReviews ? (
                    <p className="text-sm text-slate-500 text-center py-8">Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">No reviews yet. Be the first to share your experience!</p>
                  ) : (
                    reviews.map(review => {
                      const isOwner = currentUser?.uid === review.userId;
                      return (
                        <div key={review.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 relative group">
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                                {review.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-slate-900">{review.userName}</h5>
                                <p className="text-xs text-slate-500">
                                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Multi-tenant secure delete option */}
                            {isOwner && (
                              <button
                                onClick={() => handleDeleteReview(review.id, review.userId)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Review"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {/* Overall star rating */}
                          <div className="flex items-center gap-1 mt-1">
                            {[1,2,3,4,5].map((star) => (
                              <div key={star} className={`w-4 h-4 flex items-center justify-center rounded-sm mr-0.5 ${star <= review.overallRating ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                <Star className="w-2.5 h-2.5 fill-white text-white" />
                              </div>
                            ))}
                          </div>

                          <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            "{review.comment}"
                          </p>

                          {/* Detail sub-ratings micro layout */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 pt-2">
                            <span>Quality: <strong>{review.ratingCourtQuality}/5</strong></span>
                            <span>Lights: <strong>{review.ratingLighting}/5</strong></span>
                            <span>Parking: <strong>{review.ratingParking}/5</strong></span>
                            <span>Crowd: <strong>{review.ratingCrowding}/5</strong></span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <MapPin className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium">Select a court from the list to view its reviews and metrics</p>
          </div>
        )}
      </div>
    </div>
  );
}
