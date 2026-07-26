/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Paddle } from '../types';
import { INITIAL_PADDLES, PRIMARY_LAZADA_AFFILIATE_LINK } from '../data/equipment';
import { 
  Sparkles, Award, ArrowRight, RefreshCw, ShoppingCart, 
  Flame, ShieldCheck, Heart, CircleDot, ExternalLink, Filter, Search, Tag
} from 'lucide-react';

export default function EquipmentHub() {
  const [paddles] = useState<Paddle[]>(INITIAL_PADDLES);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Quiz states
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState({
    style: "", // "power" | "control" | "all-around"
    budget: "", // "low" | "mid" | "high"
    experience: "", // "beginner" | "intermediate" | "advanced"
    balance: "", // "head-heavy" | "even" | "head-light"
  });
  const [recommendedPaddle, setRecommendedPaddle] = useState<Paddle | null>(null);

  // Filtered products list
  const filteredProducts = paddles.filter(item => {
    const matchesCategory = 
      activeCategory === "all" || 
      item.category === activeCategory ||
      (activeCategory === "accessory" && (item.category === "cover" || item.category === "accessory"));
    
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Quiz questions
  const quizQuestions = [
    {
      key: "style",
      title: "What is your main pickleball playstyle?",
      options: [
        { value: "power", label: "Power Attacker", desc: "You like hard-hitting drives, heavy overheads, and fast putaways." },
        { value: "control", label: "Soft Control", desc: "You prioritize soft dinking, strategic drops, and reset defense." },
        { value: "all-around", label: "Balanced All-Around", desc: "You want a perfect hybrid blend of power and control." },
      ]
    },
    {
      key: "budget",
      title: "What price range are you looking for?",
      options: [
        { value: "low", label: "Budget Friendly (Under ₱8,000)", desc: "Entry-level to high-value recreational options." },
        { value: "mid", label: "Mid-Tier Performance (₱8,000 - ₱13,000)", desc: "Professional thermoformed raw carbon fiber paddles." },
        { value: "high", label: "Elite/Premium (Over ₱13,000)", desc: "The exact elite equipment used by national and world touring pros." },
      ]
    },
    {
      key: "balance",
      title: "What weight balance do you prefer in your hand?",
      options: [
        { value: "head-heavy", label: "Head Heavy", desc: "Gives more leverage for heavy whip-power and deep drives." },
        { value: "even", label: "Even Balance", desc: "A predictable, stable feeling across dinks and resets." },
        { value: "head-light", label: "Head Light", desc: "Faster hand speed at the kitchen line for rapid volley battles." },
      ]
    }
  ];

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setQuizStep(0);
    setRecommendedPaddle(null);
  };

  const handleSelectOption = (value: string) => {
    const key = quizQuestions[quizStep].key;
    const updatedAnswers = { ...answers, [key]: value };
    setAnswers(updatedAnswers);

    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(prev => prev + 1);
    } else {
      // Calculate best paddle match
      calculateRecommendation(updatedAnswers);
    }
  };

  const calculateRecommendation = (finalAnswers: typeof answers) => {
    // Scoring logic
    let bestMatch: Paddle = paddles[0];
    let highestScore = -1;

    paddles.forEach(paddle => {
      let score = 0;

      // Style matching
      if (finalAnswers.style === "power") {
        score += paddle.power * 2;
      } else if (finalAnswers.style === "control") {
        score += paddle.control * 2;
      } else {
        score += (paddle.power + paddle.control);
      }

      // Budget matching
      const price = paddle.pricePhp;
      if (finalAnswers.budget === "low") {
        if (price < 8000) score += 5;
        else if (price < 12000) score += 1;
      } else if (finalAnswers.budget === "mid") {
        if (price >= 8000 && price <= 13000) score += 5;
        else score += 2;
      } else { // high
        if (price > 13000) score += 5;
        else score += 1;
      }

      // Balance matching
      if (finalAnswers.balance === "head-heavy" && paddle.balancePoint === "Head Heavy") score += 4;
      if (finalAnswers.balance === "even" && paddle.balancePoint === "Even") score += 4;
      if (finalAnswers.balance === "head-light" && paddle.balancePoint === "Head Light") score += 4;

      if (score > highestScore) {
        highestScore = score;
        bestMatch = paddle;
      }
    });

    setRecommendedPaddle(bestMatch);
    setQuizStep(quizQuestions.length); // complete
  };

  return (
    <div className="space-y-12" id="equipment-hub-section">
      
      {/* SECTION 1: Interacitve Paddle Matchmaker Quiz */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-3xl p-6 md:p-10 shadow-xl border border-emerald-900/20 relative overflow-hidden">
        {/* Decorative subtle background mesh */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-2xl mx-auto space-y-6 text-center">
          {!quizStarted ? (
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> AI Engine
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight leading-tight">
                Find Your Optimal Paddle Match
              </h2>
              <p className="text-slate-300 text-sm max-w-lg mx-auto leading-relaxed">
                Take our 3-step interactive recommendation quiz. We mathematically map your style, budget, and balance preferences to find the perfect paddle for the local Philippine wind and court conditions.
              </p>
              <button
                id="start-paddle-quiz-btn"
                onClick={handleStartQuiz}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 text-sm"
              >
                Start Free Quiz <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : quizStep < quizQuestions.length ? (
            <div className="space-y-6 text-left">
              {/* Progress bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Question {quizStep + 1} of {quizQuestions.length}</span>
                <span>{Math.round(((quizStep) / quizQuestions.length) * 100)}% Complete</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                  style={{ width: `${((quizStep) / quizQuestions.length) * 100}%` }}
                ></div>
              </div>

              <h3 className="text-xl font-display font-bold text-white">
                {quizQuestions[quizStep].title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="quiz-options-container">
                {quizQuestions[quizStep].options.map(opt => (
                  <button
                    key={opt.value}
                    id={`quiz-option-${opt.value}`}
                    onClick={() => handleSelectOption(opt.value)}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-emerald-500 hover:bg-slate-900/60 transition-all flex flex-col justify-between group space-y-4"
                  >
                    <div className="space-y-2">
                      <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {opt.label}
                      </h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>
                    <span className="text-[10px] text-emerald-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1 self-end mt-2">
                      Select <ArrowRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Quiz Recommendation Output Results */
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex items-center gap-3">
                <Award className="w-10 h-10 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-xl font-display font-bold text-white">Your Ultimate Matches Detected!</h3>
                  <p className="text-xs text-emerald-400">Perfect alignment with your play profile</p>
                </div>
              </div>

              {recommendedPaddle && (
                <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/20 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Paddle Image */}
                  <div className="lg:col-span-4 h-48 rounded-2xl overflow-hidden bg-slate-950">
                    <img 
                      src={recommendedPaddle.image} 
                      alt={recommendedPaddle.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Specs & Description */}
                  <div className="lg:col-span-8 space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                        {recommendedPaddle.brand} • Best Match
                      </span>
                      <h4 className="text-2xl font-display font-bold text-white leading-tight">
                        {recommendedPaddle.name}
                      </h4>
                      <p className="text-emerald-300 font-bold text-sm mt-1">
                        SRP: ₱{recommendedPaddle.pricePhp.toLocaleString()}
                      </p>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">
                      {recommendedPaddle.description}
                    </p>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl text-center">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Twist Weight</p>
                        <p className="text-xs font-bold text-emerald-400">{recommendedPaddle.twistWeight}/10</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Durability</p>
                        <p className="text-xs font-bold text-emerald-400">{recommendedPaddle.durability}/10</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Power</p>
                        <p className="text-xs font-bold text-emerald-400">{recommendedPaddle.power}/10</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Control</p>
                        <p className="text-xs font-bold text-emerald-400">{recommendedPaddle.control}/10</p>
                      </div>
                    </div>

                    {/* Affiliate Call to action */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <a 
                        href={`${recommendedPaddle.affiliateLink.includes('lazada') ? recommendedPaddle.affiliateLink : `https://www.lazada.com.ph/catalog/?q=${encodeURIComponent(recommendedPaddle.brand + ' ' + recommendedPaddle.name)}`}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Buy on Lazada (Affiliate Direct)
                      </a>

                      <a 
                        href={`https://shopee.ph/search?keyword=${encodeURIComponent(recommendedPaddle.brand + ' ' + recommendedPaddle.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        Shopee Backup
                      </a>
                      
                      <button 
                        onClick={handleStartQuiz}
                        className="py-2.5 px-5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retake Quiz
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: General Equipment & Paddle Review Database */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Verified Equipment & Lazada Deals
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore rated paddles, edge protection, lead weights, and maintenance accessories
            </p>
          </div>

          <a
            href={PRIMARY_LAZADA_AFFILIATE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all shrink-0"
          >
            <ShoppingCart className="w-4 h-4" /> Open Dumapickle Lazada Store <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Filter Category Pills & Search */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Equipment' },
              { id: 'paddle', label: 'Paddles' },
              { id: 'edge-guard', label: 'Edge Protection' },
              { id: 'lead-tape', label: 'Lead Tape' },
              { id: 'eraser', label: 'Erasers' },
              { id: 'accessory', label: 'Covers & Accessories' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gear..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="equipment-grid-container">
          {filteredProducts.map(paddle => (
            <div key={paddle.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all gap-5">
              
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 relative flex items-center justify-center p-1">
                  <img 
                    src={paddle.image} 
                    alt={paddle.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {paddle.pricePhp > 14000 && (
                    <span className="absolute top-1 left-1 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                      Premium
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{paddle.brand}</span>
                  <h4 className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{paddle.name}</h4>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">₱{paddle.pricePhp.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {paddle.description}
                  </p>
                </div>
              </div>

              {/* Multi-Dimensional scores bars */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl space-y-2.5">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Control</span>
                      <span>{paddle.control}/10</span>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${paddle.control * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Power</span>
                      <span>{paddle.power}/10</span>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${paddle.power * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Spin</span>
                      <span>{paddle.spin}/10</span>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${paddle.spin * 10}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Durability</span>
                      <span>{paddle.durability}/10</span>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${paddle.durability * 10}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/40 dark:border-slate-700/40 text-[9px] text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1"><CircleDot className="w-3 h-3 text-slate-400" /> Balance: {paddle.balancePoint}</span>
                  <span>Twist Weight: {paddle.twistWeight}/10</span>
                </div>
              </div>

              {/* Lazada affiliate checkout */}
              <div className="flex justify-end pt-1 gap-2">
                <a 
                  href={paddle.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Buy on Lazada (Affiliate)
                </a>
              </div>

            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              No equipment found matching "{searchQuery}".
            </p>
            <button
              onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
              className="text-emerald-600 font-bold text-xs underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
