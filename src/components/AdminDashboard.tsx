import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Article, Court } from '../types';
import {
  Settings, Image as ImageIcon, FileText, Layout, Plus, Trash2, Edit2, Check, X,
  ShieldAlert, Search, Filter, Sparkles, Eye, Copy, RotateCcw, Star, Wand2,
  Heading, Bold, List, Quote, BookOpen, Clock, User, Tag, Globe, ArrowUpRight, MapPin
} from 'lucide-react';

interface Slide {
  image: string;
  badge: string;
  title: string;
  subtitle: string;
}

interface LayoutSettings {
  showCourts: boolean;
  showMatchmaker: boolean;
  showPaddles: boolean;
  showNews: boolean;
}

const STOCK_IMAGES = [
  { label: 'Pickleball Paddles & Balls', url: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Pickleball_balls_and_paddles.jpg' },
  { label: 'Action Tournament Match', url: 'https://upload.wikimedia.org/wikipedia/commons/3/37/Pickleball_debuts_at_First_Friday_%286141032%29.jpg' },
  { label: 'Beach Coastal Play Vibe', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Sandy_Pickle_pickleball_paddles_and_balls_on_the_beach.jpg' },
  { label: 'Outdoor Multi-court Arena', url: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Outdoor_pickleball_courts.jpg' },
  { label: 'Court Lines & Net Detail', url: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Pickleball_court_in_La_Crosse%2C_Wisconsin_01.jpg' }
];

const INITIAL_SEED_ARTICLES: Article[] = [
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
    status: "published",
    featured: true,
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
    status: "published",
    featured: false,
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
    status: "published",
    featured: false,
    views: 219,
    content: `In the era of hyper-connected athletic applications, personal security is just as important as court lighting. When we design directories that list home courts, skill brackets, and email contacts, we must align strictly with the **Philippine Data Privacy Act of 2012 (Republic Act No. 10173)**.

### Compliance by Design
Duma Pickle stands as a reference implementation of secure, decentralized data storage. In compliance with the law's data minimization principles, we structure information inside segregated access tier levels:

- **Decentralized Profiles**: User profiles are stored under locked down documents inside the \`/users/{userId}\` path. Read rights are restricted strictly to the document owner.
- **Rigid Immutability**: Critical consent indicators like \`dpaConsentDate\` are immutable after creation.
- **Right to Erasure**: We provide dedicated, intuitive interface panels that allow players to instantly erase their profile or delete their published reviews.`
  }
];

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'articles' | 'carousel' | 'layout' | 'courts'>('articles');

  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showStockImages, setShowStockImages] = useState(false);

  // Carousel state
  const [slides, setSlides] = useState<Slide[]>([]);

  // Courts state
  const [submittedCourts, setSubmittedCourts] = useState<Court[]>([]);

  // Layout state
  const [layout, setLayout] = useState<LayoutSettings>({
    showCourts: true,
    showMatchmaker: true,
    showPaddles: true,
    showNews: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    // Load Settings (Carousel & Layout)
    const unsubSettings = onSnapshot(doc(db, 'settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.slides) setSlides(data.slides);
        if (data.layout) setLayout(data.layout);
      }
      setLoading(false);
    });

    // Load Articles
    const unsubArticles = onSnapshot(collection(db, 'articles'), (snapshot) => {
      const arts: Article[] = [];
      snapshot.forEach((doc) => {
        arts.push({ id: doc.id, ...doc.data() } as Article);
      });
      setArticles(arts);
    });

    // Load Submitted Courts
    const unsubCourts = onSnapshot(collection(db, 'courts'), (snapshot) => {
      const loadedCourts: Court[] = [];
      snapshot.forEach((doc) => {
        loadedCourts.push({ id: doc.id, ...doc.data() } as Court);
      });
      
      // Merge with local storage fallback
      const savedLocal = localStorage.getItem("mock_submitted_courts");
      if (savedLocal) {
        try {
          const localList: Court[] = JSON.parse(savedLocal);
          localList.forEach(lc => {
            if (!loadedCourts.some(c => c.id === lc.id)) {
              loadedCourts.push(lc);
            }
          });
        } catch (e) {
          console.error("Local courts load error", e);
        }
      }

      setSubmittedCourts(loadedCourts);
    }, (err) => {
      console.warn("Courts firestore unsub error, loading from local:", err);
      const savedLocal = localStorage.getItem("mock_submitted_courts");
      if (savedLocal) {
        try {
          setSubmittedCourts(JSON.parse(savedLocal));
        } catch (e) {}
      }
    });

    return () => {
      unsubSettings();
      unsubArticles();
      unsubCourts();
    };
  }, []);

  const saveSettings = async (newSlides?: Slide[], newLayout?: LayoutSettings) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'main'), {
        slides: newSlides || slides,
        layout: newLayout || layout
      }, { merge: true });
    } catch (error) {
      console.error("Error saving settings", error);
    }
    setSaving(false);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    setSaving(true);
    try {
      const articleData: Article = {
        ...editingArticle,
        category: editingArticle.category || 'Community',
        status: editingArticle.status || 'published',
        featured: editingArticle.featured || false,
        views: editingArticle.views || 0,
        createdAt: editingArticle.createdAt || new Date().toISOString()
      };

      const docId = articleData.id || `art_${Date.now()}`;
      delete articleData.id;

      await setDoc(doc(db, 'articles', docId), articleData);
      setEditingArticle(null);
    } catch (error) {
      console.error("Error saving article", error);
      alert("Failed to save article to database.");
    }
    setSaving(false);
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteDoc(doc(db, 'articles', id));
      } catch (err) {
        console.error("Error deleting article:", err);
      }
    }
  };

  const handleToggleStatus = async (article: Article) => {
    if (!article.id) return;
    const nextStatus = article.status === 'draft' ? 'published' : 'draft';
    try {
      const { id, ...rest } = article;
      await setDoc(doc(db, 'articles', id), { ...rest, status: nextStatus }, { merge: true });
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleToggleFeatured = async (article: Article) => {
    if (!article.id) return;
    const nextFeatured = !article.featured;
    try {
      const { id, ...rest } = article;
      await setDoc(doc(db, 'articles', id), { ...rest, featured: nextFeatured }, { merge: true });
    } catch (err) {
      console.error("Error toggling featured:", err);
    }
  };

  const handleDuplicateArticle = async (article: Article) => {
    const newDocId = `art_${Date.now()}`;
    const copyData: Article = {
      ...article,
      title: `${article.title} (Copy)`,
      status: 'draft',
      featured: false,
      createdAt: new Date().toISOString()
    };
    delete copyData.id;
    try {
      await setDoc(doc(db, 'articles', newDocId), copyData);
    } catch (err) {
      console.error("Error duplicating article:", err);
    }
  };

  const handleSeedInitialArticles = async () => {
    setSeeding(true);
    try {
      for (const item of INITIAL_SEED_ARTICLES) {
        const { id, ...data } = item;
        await setDoc(doc(db, 'articles', id!), data, { merge: true });
      }
    } catch (err) {
      console.error("Error seeding initial articles:", err);
    } finally {
      setSeeding(false);
    }
  };

  // Helper to calculate read time from content
  const calculateReadTime = () => {
    if (!editingArticle) return;
    const words = editingArticle.content.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    setEditingArticle({ ...editingArticle, readTime: `${minutes} min read` });
  };

  // Helper to insert markdown formatting into content
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!editingArticle) return;
    setEditingArticle({
      ...editingArticle,
      content: `${editingArticle.content}\n${prefix}${suffix}`
    });
  };

  const handleAddSlide = () => {
    const newSlides = [...slides, { image: '', badge: 'New Badge', title: 'New Title', subtitle: 'New Subtitle' }];
    setSlides(newSlides);
    saveSettings(newSlides, layout);
  };

  const handleUpdateSlide = (index: number, field: keyof Slide, value: string) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSlides(newSlides);
  };

  const handleRemoveSlide = (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    saveSettings(newSlides, layout);
  };

  // Filtered articles list
  const filteredArticles = articles.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.category && a.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Published' && a.status !== 'draft') ||
      (selectedStatus === 'Drafts' && a.status === 'draft');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const publishedCount = articles.filter(a => a.status !== 'draft').length;
  const draftCount = articles.filter(a => a.status === 'draft').length;
  const featuredCount = articles.filter(a => a.featured).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in relative border border-slate-200 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display text-slate-900 dark:text-white flex items-center gap-2">
                Admin Control Hub
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage articles, hero slides, and platform layout settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Workspace */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-2 flex flex-col shrink-0">
            <button
              onClick={() => { setActiveTab('articles'); setEditingArticle(null); }}
              className={`flex items-center justify-between w-full p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'articles'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" /> Articles Manager
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'articles' ? 'bg-emerald-800 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                {articles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('carousel')}
              className={`flex items-center justify-between w-full p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'carousel'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4" /> Hero Carousel
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'carousel' ? 'bg-emerald-800 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                {slides.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('layout')}
              className={`flex items-center gap-2.5 w-full p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'layout'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Layout className="w-4 h-4" /> Layout Settings
            </button>

            <button
              onClick={() => setActiveTab('courts')}
              className={`flex items-center justify-between w-full p-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'courts'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" /> Open-Source Courts
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'courts' ? 'bg-emerald-800 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                {submittedCourts.length}
              </span>
            </button>
          </div>

          {/* Main Workspace Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                <Sparkles className="w-5 h-5 animate-spin text-emerald-500" /> Loading admin metrics...
              </div>
            ) : (
              <>
                {/* ARTICLES MANAGER TAB */}
                {activeTab === 'articles' && (
                  <div className="space-y-6">
                    
                    {/* Header + Stats Banner */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                            Articles & Content Manager
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Create, edit, publish, or draft articles for the community news feed.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {articles.length === 0 && (
                            <button
                              onClick={handleSeedInitialArticles}
                              disabled={seeding}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                            >
                              <Wand2 className="w-4 h-4" />
                              {seeding ? 'Seeding...' : 'Seed Sample Articles'}
                            </button>
                          )}

                          {!editingArticle && (
                            <button
                              onClick={() =>
                                setEditingArticle({
                                  title: '',
                                  category: 'Community',
                                  excerpt: '',
                                  author: 'Duma Pickle Editor',
                                  date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                                  readTime: '4 min read',
                                  image: STOCK_IMAGES[0].url,
                                  tag: 'Community',
                                  content: '',
                                  status: 'published',
                                  featured: false
                                })
                              }
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
                            >
                              <Plus className="w-4 h-4" /> Create Article
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Article Metrics Summary Strip */}
                      <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Total Articles</span>
                          <p className="text-base font-bold text-slate-900 dark:text-white">{articles.length}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-emerald-600 uppercase font-bold">Published</span>
                          <p className="text-base font-bold text-emerald-600">{publishedCount}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-amber-500 uppercase font-bold">Drafts</span>
                          <p className="text-base font-bold text-amber-500">{draftCount}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-purple-500 uppercase font-bold">Featured Spotlight</span>
                          <p className="text-base font-bold text-purple-500">{featuredCount}</p>
                        </div>
                      </div>
                    </div>

                    {/* ARTICLE EDITOR FORM MODE */}
                    {editingArticle ? (
                      <form onSubmit={handleSaveArticle} className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-in shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-emerald-500" />
                            {editingArticle.id ? 'Edit Existing Article' : 'Draft New Article'}
                          </h4>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewArticle(editingArticle)}
                              className="py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-500" /> Preview Render
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingArticle(null)}
                              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Title Input */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Article Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Mastering the Third Shot Drop in Doubles"
                            value={editingArticle.title}
                            onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            required
                          />
                        </div>

                        {/* Category, Tag, Author, Date, Read Time Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          
                          {/* Category Selector */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                            <select
                              value={editingArticle.category || 'Community'}
                              onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="Community">Community</option>
                              <option value="Tutorial">Tutorial</option>
                              <option value="Privacy & Tech">Privacy & Tech</option>
                              <option value="Tournament">Tournament</option>
                              <option value="Pro Tactics">Pro Tactics</option>
                              <option value="Equipment & Tech">Equipment & Tech</option>
                            </select>
                          </div>

                          {/* Tag Label */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Badge Tag</label>
                            <input
                              type="text"
                              placeholder="e.g. Duma Pride, Pro Tactics"
                              value={editingArticle.tag}
                              onChange={(e) => setEditingArticle({ ...editingArticle, tag: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          {/* Author */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Author Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Coach Mark Teves"
                              value={editingArticle.author}
                              onChange={(e) => setEditingArticle({ ...editingArticle, author: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          {/* Date */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Publish Date</label>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingArticle({
                                    ...editingArticle,
                                    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                  })
                                }
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                              >
                                Today
                              </button>
                            </div>
                            <input
                              type="text"
                              value={editingArticle.date}
                              onChange={(e) => setEditingArticle({ ...editingArticle, date: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          {/* Read Time */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Read Time</label>
                              <button
                                type="button"
                                onClick={calculateReadTime}
                                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                              >
                                Auto-Calculate
                              </button>
                            </div>
                            <input
                              type="text"
                              value={editingArticle.readTime}
                              onChange={(e) => setEditingArticle({ ...editingArticle, readTime: e.target.value })}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                            />
                          </div>

                          {/* Status & Featured */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Publication Status</label>
                            <div className="flex items-center gap-3 pt-1">
                              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                                <input
                                  type="radio"
                                  name="status"
                                  checked={editingArticle.status !== 'draft'}
                                  onChange={() => setEditingArticle({ ...editingArticle, status: 'published' })}
                                  className="accent-emerald-600"
                                />
                                <span className="text-emerald-600">Published</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                                <input
                                  type="radio"
                                  name="status"
                                  checked={editingArticle.status === 'draft'}
                                  onChange={() => setEditingArticle({ ...editingArticle, status: 'draft' })}
                                  className="accent-amber-500"
                                />
                                <span className="text-amber-500">Draft</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer ml-auto">
                                <input
                                  type="checkbox"
                                  checked={Boolean(editingArticle.featured)}
                                  onChange={(e) => setEditingArticle({ ...editingArticle, featured: e.target.checked })}
                                  className="accent-purple-600"
                                />
                                <span className="text-purple-600">Featured</span>
                              </label>
                            </div>
                          </div>

                        </div>

                        {/* Cover Image URL + Stock Preset Picker */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cover Image URL</label>
                            <button
                              type="button"
                              onClick={() => setShowStockImages(!showStockImages)}
                              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> Select Stock Pickleball Image
                            </button>
                          </div>

                          <div className="flex gap-3 items-center">
                            <input
                              type="text"
                              placeholder="https://..."
                              value={editingArticle.image}
                              onChange={(e) => setEditingArticle({ ...editingArticle, image: e.target.value })}
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                            />
                            {editingArticle.image && (
                              <img
                                src={editingArticle.image}
                                alt="Cover preview"
                                className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shrink-0"
                              />
                            )}
                          </div>

                          {/* Preset gallery drawer */}
                          {showStockImages && (
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 animate-fade-in">
                              {STOCK_IMAGES.map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => {
                                    setEditingArticle({ ...editingArticle, image: preset.url });
                                    setShowStockImages(false);
                                  }}
                                  className="group text-left rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all space-y-1 p-1 bg-slate-50 dark:bg-slate-950"
                                >
                                  <img src={preset.url} alt={preset.label} className="w-full h-16 object-cover rounded-lg group-hover:scale-105 transition-transform" />
                                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block truncate px-1">{preset.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Excerpt */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Excerpt / Summary</label>
                          <textarea
                            placeholder="Short 2-3 sentence summary displayed on card list..."
                            value={editingArticle.excerpt}
                            onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-20 resize-none"
                            required
                          />
                        </div>

                        {/* Full Article Content + Formatting Helper Toolbar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Article Content (Markdown format)</label>
                            
                            {/* Formatting Helpers */}
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => insertFormatting('### ', 'Section Header')}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                                title="Add Header"
                              >
                                <Heading className="w-3.5 h-3.5 text-emerald-500" /> Header
                              </button>
                              <button
                                type="button"
                                onClick={() => insertFormatting('**', 'bold text**')}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                                title="Add Bold"
                              >
                                <Bold className="w-3.5 h-3.5 text-emerald-500" /> Bold
                              </button>
                              <button
                                type="button"
                                onClick={() => insertFormatting('- ', 'List item')}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                                title="Add Bullet List"
                              >
                                <List className="w-3.5 h-3.5 text-emerald-500" /> List
                              </button>
                              <button
                                type="button"
                                onClick={() => insertFormatting('> ', 'Quote or highlight text')}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                                title="Add Quote"
                              >
                                <Quote className="w-3.5 h-3.5 text-emerald-500" /> Quote
                              </button>
                            </div>
                          </div>

                          <textarea
                            placeholder="Write full article body paragraphs here... Use ### headers, **bold text**, and list items."
                            value={editingArticle.content}
                            onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-52 resize-y"
                            required
                          />
                        </div>

                        {/* Save Actions */}
                        <div className="flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditingArticle(null)}
                            className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
                          >
                            {saving ? (
                              <>
                                <Sparkles className="w-4 h-4 animate-spin" /> Saving...
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" /> Save Article
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* ARTICLES LIST VIEW WITH SEARCH & FILTERS */
                      <div className="space-y-4">
                        
                        {/* Search & Category Filter Bar */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="relative flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              placeholder="Search articles by title, author, or tag..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="All">All Categories</option>
                            <option value="Community">Community</option>
                            <option value="Tutorial">Tutorial</option>
                            <option value="Privacy & Tech">Privacy & Tech</option>
                            <option value="Tournament">Tournament</option>
                            <option value="Pro Tactics">Pro Tactics</option>
                            <option value="Equipment & Tech">Equipment & Tech</option>
                          </select>

                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="All">All Statuses</option>
                            <option value="Published">Published Only</option>
                            <option value="Drafts">Drafts Only</option>
                          </select>
                        </div>

                        {/* Articles Grid Cards */}
                        <div className="grid gap-3">
                          {filteredArticles.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                              <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No matching articles found.</p>
                              <p className="text-xs">Try adjusting your filters or click "Create Article" to write one.</p>
                            </div>
                          ) : (
                            filteredArticles.map((article) => (
                              <div
                                key={article.id}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-emerald-500/50 transition-all gap-4"
                              >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-800 shrink-0"
                                  />
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                                        {article.category || 'Community'}
                                      </span>
                                      
                                      {/* Status Badge */}
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                          article.status === 'draft'
                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                        }`}
                                      >
                                        {article.status === 'draft' ? 'Draft' : 'Published'}
                                      </span>

                                      {/* Featured Badge */}
                                      {article.featured && (
                                        <span className="text-[10px] font-bold bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded flex items-center gap-0.5 border border-purple-500/30">
                                          <Star className="w-3 h-3 fill-current" /> Featured
                                        </span>
                                      )}
                                    </div>

                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                      {article.title}
                                    </h4>

                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                      <span>By <strong>{article.author}</strong></span>
                                      <span>• {article.date}</span>
                                      <span>• {article.readTime}</span>
                                    </p>
                                  </div>
                                </div>

                                {/* Article Actions */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* Toggle Status (Quick Publish / Draft) */}
                                  <button
                                    onClick={() => handleToggleStatus(article)}
                                    className={`p-2 rounded-xl border transition-all text-xs font-bold ${
                                      article.status === 'draft'
                                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 hover:bg-amber-100'
                                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    }`}
                                    title={article.status === 'draft' ? 'Publish Article' : 'Move to Drafts'}
                                  >
                                    <Globe className="w-4 h-4" />
                                  </button>

                                  {/* Toggle Featured */}
                                  <button
                                    onClick={() => handleToggleFeatured(article)}
                                    className={`p-2 rounded-xl border transition-all ${
                                      article.featured
                                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-purple-600'
                                    }`}
                                    title="Toggle Featured Spotlight"
                                  >
                                    <Star className={`w-4 h-4 ${article.featured ? 'fill-current' : ''}`} />
                                  </button>

                                  {/* Duplicate Article */}
                                  <button
                                    onClick={() => handleDuplicateArticle(article)}
                                    className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                                    title="Duplicate Article"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>

                                  {/* Preview */}
                                  <button
                                    onClick={() => setPreviewArticle(article)}
                                    className="p-2 text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                                    title="Preview Article"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Edit */}
                                  <button
                                    onClick={() => setEditingArticle(article)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-all"
                                    title="Edit Article"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteArticle(article.id!)}
                                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
                                    title="Delete Article"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* HERO CAROUSEL TAB */}
                {activeTab === 'carousel' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hero Carousel Slides</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Customize images, titles, and badge text shown on the homepage hero banner.</p>
                      </div>
                      <button
                        onClick={handleAddSlide}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Add Slide
                      </button>
                    </div>

                    <div className="space-y-4">
                      {slides.map((slide, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              Slide #{idx + 1}
                            </h4>
                            <button onClick={() => handleRemoveSlide(idx)} className="text-rose-500 hover:text-rose-700 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Image preview & Inputs */}
                          <div className="flex flex-col md:flex-row gap-4 items-start">
                            {/* Live Thumbnail Preview */}
                            <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 relative">
                              <img
                                src={slide.image?.trim() || "https://upload.wikimedia.org/wikipedia/commons/3/39/Outdoor_pickleball_courts.jpg"}
                                alt={`Preview ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/3/39/Outdoor_pickleball_courts.jpg";
                                }}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-xs">
                                Live Preview
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 w-full">
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">IMAGE URL</label>
                                <input type="text" placeholder="https://..." value={slide.image} onChange={(e) => handleUpdateSlide(idx, 'image', e.target.value)} className="border dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 w-full" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">BADGE TEXT</label>
                                <input type="text" placeholder="e.g. Negros Oriental • Philippines" value={slide.badge} onChange={(e) => handleUpdateSlide(idx, 'badge', e.target.value)} className="border dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 w-full" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">MAIN HEADING / TITLE</label>
                                <input type="text" placeholder="Title" value={slide.title} onChange={(e) => handleUpdateSlide(idx, 'title', e.target.value)} className="border dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 w-full" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">SUBTITLE</label>
                                <input type="text" placeholder="Subtitle" value={slide.subtitle} onChange={(e) => handleUpdateSlide(idx, 'subtitle', e.target.value)} className="border dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 w-full" />
                              </div>
                            </div>
                          </div>

                          {/* Quick Stock Presets */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 flex-wrap text-[10px]">
                            <span className="text-slate-400 font-bold uppercase">Preset Images:</span>
                            <button
                              onClick={() => handleUpdateSlide(idx, 'image', 'https://upload.wikimedia.org/wikipedia/commons/3/39/Outdoor_pickleball_courts.jpg')}
                              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 font-medium"
                            >
                              Outdoor Court
                            </button>
                            <button
                              onClick={() => handleUpdateSlide(idx, 'image', 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1200&q=80')}
                              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 font-medium"
                            >
                              Tournament Action
                            </button>
                            <button
                              onClick={() => handleUpdateSlide(idx, 'image', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80')}
                              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 font-medium"
                            >
                              Racket & Ball
                            </button>
                          </div>
                        </div>
                      ))}

                      {slides.length > 0 && (
                        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                          <button onClick={() => saveSettings(slides, layout)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all">
                            {saving ? 'Saving...' : 'Save Carousel Slides'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LAYOUT SETTINGS TAB */}
                {activeTab === 'layout' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Homepage Layout Controls</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Toggle homepage sections to customize what visitors see.</p>

                    <div className="space-y-3 max-w-lg">
                      <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Latest Articles & Guides</span>
                        <input
                          type="checkbox"
                          checked={layout.showNews}
                          onChange={(e) => setLayout({ ...layout, showNews: e.target.checked })}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Top Rated Courts & Reviews</span>
                        <input
                          type="checkbox"
                          checked={layout.showCourts}
                          onChange={(e) => setLayout({ ...layout, showCourts: e.target.checked })}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Match Maker & Game Coordinator</span>
                        <input
                          type="checkbox"
                          checked={layout.showMatchmaker}
                          onChange={(e) => setLayout({ ...layout, showMatchmaker: e.target.checked })}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Intelligent Paddle Matchmaker</span>
                        <input
                          type="checkbox"
                          checked={layout.showPaddles}
                          onChange={(e) => setLayout({ ...layout, showPaddles: e.target.checked })}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </label>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button onClick={() => saveSettings(slides, layout)} disabled={saving} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md">
                        {saving ? 'Saving...' : 'Save Layout Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {/* COURTS MANAGER TAB */}
                {activeTab === 'courts' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                        Open-Source Court Submissions
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Review community-submitted courts, approve verified locations, or reject spam entries.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {submittedCourts.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No community submitted courts found</p>
                          <p className="text-xs text-slate-500 mt-1">Users can submit new courts from the Court Directory tab.</p>
                        </div>
                      ) : (
                        submittedCourts.map((court) => {
                          const isPending = court.status === 'pending' || !court.status;
                          return (
                            <div key={court.id} className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 flex-wrap">
                              <div className="space-y-2 max-w-xl">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                  }`}>
                                    {isPending ? 'Pending Approval' : 'Approved Live'}
                                  </span>
                                  <span className="text-xs text-slate-500">City: <strong>{court.city}</strong></span>
                                </div>

                                <h4 className="text-base font-bold text-slate-900 dark:text-white">{court.name}</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {court.address}
                                </p>
                                <p className="text-xs text-slate-500 italic">{court.description}</p>
                                
                                {court.submittedBy && (
                                  <p className="text-[11px] text-slate-400 pt-1">
                                    Submitted by: <strong>{court.submittedBy}</strong>
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-center">
                                {isPending && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        if (court.id.startsWith("local_")) {
                                          const saved = localStorage.getItem("mock_submitted_courts");
                                          if (saved) {
                                            const list: Court[] = JSON.parse(saved);
                                            const updated = list.map(c => c.id === court.id ? { ...c, status: 'approved' as const } : c);
                                            localStorage.setItem("mock_submitted_courts", JSON.stringify(updated));
                                            setSubmittedCourts(updated);
                                          }
                                        } else {
                                          await setDoc(doc(db, 'courts', court.id), { ...court, status: 'approved' }, { merge: true });
                                        }
                                        alert(`Approved ${court.name}!`);
                                      } catch (err) {
                                        console.error("Failed to approve court:", err);
                                      }
                                    }}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                  >
                                    <Check className="w-4 h-4" /> Approve Court
                                  </button>
                                )}

                                <button
                                  onClick={async () => {
                                    if (confirm(`Delete/Reject ${court.name}?`)) {
                                      try {
                                        if (court.id.startsWith("local_")) {
                                          const saved = localStorage.getItem("mock_submitted_courts");
                                          if (saved) {
                                            const list: Court[] = JSON.parse(saved);
                                            const updated = list.filter(c => c.id !== court.id);
                                            localStorage.setItem("mock_submitted_courts", JSON.stringify(updated));
                                            setSubmittedCourts(updated);
                                          }
                                        } else {
                                          await deleteDoc(doc(db, 'courts', court.id));
                                        }
                                      } catch (err) {
                                        console.error("Failed to delete court:", err);
                                      }
                                    }
                                  }}
                                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" /> Reject/Delete
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ARTICLE LIVE PREVIEW MODAL */}
      {previewArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setPreviewArticle(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[88vh] overflow-y-auto shadow-2xl relative flex flex-col border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-60 w-full overflow-hidden shrink-0">
              <img
                src={previewArticle.image}
                alt={previewArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <button
                onClick={() => setPreviewArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950/60 text-white hover:bg-slate-950"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                <span className="bg-emerald-500 text-slate-950 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                  {previewArticle.category || 'Community'} • {previewArticle.tag}
                </span>
                <h3 className="text-xl font-black font-display leading-tight">{previewArticle.title}</h3>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>By <strong>{previewArticle.author}</strong></span>
              <span>{previewArticle.date} • {previewArticle.readTime}</span>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto">
              {previewArticle.content.split('\n\n').map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith('### ')) {
                  return (
                    <h4 key={index} className="text-sm font-bold text-slate-900 dark:text-white pt-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> {trimmed.replace('### ', '')}
                    </h4>
                  );
                }
                return <p key={index}>{trimmed}</p>;
              })}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setPreviewArticle(null)}
                className="py-2 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
