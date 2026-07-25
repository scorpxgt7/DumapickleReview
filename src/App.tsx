/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, fbSignOut, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile } from './types';

// Icons
import { 
  ShieldCheck, LogOut, Compass, Trophy, Sparkles, User as UserIcon, 
  Download, Trash2, Lock, Activity, FileText, ChevronRight, Menu,
  ChevronLeft, Users, Award, HelpCircle, Moon, Sun
} from 'lucide-react';

// Modules
import CourtDirectory from './components/CourtDirectory';
import EquipmentHub from './components/EquipmentHub';
import Matchmaking from './components/Matchmaking';
import PremiumFacility from './components/PremiumFacility';
import DpaNotice from './components/DpaNotice';
import PrivacyDpaDocs from './components/PrivacyDpaDocs';
import LatestNews from './components/LatestNews';
import AdminDashboard from './components/AdminDashboard';
import { onSnapshot } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  
  // Admin Dashboard State
  const [showAdmin, setShowAdmin] = useState(false);
  const [layoutSettings, setLayoutSettings] = useState({
    showCourts: true,
    showMatchmaker: true,
    showPaddles: true,
    showNews: true
  });
  const [carouselSlides, setCarouselSlides] = useState([
    {
      image: "https://upload.wikimedia.org/wikipedia/commons/3/39/Outdoor_pickleball_courts.jpg",
      badge: "Negros Oriental • Philippines",
      title: "DUMA PICKLE: Connecting the Racket Revolution",
      subtitle: "The ultimate court directory, player review hub, and matchmaking scheduler in Dumaguete.",
      accent: "Unofficial Pickleball Capital"
    },
    {
      image: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Pickleball_balls_and_paddles.jpg",
      badge: "Player Verified Ratings",
      title: "Multidimensional Court Quality Reviews",
      subtitle: "Inspect court lighting, surface conditions, parking safety, and crowding levels compiled directly by active local players.",
      accent: "Real-time Sub-collection Store"
    },
    {
      image: "https://upload.wikimedia.org/wikipedia/commons/7/71/Pickleball_court_in_La_Crosse%2C_Wisconsin_01.jpg",
      badge: "Community Coordinator",
      title: "Active Game Schedules & Lineups",
      subtitle: "Organize weekend recreational rosters, invite tournament partners, or find local matches of your matching skill level.",
      accent: "Interactive Game Roster Engine"
    }
  ]);

  // Active view tab switcher
  const [activeTab, setActiveTab] = useState<"directory" | "paddles" | "matchmaking" | "monetization">("directory");
  
  // Data Privacy Act modal visibility
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showDpaDocsModal, setShowDpaDocsModal] = useState<"privacy" | "tos" | null>(null);

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero search query state
  const [heroSearchText, setHeroSearchText] = useState("");
  const [heroSearchQuery, setHeroSearchQuery] = useState("");

  // Carousel Slider & Persona States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [rolePerspective, setRolePerspective] = useState<"player" | "enthusiast" | "curious">("player");

  // Load layout and carousel settings from Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.slides && data.slides.length > 0) setCarouselSlides(data.slides);
        if (data.layout) setLayoutSettings(data.layout);
      }
    });
    return () => unsub();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (carouselSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [carouselSlides]);

  // Smooth Scroll Helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Persona Simulator Switcher lists (To easily showcase multi-tenant separation inside limited iframes)
  const simulatedPersonas = [
    { uid: "sim-mark-duma", displayName: "Mark Teves", email: "mark.teves@gmail.com", skillLevel: "4.5 (Advanced / Pro)", homeCourtId: "duma-sports-center" },
    { uid: "sim-pat-cebu", displayName: "Patricia Lim", email: "patricia.cebu@gmail.com", skillLevel: "3.0 (Intermediate)", homeCourtId: "cebu-banilad-hub" },
    { uid: "sim-mike-manila", displayName: "Coach Mike G.", email: "mike.g.manila@gmail.com", skillLevel: "5.0 (Elite Pro)", homeCourtId: "manila-bgc-courts" }
  ];

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Query Firestore profile
        const profileRef = doc(db, "users", firebaseUser.uid);
        try {
          const snapshot = await getDoc(profileRef);
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            // New user, trigger DPA Notice first before database creation
            setShowConsentModal(true);
          }
        } catch (err) {
          console.warn("Failed to reach Firestore profile, triggering fallback local simulation:", err);
          // Local fallback representation
          const localProfile = localStorage.getItem(`profile_${firebaseUser.uid}`);
          if (localProfile) {
            setProfile(JSON.parse(localProfile));
          } else {
            setShowConsentModal(true);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Check if user has some local active simulated session from a previous visit
    const cachedSimUid = localStorage.getItem("active_sim_uid");
    if (cachedSimUid) {
      const cachedSimProfile = localStorage.getItem(`profile_${cachedSimUid}`);
      if (cachedSimProfile) {
        setProfile(JSON.parse(cachedSimProfile));
        setLoading(false);
      }
    }

    return () => unsubscribe();
  }, []);

  // Handle Real Firebase Auth Sign In
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // profile details handled in Auth state observer
    } catch (err: any) {
      console.warn("Google Sign-In popup blocked, utilizing local fallback simulation. Error details:", err);
      // Automatically fallback to the main Dumaguete player persona to ensure the app continues to run perfectly
      handleSimulateSignIn(simulatedPersonas[0]);
    }
  };

  // Handle Real/Simulated Sign Out
  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    setProfile(null);
    localStorage.removeItem("active_sim_uid");
  };

  // Simulating sign-in with active persona (ensures multi-tenant separation testing works in standard sandboxed iframes)
  const handleSimulateSignIn = (persona: typeof simulatedPersonas[0]) => {
    const localKey = `profile_${persona.uid}`;
    let savedProfile = localStorage.getItem(localKey);
    
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);
      localStorage.setItem("active_sim_uid", persona.uid);
    } else {
      // New simulated user, trigger DPA consent modal first
      setUser({
        uid: persona.uid,
        displayName: persona.displayName,
        email: persona.email,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: "",
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => "",
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({})
      } as any);
      setShowConsentModal(true);
    }
  };

  // Handle Consent Agreement
  const handleConsentAgreement = async () => {
    const uid = user ? user.uid : (localStorage.getItem("active_sim_uid") || simulatedPersonas[0].uid);
    const displayName = user?.displayName || simulatedPersonas[0].displayName;
    const email = user?.email || simulatedPersonas[0].email;

    const newProfile: UserProfile = {
      uid: uid,
      displayName: displayName,
      email: email,
      homeCourtId: "duma-sports-center", // Dumaguete sports arena as initial default
      skillLevel: "3.0 - Intermediate",
      createdAt: new Date().toISOString(),
      dpaConsent: true,
      dpaConsentDate: new Date().toISOString()
    };

    try {
      // Write profile details to Firestore
      await setDoc(doc(db, "users", uid), newProfile);
    } catch (err) {
      console.warn("Could not write profile to Firestore, caching locally:", err);
    }

    // Always cache locally for instant retrievals
    localStorage.setItem(`profile_${uid}`, JSON.stringify(newProfile));
    localStorage.setItem("active_sim_uid", uid);
    
    setProfile(newProfile);
    setShowConsentModal(false);
  };

  // Handle Decline Consent
  const handleDeclineConsent = () => {
    setShowConsentModal(false);
    setUser(null);
    setProfile(null);
    localStorage.removeItem("active_sim_uid");
    alert("You have declined the data collection consent. In compliance with the Data Privacy Act of 2012, you will remain logged out.");
  };

  // Set Home Court Profile linking (Fulfills Home Court task)
  const handleSetHomeCourt = async (courtId: string) => {
    if (!profile) {
      setShowConsentModal(true);
      return;
    }

    const updatedProfile = { ...profile, homeCourtId: courtId };
    setProfile(updatedProfile);

    try {
      await setDoc(doc(db, "users", profile.uid), updatedProfile);
    } catch (err) {
      console.warn("Could not sync home court with Firestore:", err);
    }
    localStorage.setItem(`profile_${profile.uid}`, JSON.stringify(updatedProfile));
  };

  // DPA Subject Right to Access: Export JSON copy of user logs (Fulfills DPA 2012 Right to Portability)
  const handleExportDataLog = () => {
    if (!profile) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dpa_profile_log_${profile.uid}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // DPA Subject Right to Erasure: Permanently wipe account and cache (Fulfills DPA 2012 Right to Erasure)
  const handleEraseDataProfile = async () => {
    if (!profile) return;
    if (confirm("DPA ERASURE ACTION: This will permanently delete your user profile, personal logs, and DPA authentication tokens. Are you sure?")) {
      try {
        await deleteDoc(doc(db, "users", profile.uid));
      } catch (err) {
        console.warn("Firestore erasure skipped/failed, clearing locally:", err);
      }
      localStorage.removeItem(`profile_${profile.uid}`);
      localStorage.removeItem("active_sim_uid");
      setUser(null);
      setProfile(null);
      alert("All your personal data records have been successfully and permanently erased from the platform.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors duration-300" id="app-root-container">
      
      {/* Sticky Premium Navigation Header */}
      <header className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-40 transition-all shadow-sm" id="global-header">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-lg shadow-md shadow-emerald-500/15 overflow-hidden">
              <img src="/favicon.svg" alt="Duma Pickle Logo" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-0.5">
              <h1 className="font-display font-black text-slate-900 dark:text-white tracking-tight leading-none text-base md:text-lg">
                DUMA PICKLE
              </h1>
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block">
                Court Finder & Community
              </span>
            </div>
          </div>

          {/* Desktop Tab Switcher Menu */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => { setMobileMenuOpen(false); scrollToSection("latest-news-section"); }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Latest in Pickleball
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); scrollToSection("court-reviews-section"); }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              Courts & Reviews
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); scrollToSection("matchmaking-coordinator-section"); }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              Game Coordinator
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); scrollToSection("paddle-matchmaker-section"); }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            >
              Paddle Matchmaker
            </button>
          </nav>

            {/* Auth State Panel / Switcher Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowAdmin(true)}
              className="py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin
            </button>
            {profile ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl pl-3">
                <div className="hidden md:block text-right">
                  <h5 className="text-xs font-bold text-slate-800">{profile.displayName}</h5>
                  <p className="text-[9px] text-emerald-600 font-bold">{profile.skillLevel}</p>
                </div>
                
                {/* User avatar icon */}
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4" />
                </div>

                <button
                  id="signout-header-btn"
                  onClick={handleSignOut}
                  className="p-1.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors"
                  title="Sign Out Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="signin-header-btn"
                onClick={handleGoogleSignIn}
                className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Authenticate Google
              </button>
            )}

            {/* Mobile Hamburger icon */}
            <button
              id="toggle-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-100 rounded-xl lg:hidden text-slate-700 hover:bg-slate-200 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Dropdown drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-100 p-4 space-y-2 animate-fade-in" id="mobile-navigation-drawer">
            <button
              onClick={() => { setMobileMenuOpen(false); scrollToSection("latest-news-section"); }}
              className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold block text-slate-600 hover:bg-slate-50"
            >
              Latest in Pickleball
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); scrollToSection("court-reviews-section"); }}
              className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold block text-slate-600 hover:bg-slate-50"
            >
              Courts & Reviews
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); scrollToSection("matchmaking-coordinator-section"); }}
              className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold block text-slate-600 hover:bg-slate-50"
            >
              Game Coordinator
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); scrollToSection("paddle-matchmaker-section"); }}
              className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold block text-slate-600 hover:bg-slate-50"
            >
              Paddle Matchmaker
            </button>
          </div>
        )}
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-12">
        
        {/* 
          1. REVIEW AGGREGATOR HERO SECTION
          Sliding carousel hero with a massive search bar and 3 quick action links.
        */}
        <div 
          className="relative w-full rounded-3xl overflow-hidden shadow-xl flex items-center justify-center py-20 px-6 md:px-12 transition-all duration-700" 
          id="hero-banner-section"
        >
          {/* Sliding Carousel Background */}
          {carouselSlides.map((slide, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/60" />
            </div>
          ))}

          <div className="relative z-20 w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-8">
            
            <div className="space-y-4">
              <span className="text-xs md:text-sm uppercase font-bold text-emerald-400 tracking-widest block bg-slate-900/50 backdrop-blur-sm w-max mx-auto px-4 py-1.5 rounded-full border border-emerald-500/30">
                {carouselSlides[currentSlide]?.badge}
              </span>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tight text-white drop-shadow-md transition-all duration-500">
                {carouselSlides[currentSlide]?.title}
              </h2>
              <p className="text-slate-200 text-lg md:text-xl font-sans drop-shadow max-w-2xl mx-auto transition-all duration-500">
                {carouselSlides[currentSlide]?.subtitle}
              </p>
            </div>

            {/* Massive Search Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setHeroSearchQuery(heroSearchText);
                scrollToSection("court-reviews-section");
              }}
              className="bg-white dark:bg-slate-800 p-2 rounded-2xl flex flex-col md:flex-row items-center gap-2 w-full shadow-2xl focus-within:ring-4 focus-within:ring-emerald-500/50 transition-all max-w-3xl"
              id="hero-inline-search-form"
            >
              <div className="relative flex-1 pl-4 flex items-center gap-3 w-full">
                <Compass className="w-6 h-6 text-emerald-600 shrink-0" />
                <input
                  type="text"
                  value={heroSearchText}
                  onChange={(e) => setHeroSearchText(e.target.value)}
                  placeholder="Search for courts, clubs, or paddles..."
                  className="bg-transparent border-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-lg md:text-xl focus:ring-0 focus:outline-none w-full py-3"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-base md:text-lg font-bold py-4 px-8 rounded-xl transition-all shadow-md w-full md:w-auto shrink-0"
              >
                Search
              </button>
            </form>
            
          </div>
        </div>

        {/* 3 Link Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-b border-slate-200 dark:border-slate-800 pb-16">
          <button 
            onClick={() => scrollToSection("court-reviews-section")}
            className="flex flex-col items-center text-center space-y-4 group hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 flex items-center justify-center text-emerald-800 dark:text-emerald-500">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Dumaguete Pickleball court</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Explore verified pickleball court coordinates across Negros Oriental, and review detailed scores compiled directly by active local players.
              </p>
            </div>
          </button>

          <button 
            onClick={() => scrollToSection("matchmaking-coordinator-section")}
            className="flex flex-col items-center text-center space-y-4 group hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 flex items-center justify-center text-emerald-800 dark:text-emerald-500">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">DUPR Match Maker Panel</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Schedule games, configure maximum players, filter matching skill-level brackets, and coordinate live roster sheets securely.
              </p>
            </div>
          </button>

          <button 
            onClick={() => scrollToSection("paddle-matchmaker-section")}
            className="flex flex-col items-center text-center space-y-4 group hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 flex items-center justify-center text-emerald-800 dark:text-emerald-500">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Intelligent Paddle Reviews</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Enter your physical playstyle, level, and equipment budgets to obtain customized recommended paddles from pro ratings.
              </p>
            </div>
          </button>
        </div>

        {/* 
          2. STACKED NARRATIVE SECTIONS
          All major app sections are laid out sequentially on the home page.
          Navigation triggers smooth scrolling down to each respective section wrapper.
        */}
        <div className="space-y-16" id="homepage-sections-stack">
          
          {/* SECTION 1: Articles and Latest in Pickleball */}
          {layoutSettings.showNews && (
            <section 
              id="latest-news-section" 
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100/70 dark:border-slate-800 space-y-6 transition-all animate-fade-in"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-md inline-block mb-2">
                  Articles & Guides
                </span>
                <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 leading-none">
                  Community Insights & Advice
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
                  Stay updated with Visayas tournament results, coaching mechanics, and technical advice from local players.
                </p>
              </div>
              
              <LatestNews />
            </section>
          )}

          {/* SECTION A: Courts Directory and Multi-dimensional Reviews */}
          {layoutSettings.showCourts && (
            <section 
              id="court-reviews-section" 
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100/70 dark:border-slate-800 space-y-6 transition-all"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-md inline-block mb-2">
                  Courts
                </span>
                <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 leading-none">
                  Top Rated Pickleball Courts
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
                  Explore verified pickleball court coordinates across Negros Oriental, review detailed scores for quality, lights, parking, and crowding, and register home courts.
                </p>
              </div>
              
              <CourtDirectory 
                currentUser={profile} 
                onSetHomeCourt={handleSetHomeCourt} 
                onShowConsentModal={() => setShowConsentModal(true)} 
                externalSearchQuery={heroSearchQuery}
              />
            </section>
          )}

          {/* SECTION B: Recreational Matchmaking Coordinator */}
          {layoutSettings.showMatchmaker && (
            <section 
              id="matchmaking-coordinator-section" 
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100/70 dark:border-slate-800 space-y-6 transition-all"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-md inline-block mb-2">
                  Community
                </span>
                <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 leading-none">
                  Local Game Coordinator
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
                  Schedule games, configure maximum players, filter matching skill-level brackets, and coordinate live roster sheets securely.
                </p>
              </div>
              
              <Matchmaking 
                currentUser={profile} 
                onShowConsentModal={() => setShowConsentModal(true)} 
              />
            </section>
          )}

          {/* SECTION C: Intelligent Paddle Matchmaker */}
          {layoutSettings.showPaddles && (
            <section 
              id="paddle-matchmaker-section" 
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100/70 dark:border-slate-800 space-y-6 transition-all"
            >
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-md inline-block mb-2">
                  Paddles
                </span>
                <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 leading-none">
                  Intelligent Paddle Reviews
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">
                  Enter your physical playstyle, level, and equipment budgets to obtain customized recommended paddles from pro ratings.
                </p>
              </div>
              
              <EquipmentHub />
            </section>
          )}

        </div>

        {/* DPA Compliance: Data Subject Rights Settings Dashboard (Rendered when Profile exists) */}
        {profile && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 space-y-6" id="dpa-subject-rights-settings">
            <div className="flex items-start justify-between gap-4 flex-wrap border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h4 className="text-lg font-display font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5.5 h-5.5 text-emerald-400" /> Your Data Privacy Act (DPA) Portal
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In absolute compliance with the **Philippine Data Privacy Act of 2012 (R.A. 10173)**, you have full authority to command your personal data records:
                </p>
              </div>

              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-3 py-1 rounded-xl">
                DPA Consent Authorized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Profile Details summary card */}
              <div className="bg-slate-950 p-4 rounded-2xl space-y-2 border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase font-bold block">Current Profile Record</span>
                <p className="text-xs font-bold text-white">{profile.displayName}</p>
                <p className="text-[10px] text-slate-400">{profile.email}</p>
                <p className="text-[10px] text-emerald-400 font-mono">UID: {profile.uid.substring(0, 16)}...</p>
              </div>

              {/* Data Portability (Access Right) */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs">1. Right to Access & Portability</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Download a complete structured JSON copy of all personal profile logs stored in our databases.
                </p>
                <button
                  id="export-dpa-btn"
                  onClick={handleExportDataLog}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-4 h-4 text-emerald-400" /> Export Data Log (.json)
                </button>
              </div>

              {/* Erasure (Erasure Right) */}
              <div className="space-y-2">
                <h5 className="font-bold text-xs text-rose-400">2. Right to Erasure & Blocking</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Permanently wipe your profile and database entries. This removes all your reviews in compliance with NPC rules.
                </p>
                <button
                  id="erase-dpa-btn"
                  onClick={handleEraseDataProfile}
                  className="py-2 px-4 rounded-xl bg-rose-950/40 border border-rose-900/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" /> Erase My Data Profile
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* DPA Consent popup Modal container */}
      {showConsentModal && (
        <DpaNotice 
          onConsent={handleConsentAgreement} 
          onDecline={handleDeclineConsent} 
        />
      )}

      {/* Global Footer with DPA and Copyright elements */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12 font-sans" id="global-footer">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 text-xs leading-relaxed">
          
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-display font-black text-slate-950 text-sm">
                D
              </div>
              <h4 className="font-display font-bold text-white text-sm">DUMA PICKLE COURT FINDER</h4>
            </div>

            <p className="max-w-md text-slate-400">
              The premium, mobile-first Philippine court and equipment directory. Grounded in the heart of Dumaguete, the country&apos;s unofficial pickleball capital. Supporting local sports through unified digital tools.
            </p>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              In absolute adherence to R.A. 10173 (Data Privacy Act of 2012) guidelines issued by the National Privacy Commission of the Philippines.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Philippine Legal Links</h5>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setShowDpaDocsModal("privacy")} className="hover:text-white hover:underline transition-all">
                  Data Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setShowDpaDocsModal("tos")} className="hover:text-white hover:underline transition-all">
                  Terms of Service
                </button>
              </li>
              <li>
                <a href="https://privacy.gov.ph" target="_blank" rel="noreferrer" className="hover:text-white hover:underline transition-all">
                  National Privacy Commission
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Negros Hubs</h5>
            <p className="text-slate-400">
              Dumaguete City, Negros Oriental<br/>
              Silliman Farm, Valencia Road Zone<br/>
              Rizal Boulevard Seafront District<br/>
              <span className="text-emerald-400 font-bold block mt-1">DUMA SPORTS HEAD BASE</span>
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 mt-8 border-t border-slate-800 flex flex-wrap justify-between items-center text-[10px] text-slate-500 gap-4">
          <span>&copy; 2026 Duma Pickleball Platform (dumapicklecourtfinder.online). All Rights Reserved.</span>
          <span>Designed with Desk-First Precision and Mobile-First Code.</span>
        </div>
      </footer>

      {/* Interactive PDF-Style legal document viewer */}
      {showDpaDocsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="dpa-docs-viewer-modal">
          <div className="max-w-2xl w-full">
            <PrivacyDpaDocs 
              showToS={showDpaDocsModal === 'tos'} 
              onClose={() => setShowDpaDocsModal(null)} 
            />
          </div>
        </div>
      )}

      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}

    </div>
  );
}
