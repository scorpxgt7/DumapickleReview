/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Megaphone, Mail, CreditCard, Sparkles, Database,
  TrendingUp, Users, ArrowRight, Code, ShieldCheck, Check
} from 'lucide-react';

export default function PremiumFacility() {
  // Newsletter Form State
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");

  // Booking API Simulator State
  const [selectedCourtId, setSelectedCourtId] = useState("duma-sports-center");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("17:00");
  const [rentPrice, setRentPrice] = useState(600); // PHP per hour
  const [simulatedResponse, setSimulatedResponse] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // Facility Dashboard metrics
  const mockMetrics = [
    { label: "Profile Page Views", value: "2,480", change: "+18.4% vs last week" },
    { label: "Direct Match Invites Sent", value: "142", change: "+12.1% vs last week" },
    { label: "Review Count", value: "38", change: "4.9 Average Stars" },
    { label: "Estimated Ad Earnings", value: "₱3,450.00", change: "Programmatic CPM" },
  ];

  // Lazada Affiliate Ad campaign promo
  const promoCampaign = {
    title: "Official Selkirk Vanguard Power Air Series",
    brand: "Selkirk Philippines",
    desc: "Get an exclusive 10% discount using code DUMA-PICKLE at checkout on Lazada!",
    link: "https://www.lazada.com.ph/catalog/?q=selkirk+pickleball+paddle"
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setNewsletterError("Please enter a valid email address.");
      return;
    }
    setNewsletterError("");
    setSubscribed(true);
    // Persist newsletter captured list
    const list = localStorage.getItem("newsletter_subs") ? JSON.parse(localStorage.getItem("newsletter_subs")!) : [];
    localStorage.setItem("newsletter_subs", JSON.stringify([...list, email]));
  };

  const handleSimulateApiBridge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate) {
      alert("Please select a reservation date.");
      return;
    }

    setSimulating(true);
    
    // Simulate API REST payload & response
    setTimeout(() => {
      const platformCommission = parseFloat((rentPrice * 0.10).toFixed(2)); // 10% commission
      const clubPayout = parseFloat((rentPrice - platformCommission).toFixed(2));

      setSimulatedResponse({
        status: "200_OK_BRIDGE_SUCCESS",
        endpoint: "/api/v1/bookings/initiate",
        payloadSent: {
          courtId: selectedCourtId,
          reservationDate: bookingDate,
          reservationTime: bookingTime,
          baseRatePhp: rentPrice,
          currency: "PHP"
        },
        responseReceived: {
          bookingId: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
          transactionStatus: "PRE_AUTHORIZED",
          commissionBreakdown: {
            totalCollectedPhp: rentPrice,
            platformCommissionPhp: platformCommission, // Revenue Stream 5
            clubPayoutPhp: clubPayout,
            commissionRate: "10.0%"
          },
          apiBridgeSignature: "SHA256_DUMA_SECURE_9821A8",
          gatewayRedirectUrl: "https://dumapicklecourtfinder.online/api/mock-checkout-payout"
        }
      });
      setSimulating(false);
    }, 800);
  };

  return (
    <div className="space-y-12" id="monetization-section">
      
      {/* SECTION 1: Facility Analytics & Club Premium Dashboard (Revenue Stream 4) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-600">
              <Sparkles className="w-3.5 h-3.5" /> Revenue Stream 4
            </span>
            <h3 className="text-xl font-display font-bold text-slate-900">Premium Facility Owner Dashboard</h3>
            <p className="text-xs text-slate-500">Live performance analytics for listed partner court facilities</p>
          </div>

          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            Duma Arena: Active Premium Owner
          </span>
        </div>

        {/* Dashboard grid metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="facility-metrics-grid">
          {mockMetrics.map((metric, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 space-y-2">
              <p className="text-slate-400 text-xs font-semibold">{metric.label}</p>
              <h4 className="text-2xl font-display font-black text-slate-900">{metric.value}</h4>
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> {metric.change}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Programmatic Ads slots simulator (Revenue Stream 1 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Newsletter Form (Revenue Stream 2) */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between" id="newsletter-signup-card">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest block">
              Revenue Stream 2
            </span>
            <h4 className="text-xl font-display font-bold">Pickleball Weekly Digest</h4>
            <p className="text-slate-300 text-xs leading-relaxed">
              We leverage direct newsletter captures for brand sponsorship partnerships and tournament promotions. Join our network of active players!
            </p>
          </div>

          {subscribed ? (
            <div className="bg-emerald-950/50 border border-emerald-500/30 p-4 rounded-2xl text-center space-y-2 text-emerald-300 animate-fade-in" id="newsletter-success-msg">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h5 className="font-bold text-xs">Successfully Registered!</h5>
              <p className="text-[10px] text-slate-400">Compliant with Data Privacy Act of 2012 policies.</p>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="space-y-3 pt-4">
              <input
                type="email"
                id="newsletter-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to capture..."
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {newsletterError && <p className="text-[10px] text-rose-400">{newsletterError}</p>}
              <button
                type="submit"
                id="newsletter-subscribe-btn"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                Subscribe to digest <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Dynamic Programmatic Ad Placement (Revenue Stream 1) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 flex flex-col justify-between" id="programmatic-adslot">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <Megaphone className="w-3 h-3 text-emerald-500" /> Programmatic Ad Slot
            </span>
            <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">
              REVENUE STREAM 1
            </span>
          </div>

          <div className="py-6 space-y-4">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                ADSENSE
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{promoCampaign.brand}</span>
                <h5 className="font-display font-bold text-slate-900 text-sm leading-snug">{promoCampaign.title}</h5>
                <p className="text-slate-500 text-xs leading-relaxed">{promoCampaign.desc}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-50 flex justify-end">
            <a
              href={promoCampaign.link}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              Learn More <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>

      {/* SECTION 3: Future Booking Integration & Transaction API Bridge Playground (Revenue Stream 5) */}
      <div className="bg-slate-950 text-white p-6 md:p-8 rounded-3xl border border-slate-800 space-y-6" id="api-bridge-simulator">
        <div className="flex items-start justify-between gap-4 flex-wrap border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> API Bridge Playground (Revenue Stream 5)
            </span>
            <h4 className="text-xl font-display font-bold">Transaction Commission API Bridge</h4>
            <p className="text-xs text-slate-400">Prepares and models integration endpoints for the legacy booking system commission payouts</p>
          </div>

          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-xl font-mono">
            ENDPOINT: /api/v1/bookings
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Reservation parameters */}
          <form onSubmit={handleSimulateApiBridge} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Court</label>
                <select
                  value={selectedCourtId}
                  onChange={(e) => setSelectedCourtId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none"
                >
                  <option value="duma-sports-center">Dumaguete Sports Arena</option>
                  <option value="cebu-banilad-hub">Cebu Banilad Hub</option>
                  <option value="manila-bgc-courts">BGC Arena Manila</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Hourly Rent rate (PHP)</label>
                <input
                  type="number"
                  value={rentPrice}
                  onChange={(e) => setRentPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Choose Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Choose Start Time</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs p-2.5 rounded-xl text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={simulating}
              id="simulate-booking-btn"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/5"
            >
              <Code className="w-4 h-4" /> {simulating ? "Generating REST Payloads..." : "Fire API Reservation Trigger"}
            </button>
          </form>

          {/* Simulated API Console JSON output */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">REST Response Console Output</span>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-[10px] h-48 overflow-y-auto text-slate-300" id="api-console-output">
              {simulatedResponse ? (
                <pre>{JSON.stringify(simulatedResponse, null, 2)}</pre>
              ) : (
                <div className="text-slate-500 flex flex-col items-center justify-center h-full gap-2">
                  <Code className="w-6 h-6 animate-pulse" />
                  <span>Execute the playground trigger to simulate a RESTful transaction payout and view commission parameters</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
