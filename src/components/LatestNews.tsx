/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, ChevronRight, X, Sparkles, Trophy, Shield, ArrowUpRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface Article {
  id: string;
  category: "Community" | "Tutorial" | "Privacy & Tech" | string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  tag: string;
}

export default function LatestNews() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [dbArticles, setDbArticles] = useState<Article[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'articles'), (snapshot) => {
      const arts: Article[] = [];
      snapshot.forEach(doc => arts.push({ id: doc.id, ...doc.data() } as Article));
      setDbArticles(arts);
    });
    return () => unsub();
  }, []);

  const ARTICLES: Article[] = dbArticles.length > 0 ? dbArticles : [
    {
      id: "visayas-boom",
      category: "Community",
      title: "The Visayas Pickleball Boom: How Dumaguete Takes the Lead",
      excerpt: "Dumaguete is rapidly securing its position as the unofficial pickleball capital of the country, powered by high-density coastal court installations and active local associations.",
      author: "Coach Mark Teves",
      date: "July 14, 2026",
      readTime: "5 min read",
      image: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Pickleball_balls_and_paddles.jpg",
      tag: "Duma Pride",
      content: `
        Pickleball is sweeping across the Philippine archipelago, but nowhere is this racket revolution more palpable than in Negros Oriental. Dumaguete City, known affectionately as the "Gentle People's City," has quietly evolved into the country's most active pickleball playground.

        ### Why Dumaguete?
        Unlike larger metropolitan areas where space is premium and indoor rental fees can stifle community access, Dumaguete's seaside geography has allowed for public-spirited court installations. The proximity of seaside courts has democratized play, allowing collegiate tennis players, recreational athletes, and seniors to rub shoulders in daily "kitchen dink" sessions.

        ### The Sports Complex Impact
        The recent unveiling of the province's largest dedicated multi-court sports arena has accelerated this trajectory. Boasting pristine acrylic surfaces, professional tournament-grade LED lighting, and abundant perimeter parking, the venue has caught the attention of national tour organizers. 

        According to local coordinates, the city currently hosts a higher ratio of active regular matches per square kilometer than any other administrative district in the Visayas, with weekends regularly drawing over 300 active players onto shared roster slots.
      `
    },
    {
      id: "third-shot-drop",
      category: "Tutorial",
      title: "Mastering the Crucial 'Third Shot Drop' in Doubles",
      excerpt: "The single most important tactical play in pickleball separates aggressive bangers from control masters. Follow these five mechanical drills to secure the kitchen.",
      author: "Coach Sally Torres",
      date: "July 12, 2026",
      readTime: "7 min read",
      image: "https://upload.wikimedia.org/wikipedia/commons/3/37/Pickleball_debuts_at_First_Friday_%286141032%29.jpg",
      tag: "Pro Tactics",
      content: `
        If you've played pickleball for more than a week, you've likely encountered "bangers"—players who drive every single ball with maximum top-spin and pace. While this strategy works at lower skill levels, it disintegrates against experienced players who block drives with soft paddle angles. To level up your game, you must master the **Third Shot Drop**.

        ### What is the Third Shot Drop?
        The Third Shot Drop is a soft, high-trajectory shot hit from near your baseline that lands gently inside your opponent's non-volley zone (the kitchen). This soft bounce prevents them from attacking the ball, giving you and your partner precious time to run forward and establish a solid position at the kitchen line.

        ### Crucial Mechanics:
        1. **Low to High Motion**: Maintain a flat paddle face, starting low and finishing in a smooth lifting arc. Avoid quick wrist movements; power should originate from a steady shoulder pivot.
        2. **Loosen Your Grip**: On a scale of 1 to 10, keep your grip tension around a soft 3. A stiff grip translates to hard bounces that spill over the net as attackable balls.
        3. **Target the Apex**: Focus on hitting the ball with a peak height that occurs on *your* side of the net, allowing gravity to drop the ball vertically as it crosses into their kitchen.

        ### The Recommended Baseline Drill
        Set up with your partner. Stand at the baseline while your partner stands at the opposite kitchen line. Practice dropping 20 consecutive balls into their kitchen. If your shot lands too high, they should gently strike it back to keep the rhythm going without punishing you, building muscle memory.
      `
    },
    {
      id: "dpa-tech-compliance",
      category: "Privacy & Tech",
      title: "R.A. 10173 & Player Tech: Building Trust in Sports Directories",
      excerpt: "How Duma Pickle integrates Philippine Data Privacy Act standards directly into Firestore design patterns to eliminate PII harvesting and secure player data.",
      author: "Atty. Carlos Singson",
      date: "July 10, 2026",
      readTime: "4 min read",
      image: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Sandy_Pickle_pickleball_paddles_and_balls_on_the_beach.jpg",
      tag: "Tech Security",
      content: `
        In the era of hyper-connected athletic applications, personal security is just as important as court lighting. When we design directories that list home courts, skill brackets, and email contacts, we must align strictly with the **Philippine Data Privacy Act of 2012 (Republic Act No. 10173)**.

        ### Compliance by Design
        Duma Pickle stands as a reference implementation of secure, decentralized data storage. In compliance with the law's data minimization principles, we structure information inside segregated access tier levels:
        
        - **Decentralized Profiles**: User profiles are stored under locked down documents inside the \`/users/{userId}\` path. Read rights are restricted strictly to the document owner, making it impossible for bots or unauthorized players to harvest email addresses or private phone numbers.
        - **Rigid Immutability**: Critical consent indicators like \`dpaConsentDate\` are immutable after creation, validated by cloud security triggers, preventing administrative tampering.
        - **Right to Erasure**: We provide dedicated, intuitive interface panels that allow players to instantly erase their profile or delete their published reviews, keeping data ownership exactly where it belongs: in the player's hands.
      `
    }
  ];

  return (
    <div className="space-y-6" id="latest-news-and-articles">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ARTICLES.map((article) => (
          <div 
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="group bg-white hover:shadow-md border border-slate-200 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
            id={`article-card-${article.id}`}
          >
            <div>
              {/* Image Header with Badge */}
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <span className="absolute bottom-3 left-3 bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                  {article.category}
                </span>
              </div>

              {/* Text Body */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                  {article.title}
                </h4>
                <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
            </div>

            {/* Footer Row */}
            <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-slate-100 mt-2 text-xs text-slate-500 font-medium">
              <span>By <span className="text-slate-700 font-semibold">{article.author}</span></span>
              <span className="text-emerald-700 flex items-center gap-0.5 group-hover:gap-1 transition-all font-bold">
                Read <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Article Detail Overlay Modal */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in"
          id="article-detail-overlay-modal"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col"
            id="article-detail-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header Image area */}
            <div className="relative h-60 md:h-72 w-full overflow-hidden shrink-0">
              <img 
                src={selectedArticle.image} 
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/30 to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950/50 text-white hover:bg-slate-950/80 transition-all border border-white/10"
                id="close-article-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Text details overlay */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                <span className="bg-emerald-500 text-slate-950 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                  {selectedArticle.category} • {selectedArticle.tag}
                </span>
                <h3 className="text-lg md:text-2xl font-display font-black leading-tight drop-shadow-md">
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            {/* Author details card row */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300">
                  {selectedArticle.author.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{selectedArticle.author}</p>
                  <p className="text-[10px] text-slate-400">Contributor Reporter</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="font-bold">{selectedArticle.date}</p>
                  <p className="text-[10px] text-slate-400">{selectedArticle.readTime}</p>
                </div>
              </div>
            </div>

            {/* Rich Text Paragraphs */}
            <div className="p-6 md:p-8 space-y-5 text-sm text-slate-600 leading-relaxed overflow-y-auto">
              {selectedArticle.content.split('\n\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                
                // Render headers simple patterns
                if (trimmed.startsWith('### ')) {
                  return (
                    <h4 key={index} className="text-base font-bold text-slate-900 pt-3 flex items-center gap-1.5 font-display">
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" /> {trimmed.replace('### ', '')}
                    </h4>
                  );
                }
                
                // Render list indicators
                if (trimmed.startsWith('1. ') || trimmed.startsWith('- ')) {
                  return (
                    <div key={index} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-2 text-slate-700 text-xs font-medium">
                      {trimmed.split('\n').map((line, lIdx) => (
                        <p key={lIdx} className="flex gap-2">
                          <span className="text-emerald-500 font-bold shrink-0">•</span>
                          <span>{line.replace(/^[0-9]\.\s*|^-\s*/, '')}</span>
                        </p>
                      ))}
                    </div>
                  );
                }

                // General markdown bold parsing helper
                const hasBold = trimmed.includes('**');
                if (hasBold) {
                  const parts = trimmed.split('**');
                  return (
                    <p key={index}>
                      {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-slate-900 font-bold">{part}</strong> : part)}
                    </p>
                  );
                }

                return <p key={index}>{trimmed}</p>;
              })}
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedArticle(null)}
                className="py-2 px-5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition-all"
              >
                Close Article
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
