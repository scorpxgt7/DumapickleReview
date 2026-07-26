import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, ChevronRight, X, Sparkles, Search, Filter, Star, Share2, Check, Eye } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { Article } from '../types';
import SocialShareModal from './SocialShareModal';

export default function LatestNews() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'articles'), (snapshot) => {
      const arts: Article[] = [];
      snapshot.forEach(doc => arts.push({ id: doc.id, ...doc.data() } as Article));
      setDbArticles(arts);
    }, (err) => {
      console.warn("Firestore articles onSnapshot warning:", err);
    });
    return () => unsub();
  }, []);

  const DEFAULT_ARTICLES: Article[] = [
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
      featured: true,
      status: "published",
      views: 342,
      content: `Pickleball is sweeping across the Philippine archipelago, but nowhere is this racket revolution more palpable than in Negros Oriental. Dumaguete City, known affectionately as the "Gentle People's City," has quietly evolved into the country's most active pickleball playground.

### Why Dumaguete?
Unlike larger metropolitan areas where space is premium and indoor rental fees can stifle community access, Dumaguete's seaside geography has allowed for public-spirited court installations. The proximity of seaside courts has democratized play, allowing collegiate tennis players, recreational athletes, and seniors to rub shoulders in daily "kitchen dink" sessions.

### The Sports Complex Impact
The recent unveiling of the province's largest dedicated multi-court sports arena has accelerated this trajectory. Boasting pristine acrylic surfaces, professional tournament-grade LED lighting, and abundant perimeter parking, the venue has caught the attention of national tour organizers.

According to local coordinates, the city currently hosts a higher ratio of active regular matches per square kilometer than any other administrative district in the Visayas, with weekends regularly drawing over 300 active players onto shared roster slots.`
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
      featured: false,
      status: "published",
      views: 521,
      content: `If you've played pickleball for more than a week, you've likely encountered "bangers"—players who drive every single ball with maximum top-spin and pace. While this strategy works at lower skill levels, it disintegrates against experienced players who block drives with soft paddle angles. To level up your game, you must master the **Third Shot Drop**.

### What is the Third Shot Drop?
The Third Shot Drop is a soft, high-trajectory shot hit from near your baseline that lands gently inside your opponent's non-volley zone (the kitchen). This soft bounce prevents them from attacking the ball, giving you and your partner precious time to run forward and establish a solid position at the kitchen line.

### Crucial Mechanics:
1. **Low to High Motion**: Maintain a flat paddle face, starting low and finishing in a smooth lifting arc. Avoid quick wrist movements; power should originate from a steady shoulder pivot.
2. **Loosen Your Grip**: On a scale of 1 to 10, keep your grip tension around a soft 3. A stiff grip translates to hard bounces that spill over the net as attackable balls.
3. **Target the Apex**: Focus on hitting the ball with a peak height that occurs on *your* side of the net, allowing gravity to drop the ball vertically as it crosses into their kitchen.

### The Recommended Baseline Drill
Set up with your partner. Stand at the baseline while your partner stands at the opposite kitchen line. Practice dropping 20 consecutive balls into their kitchen.`
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
      featured: false,
      status: "published",
      views: 219,
      content: `In the era of hyper-connected athletic applications, personal security is just as important as court lighting. When we design directories that list home courts, skill brackets, and email contacts, we must align strictly with the **Philippine Data Privacy Act of 2012 (Republic Act No. 10173)**.

### Compliance by Design
Duma Pickle stands as a reference implementation of secure, decentralized data storage. In compliance with the law's data minimization principles, we structure information inside segregated access tier levels:

- **Decentralized Profiles**: User profiles are stored under locked down documents inside the \`/users/{userId}\` path. Read rights are restricted strictly to the document owner.
- **Rigid Immutability**: Critical consent indicators like \`dpaConsentDate\` are immutable after creation.
- **Right to Erasure**: We provide dedicated, intuitive interface panels that allow players to instantly erase their profile or delete their published reviews.`
    }
  ];

  const rawArticles = dbArticles.length > 0 ? dbArticles : DEFAULT_ARTICLES;

  // Filter out drafts from public view
  const publishedArticles = rawArticles.filter(a => a.status !== 'draft');

  // Filter by category and search
  const filteredArticles = publishedArticles.filter(a => {
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tag.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Identify featured article for top banner
  const featuredArticle = publishedArticles.find(a => a.featured) || publishedArticles[0];

  const handleOpenArticle = async (article: Article) => {
    setSelectedArticle(article);
    if (article.id && dbArticles.length > 0) {
      try {
        await updateDoc(doc(db, 'articles', article.id), {
          views: increment(1)
        });
      } catch (err) {
        // Fallback quiet handle
      }
    }
  };

  const handleShareArticle = (article: Article) => {
    setShareData({
      isOpen: true,
      title: article.title,
      text: `Read "${article.title}" by ${article.author} - ${article.excerpt}`,
      url: window.location.href
    });
  };

  const categories = ['All', 'Community', 'Tutorial', 'Privacy & Tech', 'Tournament', 'Pro Tactics', 'Equipment & Tech'];

  return (
    <div className="space-y-8" id="latest-news-and-articles">
      
      {/* Search & Category Tabs Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Featured Article Banner (Only shown if activeCategory === 'All' and no search term) */}
      {featuredArticle && activeCategory === 'All' && !searchTerm && (
        <div
          onClick={() => handleOpenArticle(featuredArticle)}
          className="group relative rounded-3xl overflow-hidden bg-slate-900 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all border border-slate-800 grid grid-cols-1 md:grid-cols-12"
        >
          <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-4 z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  Featured Spotlight
                </span>
                <span className="text-slate-400 text-xs">{featuredArticle.category} • {featuredArticle.tag}</span>
              </div>

              <h3 className="text-xl md:text-3xl font-display font-black group-hover:text-emerald-400 transition-colors leading-tight">
                {featuredArticle.title}
              </h3>

              <p className="text-slate-300 text-xs md:text-sm line-clamp-3 leading-relaxed">
                {featuredArticle.excerpt}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <span className="font-bold text-white">By {featuredArticle.author}</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold group-hover:gap-2 transition-all">
                Read Featured Article <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          <div className="md:col-span-5 relative h-56 md:h-auto overflow-hidden">
            <img
              src={featuredArticle.image}
              alt={featuredArticle.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
          </div>
        </div>
      )}

      {/* Articles Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No articles match your search criteria.</p>
            <p className="text-xs text-slate-500">Try selecting a different category tab or clearing the search box.</p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => handleOpenArticle(article)}
              className="group bg-white dark:bg-slate-900 hover:shadow-lg border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col justify-between"
              id={`article-card-${article.id}`}
            >
              <div>
                {/* Image Header with Badge */}
                <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                    {article.category || 'Community'}
                  </span>
                  
                  {article.views && article.views > 0 ? (
                    <span className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-400" /> {article.views}
                    </span>
                  ) : null}
                </div>

                {/* Text Body */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-emerald-500" /> {article.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-500" /> {article.readTime}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight font-display">
                    {article.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              {/* Footer Row */}
              <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>By <strong className="text-slate-800 dark:text-slate-200">{article.author}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 group-hover:gap-1 transition-all font-bold">
                  Read <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Article Detail Overlay Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in"
          id="article-detail-overlay-modal"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col border border-slate-200 dark:border-slate-800"
            id="article-detail-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Image area */}
            <div className="relative h-60 md:h-72 w-full overflow-hidden shrink-0">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950/60 text-white hover:bg-slate-950 transition-all border border-white/10"
                id="close-article-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Share Button */}
              <button
                onClick={() => handleShareArticle(selectedArticle)}
                className="absolute top-4 right-16 p-2 rounded-xl bg-slate-950/60 text-white hover:bg-slate-950 transition-all border border-white/10 flex items-center gap-1 text-xs font-bold"
                title="Share Article"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied Link' : 'Share'}</span>
              </button>

              {/* Text details overlay */}
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5">
                <span className="bg-emerald-500 text-slate-950 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                  {selectedArticle.category || 'Community'} • {selectedArticle.tag}
                </span>
                <h3 className="text-lg md:text-2xl font-display font-black leading-tight drop-shadow-md">
                  {selectedArticle.title}
                </h3>
              </div>
            </div>

            {/* Author details card row */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                  {selectedArticle.author.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedArticle.author}</p>
                  <p className="text-[10px] text-slate-400">Duma Pickle Reporter</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{selectedArticle.date}</p>
                  <p className="text-[10px] text-slate-400">{selectedArticle.readTime}</p>
                </div>
              </div>
            </div>

            {/* Paragraphs */}
            <div className="p-6 md:p-8 space-y-5 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto">
              {selectedArticle.content.split('\n\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('### ')) {
                  return (
                    <h4 key={index} className="text-base font-bold text-slate-900 dark:text-white pt-3 flex items-center gap-1.5 font-display">
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" /> {trimmed.replace('### ', '')}
                    </h4>
                  );
                }

                if (trimmed.startsWith('1. ') || trimmed.startsWith('- ')) {
                  return (
                    <div key={index} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2 text-slate-700 dark:text-slate-300 text-xs font-medium">
                      {trimmed.split('\n').map((line, lIdx) => (
                        <p key={lIdx} className="flex gap-2">
                          <span className="text-emerald-500 font-bold shrink-0">•</span>
                          <span>{line.replace(/^[0-9]\.\s*|^-\s*/, '')}</span>
                        </p>
                      ))}
                    </div>
                  );
                }

                const hasBold = trimmed.includes('**');
                if (hasBold) {
                  const parts = trimmed.split('**');
                  return (
                    <p key={index}>
                      {parts.map((part, pIdx) =>
                        pIdx % 2 === 1 ? (
                          <strong key={pIdx} className="text-slate-900 dark:text-white font-bold">
                            {part}
                          </strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  );
                }

                return <p key={index}>{trimmed}</p>;
              })}
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <button
                onClick={() => handleShareArticle(selectedArticle)}
                className="py-2 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Link Copied!' : 'Share Article'}
              </button>

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
      {/* Social Media Share Modal */}
      <SocialShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData(prev => ({ ...prev, isOpen: false }))}
        title={shareData.title}
        text={shareData.text}
        url={shareData.url}
        category="Pickleball News"
      />
    </div>
  );
}
