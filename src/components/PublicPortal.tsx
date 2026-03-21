import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Globe, Menu, X, ChevronRight, Megaphone, Users, Heart, MessageSquare, Download, FileText } from 'lucide-react';

export const PublicPortal: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      const newsData = await api.get('/public/posts?type=NEWS&lang=en');
      setNews(newsData);
    } catch (error) {
      console.error('Error fetching public data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Globe size={20} />
              </div>
              <span className="font-black text-xl tracking-tight text-slate-800">NUP</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Manifesto</a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">News</a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Leadership</a>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Contact</a>
              <button className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                Join Us
              </button>
            </div>

            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden">
          <div className="flex flex-col gap-6">
            <a href="#" className="text-2xl font-bold text-slate-800">Manifesto</a>
            <a href="#" className="text-2xl font-bold text-slate-800">News</a>
            <a href="#" className="text-2xl font-bold text-slate-800">Leadership</a>
            <a href="#" className="text-2xl font-bold text-slate-800">Contact</a>
            <button className="bg-emerald-600 text-white w-full py-4 rounded-2xl text-lg font-bold">
              Join Us
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              Building the Future of Nepal
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.9] mb-8 tracking-tighter">
              A NEW VISION FOR A <span className="text-emerald-600">PROSPEROUS</span> NATION.
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Join the movement for transparency, accountability, and sustainable development. Together, we can build a stronger Nepal for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2">
                Become a Member <ChevronRight size={20} />
              </button>
              <button className="bg-white text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                Read Manifesto
              </button>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-50 -skew-x-12 translate-x-1/4 z-0 hidden lg:block"></div>
      </section>

      {/* Action Blocks */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Heart size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Volunteer</h3>
            <p className="text-slate-500 mb-6">Contribute your skills and time to our local campaigns and initiatives.</p>
            <a href="#" className="text-blue-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">Apply Now <ChevronRight size={16} /></a>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Megaphone size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Donate</h3>
            <p className="text-slate-500 mb-6">Support our mission with a financial contribution. Every rupee counts.</p>
            <a href="#" className="text-amber-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">Contribute <ChevronRight size={16} /></a>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Complaints</h3>
            <p className="text-slate-500 mb-6">Report issues in your local area or provide feedback to the party.</p>
            <a href="#" className="text-purple-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">Submit Issue <ChevronRight size={16} /></a>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Download size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Downloads</h3>
            <p className="text-slate-500 mb-6">Access our manifesto, policy documents, and membership forms.</p>
            <a href="#" className="text-rose-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">Browse Files <ChevronRight size={16} /></a>
          </div>
        </div>
      </section>

      {/* Latest News */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">Latest News</h2>
              <p className="text-slate-500">Stay updated with our latest activities and statements.</p>
            </div>
            <a href="#" className="hidden md:flex items-center gap-2 text-emerald-600 font-bold hover:gap-3 transition-all">
              View All News <ChevronRight size={20} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <div className="aspect-video bg-slate-200 relative">
                  {item.featuredImage ? (
                    <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <FileText size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {item.type}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <div className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-widest">
                    {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                  </div>
                  <h3 className="text-xl font-bold mb-4 line-clamp-2 hover:text-emerald-600 transition-colors cursor-pointer">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-6">
                    {item.excerpt || item.content.substring(0, 150) + '...'}
                  </p>
                  <a href="#" className="text-slate-900 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                    Read More <ChevronRight size={16} />
                  </a>
                </div>
              </div>
            ))}
            {news.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center text-slate-400 italic">
                No news articles published yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 text-emerald-400 mb-8">
                <Globe size={32} />
                <span className="font-black text-3xl tracking-tight">NUP</span>
              </div>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                The Nepal United Party is dedicated to building a prosperous, transparent, and inclusive nation for all citizens.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 uppercase tracking-widest text-emerald-400">Organization</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Leadership</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Committees</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manifesto</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 uppercase tracking-widest text-emerald-400">Contact</h4>
              <ul className="space-y-4 text-slate-400">
                <li>Kathmandu, Nepal</li>
                <li>info@nup.org.np</li>
                <li>+977 1 4XXXXXX</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm">
              © 2026 Nepal United Party. All rights reserved.
            </p>
            <div className="flex gap-8 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
