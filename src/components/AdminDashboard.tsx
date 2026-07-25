import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Settings, Image as ImageIcon, FileText, Layout, Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';

interface Article {
  id?: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  tag: string;
  content: string;
}

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

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'articles' | 'carousel' | 'layout'>('articles');
  
  // Articles state
  const [articles, setArticles] = useState<Article[]>([]);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  // Carousel state
  const [slides, setSlides] = useState<Slide[]>([]);
  
  // Layout state
  const [layout, setLayout] = useState<LayoutSettings>({
    showCourts: true,
    showMatchmaker: true,
    showPaddles: true,
    showNews: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

    return () => {
      unsubSettings();
      unsubArticles();
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
      const articleData = { ...editingArticle };
      const docId = articleData.id || Date.now().toString();
      delete articleData.id;
      
      await setDoc(doc(db, 'articles', docId), articleData);
      setEditingArticle(null);
    } catch (error) {
      console.error("Error saving article", error);
    }
    setSaving(false);
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      await deleteDoc(doc(db, 'articles', id));
    }
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display text-slate-900">Admin Dashboard</h2>
              <p className="text-xs text-slate-500">Manage site content and layout</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 space-y-2 flex flex-col">
            <button 
              onClick={() => setActiveTab('articles')}
              className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'articles' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <FileText className="w-4 h-4" /> Articles Manager
            </button>
            <button 
              onClick={() => setActiveTab('carousel')}
              className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'carousel' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <ImageIcon className="w-4 h-4" /> Hero Carousel
            </button>
            <button 
              onClick={() => setActiveTab('layout')}
              className={`flex items-center gap-3 w-full p-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'layout' ? 'bg-emerald-100 text-emerald-800' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <Layout className="w-4 h-4" /> Layout Settings
            </button>
          </div>

          {/* Main Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-400">Loading admin data...</div>
            ) : (
              <>
                {/* ARTICLES */}
                {activeTab === 'articles' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">Manage Articles</h3>
                      <button 
                        onClick={() => setEditingArticle({ title: '', excerpt: '', author: '', date: '', readTime: '', image: '', tag: '', content: '' })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Article
                      </button>
                    </div>

                    {editingArticle ? (
                      <form onSubmit={handleSaveArticle} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="font-bold text-slate-800">{editingArticle.id ? 'Edit Article' : 'New Article'}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Title" value={editingArticle.title} onChange={e => setEditingArticle({...editingArticle, title: e.target.value})} className="border p-2 rounded-lg w-full text-sm" required />
                          <input type="text" placeholder="Author" value={editingArticle.author} onChange={e => setEditingArticle({...editingArticle, author: e.target.value})} className="border p-2 rounded-lg w-full text-sm" required />
                          <input type="text" placeholder="Date" value={editingArticle.date} onChange={e => setEditingArticle({...editingArticle, date: e.target.value})} className="border p-2 rounded-lg w-full text-sm" required />
                          <input type="text" placeholder="Read Time" value={editingArticle.readTime} onChange={e => setEditingArticle({...editingArticle, readTime: e.target.value})} className="border p-2 rounded-lg w-full text-sm" required />
                          <input type="text" placeholder="Image URL" value={editingArticle.image} onChange={e => setEditingArticle({...editingArticle, image: e.target.value})} className="border p-2 rounded-lg w-full text-sm" required />
                          <input type="text" placeholder="Tag" value={editingArticle.tag} onChange={e => setEditingArticle({...editingArticle, tag: e.target.value})} className="border p-2 rounded-lg w-full text-sm" required />
                        </div>
                        <textarea placeholder="Excerpt (Short summary)" value={editingArticle.excerpt} onChange={e => setEditingArticle({...editingArticle, excerpt: e.target.value})} className="border p-2 rounded-lg w-full text-sm h-20" required />
                        <textarea placeholder="Full Content" value={editingArticle.content} onChange={e => setEditingArticle({...editingArticle, content: e.target.value})} className="border p-2 rounded-lg w-full text-sm h-40" required />
                        
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingArticle(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold">Cancel</button>
                          <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">{saving ? 'Saving...' : 'Save Article'}</button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid gap-4">
                        {articles.length === 0 && <p className="text-slate-500">No articles found.</p>}
                        {articles.map(article => (
                          <div key={article.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="flex items-center gap-4">
                              <img src={article.image} alt="" className="w-16 h-16 object-cover rounded-lg" />
                              <div>
                                <h4 className="font-bold text-slate-900">{article.title}</h4>
                                <p className="text-xs text-slate-500">{article.date} • {article.author}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditingArticle(article)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteArticle(article.id!)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CAROUSEL */}
                {activeTab === 'carousel' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">Hero Carousel Images</h3>
                      <button 
                        onClick={handleAddSlide}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Slide
                      </button>
                    </div>

                    <div className="space-y-6">
                      {slides.map((slide, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-700">Slide {idx + 1}</h4>
                            <button onClick={() => handleRemoveSlide(idx)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Image URL" value={slide.image} onChange={(e) => handleUpdateSlide(idx, 'image', e.target.value)} className="border p-2 rounded-lg w-full text-sm" />
                            <input type="text" placeholder="Badge Text" value={slide.badge} onChange={(e) => handleUpdateSlide(idx, 'badge', e.target.value)} className="border p-2 rounded-lg w-full text-sm" />
                            <input type="text" placeholder="Title" value={slide.title} onChange={(e) => handleUpdateSlide(idx, 'title', e.target.value)} className="border p-2 rounded-lg w-full text-sm" />
                            <input type="text" placeholder="Subtitle" value={slide.subtitle} onChange={(e) => handleUpdateSlide(idx, 'subtitle', e.target.value)} className="border p-2 rounded-lg w-full text-sm" />
                          </div>
                        </div>
                      ))}
                      
                      {slides.length > 0 && (
                        <div className="flex justify-end pt-4 border-t border-slate-200">
                          <button onClick={() => saveSettings(slides, layout)} disabled={saving} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LAYOUT */}
                {activeTab === 'layout' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">Homepage Layout Controls</h3>
                    <p className="text-sm text-slate-500">Toggle sections to show or hide them on the public homepage.</p>
                    
                    <div className="space-y-3 max-w-lg">
                      <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                        <span className="font-semibold text-slate-800">Top Rated Courts</span>
                        <input 
                          type="checkbox" 
                          checked={layout.showCourts} 
                          onChange={(e) => setLayout({...layout, showCourts: e.target.checked})}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                        <span className="font-semibold text-slate-800">Match Maker / Coordinator</span>
                        <input 
                          type="checkbox" 
                          checked={layout.showMatchmaker} 
                          onChange={(e) => setLayout({...layout, showMatchmaker: e.target.checked})}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                        <span className="font-semibold text-slate-800">Paddle Reviews</span>
                        <input 
                          type="checkbox" 
                          checked={layout.showPaddles} 
                          onChange={(e) => setLayout({...layout, showPaddles: e.target.checked})}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                        <span className="font-semibold text-slate-800">Latest Articles & Guides</span>
                        <input 
                          type="checkbox" 
                          checked={layout.showNews} 
                          onChange={(e) => setLayout({...layout, showNews: e.target.checked})}
                          className="w-5 h-5 accent-emerald-600"
                        />
                      </label>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <button onClick={() => saveSettings(slides, layout)} disabled={saving} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">
                        {saving ? 'Saving...' : 'Save Layout'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
