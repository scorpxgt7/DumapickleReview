/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Court, Review, UserProfile } from '../types';
import { INITIAL_COURTS } from '../data/courts';
import ReviewSubmission from './ReviewSubmission';
import CourtMap from './CourtMap';
import WeatherWidget from './WeatherWidget';
import SocialShareModal from './SocialShareModal';
import AddCourtModal from './AddCourtModal';
import VerifiedReviewerBadge from './VerifiedReviewerBadge';
import { ToastContainer, ToastMessage } from './Toast';
import { 
  MapPin, SlidersHorizontal, Sparkles, Star, Sun, ShieldAlert,
  Compass, Check, Bookmark, ThumbsUp, Trash2, Calendar, Users, User as UserIcon, Share2, Map as MapIcon, Camera, X,
  List, Layers, Grid, Plus
} from 'lucide-react';

interface CourtDirectoryProps {
  currentUser: UserProfile | null;
  onSetHomeCourt: (courtId: string) => void;
  onShowConsentModal: () => void;
  externalSearchQuery?: string;
}

export default function CourtDirectory({ currentUser, onSetHomeCourt, onShowConsentModal, externalSearchQuery = "" }: CourtDirectoryProps) {
  // Cities & Regions list
  const cities: string[] = [
    "Dumaguete",
    "Negros Oriental",
    "Metro Manila & Luzon",
    "Visayas & Mindanao",
    "International"
  ];
  
  // Selected City (Default is Dumaguete - Philippine Pickleball Capital!)
  const [selectedCity, setSelectedCity] = useState<string>("Dumaguete");
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(INITIAL_COURTS[0]); // default selected is the main Dumaguete court
  const [showAddCourtModal, setShowAddCourtModal] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Subscribe to submitted courts from Firestore & Local Storage
  useEffect(() => {
    const q = collection(db, "courts");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedSubmitted: Court[] = [];
      snapshot.forEach(docSnap => {
        loadedSubmitted.push({ id: docSnap.id, ...docSnap.data() } as Court);
      });

      // Merge with local storage submitted courts
      const savedLocal = localStorage.getItem("mock_submitted_courts");
      if (savedLocal) {
        try {
          const localList: Court[] = JSON.parse(savedLocal);
          localList.forEach(lc => {
            if (!loadedSubmitted.some(c => c.id === lc.id)) {
              loadedSubmitted.push(lc);
            }
          });
        } catch (e) {}
      }

      // Merge with base INITIAL_COURTS
      const combined = [...INITIAL_COURTS];
      loadedSubmitted.forEach(sc => {
        if (!combined.some(c => c.id === sc.id)) {
          combined.push(sc);
        }
      });

      setCourts(combined);
    }, (err) => {
      console.warn("Firestore courts subscription error, loading local fallback:", err);
      const savedLocal = localStorage.getItem("mock_submitted_courts");
      if (savedLocal) {
        try {
          const localList: Court[] = JSON.parse(savedLocal);
          const combined = [...INITIAL_COURTS];
          localList.forEach(lc => {
            if (!combined.some(c => c.id === lc.id)) {
              combined.push(lc);
            }
          });
          setCourts(combined);
        } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);
  
  // View mode state: 'split' | 'list' | 'map'
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');

  // Filters state
  const [filterIndoor, setFilterIndoor] = useState<boolean | null>(null);
  const [filterFee, setFilterFee] = useState<"Free" | "Paid" | null>(null);
  const [filterLighting, setFilterLighting] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(true);

  // Social Share modal state
  const [shareData, setShareData] = useState<{
    isOpen: boolean;
    title: string;
    text: string;
    url: string;
  }>({
    isOpen: false,
    title: '',
    text: '',
    url: ''
  });

  // Synchronize external search query
  useEffect(() => {
    if (externalSearchQuery) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Deep-link support for direct court URL sharing (?court=court_id)
  useEffect(() => {
    if (courts.length === 0) return;
    const urlParams = new URLSearchParams(window.location.search);
    const courtIdParam = urlParams.get('court');
    if (courtIdParam) {
      const targetCourt = courts.find(c => c.id === courtIdParam);
      if (targetCourt) {
        setSelectedCity(targetCourt.city);
        setSelectedCourt(targetCourt);
        setTimeout(() => {
          const cardEl = document.getElementById(`court-card-${targetCourt.id}`) || document.getElementById('court-details-panel');
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  }, [courts]);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Dynamic Score Breakdown calculations
  const totalReviews = reviews.length;
  const calcAvg = (key: 'ratingCourtQuality' | 'ratingLighting' | 'ratingParking' | 'ratingCrowding' | 'overallRating') => {
    if (totalReviews === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + (r[key] || 5), 0);
    return Number((sum / totalReviews).toFixed(1));
  };

  const avgCourtQuality = calcAvg('ratingCourtQuality');
  const avgLighting = calcAvg('ratingLighting');
  const avgParking = calcAvg('ratingParking');
  const avgCrowding = calcAvg('ratingCrowding');
  const avgOverall = calcAvg('overallRating');

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

  const handleOpenShare = (court: Court, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const deepUrl = `${window.location.origin}${window.location.pathname}?court=${encodeURIComponent(court.id)}`;
    const ratingStr = court.rating > 0 ? `★${court.rating}` : 'New';
    
    setShareData({
      isOpen: true,
      title: `📍 Pickleball Court: ${court.name}`,
      text: `${court.name} in ${court.city} (${court.address}). Facility: ${court.indoor ? 'Indoor' : 'Outdoor'} • Fee: ${court.fee} • Community Score: ${ratingStr}. Check court details, active community reviews & playing schedules!`,
      url: deepUrl,
    });
  };

  const handleShareCourt = () => {
    if (!selectedCourt) return;
    handleOpenShare(selectedCourt);
  };

  // Switch city and auto-select its first court
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    const firstOfNewCity = courts.find(c => c.city === city);
    if (firstOfNewCity) {
      setSelectedCourt(firstOfNewCity);
    } else {
      setSelectedCourt(null);
    }
  };

  const getCityLabel = (cityKey: string) => {
    switch (cityKey) {
      case "Dumaguete": return "Dumaguete City";
      case "Negros Oriental": return "Negros Oriental Municipalities";
      case "Metro Manila & Luzon": return "Metro Manila & Luzon";
      case "Visayas & Mindanao": return "Visayas & Mindanao";
      case "International": return "International";
      default: return cityKey;
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
            <div className="flex flex-wrap gap-1 bg-slate-800 p-1.5 rounded-2xl w-full">
              {cities.map(city => (
                <button
                  key={city}
                  id={`hub-tab-${city.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                  onClick={() => handleCityChange(city)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-1 min-w-[120px] text-center ${
                    selectedCity === city 
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10 font-bold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {getCityLabel(city)}
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

        {/* Search, View Modes & Filters */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-3 shadow-sm">
          <div className="relative flex-1">
            <input
              type="text"
              id="court-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courts by name, address, dinks..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-4 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                id="view-mode-split-btn"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'split'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Split List & Map View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                id="view-mode-list-btn"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="List View Only"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                id="view-mode-map-btn"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'map'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Leaflet Map View Only"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>

            <button
              id="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showFilters 
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>

            <button
              id="add-court-btn"
              onClick={() => setShowAddCourtModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Submit Court
            </button>

            {(filterIndoor !== null || filterFee !== null || filterLighting !== null) && (
              <button
                id="clear-filters-btn"
                onClick={() => {
                  setFilterIndoor(null);
                  setFilterFee(null);
                  setFilterLighting(null);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 border border-rose-100 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Leaflet Map Container (Shown in 'map' or 'split' view) */}
        <AnimatePresence mode="wait">
          {(viewMode === 'map' || viewMode === 'split') && (
            <motion.div
              key="court-map-view"
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              id="court-google-maps-container"
            >
              <CourtMap
                courts={filteredCourts}
                selectedCourt={selectedCourt}
                onSelectCourt={setSelectedCourt}
              />
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Directory List of Courts (Shown in 'list' or 'split' view) */}
        <AnimatePresence mode="wait">
          {(viewMode === 'list' || viewMode === 'split') && (
            <motion.div
              key="court-list-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 max-h-[55vh] overflow-y-auto pr-2"
              id="court-list-container"
            >
              {filteredCourts.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center space-y-2">
                  <Compass className="w-10 h-10 text-slate-400 mx-auto" />
                  <h5 className="font-bold text-slate-800 dark:text-slate-200">No Courts Match Your Filters</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Try clearing search terms or selecting another Active Hub above.</p>
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
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-md'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 relative shrink-0">
                        <img
                          src={court.image}
                          alt={court.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {court.isPremium && (
                          <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold tracking-wide px-2 py-1 rounded shadow-sm">
                            Sponsored
                          </span>
                        )}
                      </div>

                      {/* Info Details */}
                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg md:text-xl leading-tight">
                              {court.name}
                            </h3>
                          </div>
                          
                          {/* Trustpilot-style rating */}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center">
                              {[1,2,3,4,5].map((star) => (
                                <div key={star} className={`w-5 h-5 flex items-center justify-center rounded-sm mr-0.5 ${star <= court.rating ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                  <Star className="w-3 h-3 fill-white text-white" />
                                </div>
                              ))}
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                              TrustScore <strong className="text-slate-900 dark:text-white">{court.rating}</strong>
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              | {court.reviewCount} reviews
                            </span>
                          </div>
                          
                          <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{court.address}</span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              {court.indoor ? "Indoor" : "Outdoor"}
                            </span>
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              {court.fee}
                            </span>
                          </div>

                          {/* Social Share Button */}
                          <button
                            onClick={(e) => handleOpenShare(court, e)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-slate-300 text-[11px] font-bold transition-all flex items-center gap-1"
                            title="Share Court to Social Media"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: Review Details Panel (5 Columns) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Weather Forecast & Playability Assessment Widget */}
        <WeatherWidget
          selectedCity={selectedCity}
          selectedCourt={selectedCourt}
          onSelectIndoorFilter={() => {
            setFilterIndoor(true);
            setShowFilters(true);
          }}
        />

        {/* Selected Court Details & Multi-Dimensional Review System */}
        {selectedCourt ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-colors duration-300" id="court-details-panel">
            {/* Header cover image */}
            <div className="h-36 bg-slate-100 dark:bg-slate-900 relative group overflow-hidden">
              <img
                src={selectedCourt.image}
                alt={selectedCourt.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setLightboxPhoto(selectedCourt.image)}
                    className="p-2 rounded-full bg-slate-900/70 text-white backdrop-blur-md hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-lg"
                    title="View Full Court Photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Photo</span>
                  </button>
                </div>
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
                  onClick={() => {
                    onSetHomeCourt(selectedCourt.id);
                    addToast({
                      title: "Home Court Set",
                      description: `"${selectedCourt.name}" is now saved as your home court.`,
                      type: "success"
                    });
                  }}
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
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-500" /> Community Score Breakdown
                </h4>
                
                {totalReviews === 0 ? (
                  <p className="text-xs text-slate-500 italic">No reviews submitted yet. Submit a review below to rate court quality, lighting, and access!</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Court Surface Quality</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{avgCourtQuality}/5</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(avgCourtQuality / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Night Lighting</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{avgLighting}/5</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(avgLighting / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Parking / Access</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{avgParking}/5</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(avgParking / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Crowd & Queue Times</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{avgCrowding}/5</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(avgCrowding / 5) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
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
                  addToast({
                    title: "Review Submitted",
                    description: `Your rating and review for "${selectedCourt.name}" have been published.`,
                    type: "success"
                  });
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-sm font-bold text-slate-900">{review.userName}</h5>
                                  <VerifiedReviewerBadge userId={review.userId} size="xs" />
                                </div>
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

                          {/* Player Attached Court Photos */}
                          {review.photos && review.photos.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <Camera className="w-3 h-3 text-emerald-600" />
                                Court Photos ({review.photos.length})
                              </span>
                              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                {review.photos.map((pUrl, pIdx) => (
                                  <button
                                    key={pIdx}
                                    onClick={() => setLightboxPhoto(pUrl)}
                                    className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity shadow-sm group/photo"
                                  >
                                    <img
                                      src={pUrl}
                                      alt={`Court photo ${pIdx + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 group-hover/photo:bg-transparent transition-colors" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Detail sub-ratings micro layout */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
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

      {/* Review Photo Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh]">
            <img
              src={lightboxPhoto}
              alt="Enlarged review court photo"
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      {/* Social Media Share Modal */}
      <SocialShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData(prev => ({ ...prev, isOpen: false }))}
        title={shareData.title}
        text={shareData.text}
        url={shareData.url}
        category="Pickleball Court Directory"
      />

      {/* Add Court Modal */}
      <AddCourtModal
        isOpen={showAddCourtModal}
        onClose={() => setShowAddCourtModal(false)}
        currentUser={currentUser}
        onCourtSubmitted={(newCourt) => {
          setSelectedCourt(newCourt);
          addToast({
            title: "Court Added Successfully",
            description: `"${newCourt.name}" has been added and saved to the directory.`,
            type: "success"
          });
        }}
      />

      {/* Subtle Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
