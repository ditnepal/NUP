import React from 'react';
import { UserProfile } from '../types';
import { 
  Globe, 
  UserPlus, 
  Heart, 
  ShieldAlert, 
  ArrowRight, 
  LayoutDashboard, 
  CheckCircle2, 
  LogIn,
  UserCheck,
  ChevronRight,
  Shield,
  Activity,
  Zap,
  Megaphone,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';

interface PublicEntryProps {
  user: UserProfile | null;
  systemConfig: Record<string, string>;
  setCurrentView: (view: any) => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const PublicEntry: React.FC<PublicEntryProps> = ({ 
  user, 
  systemConfig,
  setCurrentView, 
  onLoginClick, 
  onRegisterClick 
}) => {
  const [latestNews, setLatestNews] = React.useState<any[]>([]);
  const [loadingNews, setLoadingNews] = React.useState(true);

  React.useEffect(() => {
    const fetchNews = async () => {
      try {
        const newsData = await api.get('/public/posts?type=NEWS&limit=3');
        setLatestNews(newsData);
      } catch (error) {
        console.error('Error fetching news for home:', error);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-slate-950">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#10b981_0%,transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,#059669_0%,transparent_40%)]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10 w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-10">
                <Globe size={14} />
                Official Civic Operating System
              </div>
              
              <h1 className="text-7xl md:text-9xl font-black text-white leading-[0.85] mb-10 tracking-tighter uppercase">
                Power to <br />
                <span className="text-emerald-500">the People.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-400 mb-12 leading-tight max-w-xl font-medium tracking-tight">
                A transparent, secure, and decentralized platform designed to empower every citizen and build a prosperous future together.
              </p>

              <div className="flex flex-col sm:flex-row gap-5">
                {user ? (
                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="bg-emerald-600 text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/20 flex items-center justify-center gap-3 group"
                  >
                    <LayoutDashboard size={18} />
                    Access Dashboard
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={onRegisterClick}
                      className="bg-emerald-600 text-white px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/20 flex items-center justify-center gap-3 group"
                    >
                      <UserPlus size={18} />
                      Join Movement
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={onLoginClick}
                      className="bg-white/5 backdrop-blur-md text-white border border-white/10 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                    >
                      <LogIn size={18} />
                      Sign In
                    </button>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="hidden lg:block relative"
            >
              <div className="relative z-10 bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <Shield size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-black text-sm uppercase tracking-tight">Secure Portal</p>
                      <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Encrypted Session</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Live
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { label: 'Transparency Score', value: '99.8%', icon: Shield, color: 'text-emerald-500' },
                    { label: 'Active Initiatives', value: '1,240', icon: Zap, color: 'text-amber-500' },
                    { label: 'Citizen Engagement', value: 'High', icon: Activity, color: 'text-blue-500' }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <item.icon size={20} className={item.color} />
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{item.label}</span>
                      </div>
                      <span className="text-white font-black text-lg">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-10 border-t border-white/10 flex justify-between items-center">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white">
                      +12K
                    </div>
                  </div>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Verified Citizens</span>
                </div>
              </div>
              
              {/* Floating accents */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest News Preview */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-4">Latest Updates</h2>
              <p className="text-slate-500 max-w-xl font-medium">Stay informed with the most recent news, policy announcements, and official statements from the party leadership.</p>
            </div>
            <button 
              onClick={() => setCurrentView('public-portal')}
              className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
            >
              View Newsroom <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingNews ? (
              [1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-slate-50 rounded-[2.5rem] h-80"></div>
              ))
            ) : latestNews.length > 0 ? (
              latestNews.map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => setCurrentView('public-portal')}
                  className="group cursor-pointer"
                >
                  <div className="bg-slate-100 rounded-[2.5rem] aspect-[4/3] mb-6 overflow-hidden relative">
                    {post.featuredImage ? (
                      <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Megaphone size={48} />
                      </div>
                    )}
                    <div className="absolute top-6 left-6">
                      <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                        {post.category?.name || 'Update'}
                      </span>
                    </div>
                  </div>
                  <div className="px-2">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h3 className="text-xl font-black text-slate-900 mb-4 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2 uppercase tracking-tight">
                      {post.title}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-2 font-medium leading-relaxed">
                      {post.summary || 'Read the full official statement and details regarding this latest development.'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <Megaphone size={48} className="mx-auto text-slate-300 mb-6" />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">No Recent News</h3>
                <p className="text-slate-500 mt-2">Official updates will appear here once published by the administration.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Manifesto Highlight */}
      <section className="py-24 bg-slate-950 text-white overflow-hidden relative rounded-[4rem] mx-4 md:mx-8">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-600/10 -skew-x-12 translate-x-1/4 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">
                <Shield size={14} />
                Core Vision
              </div>
              <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter uppercase">
                OUR VISION <br />
                <span className="text-emerald-500">FOR NEPAL.</span>
              </h2>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed font-medium">
                The official party manifesto outlines our strategic roadmap for economic growth, social justice, and institutional transparency. Download the full document to understand our commitment to the nation.
              </p>
              <div className="flex flex-wrap gap-6">
                <button 
                  onClick={() => setCurrentView('public-documents')}
                  className="bg-white text-slate-950 px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-3 group"
                >
                  Read Manifesto <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </button>
                <div className="flex items-center gap-4 text-slate-500">
                  <div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Verified & <br />Official Document</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-12 rounded-[3rem] transform lg:rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between items-start mb-12">
                  <Shield size={48} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Doc ID: NUP-2026-M</span>
                </div>
                <h3 className="text-3xl font-black mb-6 uppercase tracking-tight">Manifesto 2026</h3>
                <div className="space-y-4 mb-10">
                  {['Economic Sovereignty', 'Digital Governance', 'Agricultural Revolution', 'Youth Empowerment'].map((point) => (
                    <div key={point} className="flex items-center gap-4 text-slate-300 font-bold text-sm">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      {point}
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">Status</p>
                  <p className="text-white font-bold">Publicly Available for Review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Selection */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-6">Citizen Services</h2>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">Access the official digital services provided by our organization. From membership enrollment to grievance reporting, our platform is built for your convenience.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Need Assistance?</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">24/7 Support Available</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Activity size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'membership-public', title: 'Membership', desc: 'Become an official part of our organization with full voting rights.', icon: UserCheck, color: 'emerald' },
              { id: 'volunteer-enrollment', title: 'Volunteer', desc: 'Contribute your skills and time to our local campaigns.', icon: Heart, color: 'rose' },
              { id: 'donations', title: 'Support', desc: 'Fuel our mission through secure financial contributions.', icon: Zap, color: 'amber' },
              { id: 'grievances', title: 'Grievance', desc: 'Report community issues or seek assistance from our legal team.', icon: ShieldAlert, color: 'slate' },
              { id: 'applicant-status', title: 'Track Status', desc: 'Monitor the progress of your applications in real-time.', icon: Activity, color: 'blue' },
              { id: 'public-documents', title: 'Documents', desc: 'Access official policy papers, manifestos, and reports.', icon: Shield, color: 'indigo' },
              { id: 'public-about', title: 'About Us', desc: 'Learn about our history, values, and organizational structure.', icon: Globe, color: 'emerald' },
              { id: 'public-candidates', title: 'Candidates', desc: 'Meet the leaders representing our party in your area.', icon: UserCheck, color: 'blue' },
              { id: 'public-portal', title: 'Newsroom', desc: 'Stay updated with the latest official announcements.', icon: Megaphone, color: 'emerald' }
            ].map((journey) => (
              <div 
                key={journey.id} 
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 hover:border-emerald-500 transition-all group cursor-pointer shadow-sm hover:shadow-2xl relative overflow-hidden" 
                onClick={() => setCurrentView(journey.id)}
              >
                <div className={`w-16 h-16 bg-${journey.color}-50 text-${journey.color}-600 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500 border border-${journey.color}-100`}>
                  <journey.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">{journey.title}</h3>
                <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">{journey.desc}</p>
                <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors">
                  Open Service <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="py-24 bg-slate-900 text-white rounded-[4rem] mx-4 md:mx-8 mb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,#10b981_0%,transparent_30%)] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black uppercase tracking-tight mb-6">Trust & Transparency</h2>
            <p className="text-slate-400 max-w-2xl mx-auto font-medium">Our organization is built on the principles of accountability and digital-first governance. Every action is recorded and verifiable.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Blockchain Ready', desc: 'Immutable record keeping for all membership and financial data.', icon: Shield },
              { title: 'Open Governance', desc: 'Real-time reporting on party decisions and policy implementations.', icon: Globe },
              { title: 'Citizen First', desc: 'Direct feedback loops and grievance resolution mechanisms.', icon: Heart }
            ].map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all duration-500">
                  <item.icon size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-black mb-4 uppercase tracking-tight">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicEntry;
