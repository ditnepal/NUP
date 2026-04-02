import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Globe, 
  Menu, 
  X, 
  ChevronRight, 
  Megaphone, 
  Users, 
  Heart, 
  MessageSquare, 
  Download, 
  FileText, 
  User, 
  ExternalLink, 
  GraduationCap, 
  Calendar, 
  Tag, 
  Loader2, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowRight, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube,
  Zap,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import Markdown from 'react-markdown';
import { toast } from 'sonner';

interface PublicPortalProps {
  user?: UserProfile | null;
  onPortalClick?: () => void;
  onDocumentsClick?: () => void;
  onTrainingClick?: () => void;
  onJoinClick?: () => void;
  onStatusClick?: () => void;
  onDonateClick?: () => void;
  onGrievanceClick?: () => void;
  onCandidatesClick?: () => void;
  onCampaignsClick?: () => void;
  onAboutClick?: () => void;
  onHomeClick?: () => void;
  onBack?: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ 
  user, 
  onPortalClick, 
  onDocumentsClick, 
  onTrainingClick, 
  onJoinClick, 
  onStatusClick, 
  onDonateClick, 
  onGrievanceClick, 
  onCandidatesClick, 
  onCampaignsClick, 
  onAboutClick, 
  onHomeClick,
  onBack
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({
    PARTY_NAME: 'Nagarik Unmukti Party',
    PARTY_TAGLINE: 'Empowering Citizens, Building the Future',
    CONTACT_EMAIL: 'info@nupos.org',
    CONTACT_PHONE: '+977-1-0000000'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicData();
    fetchCategories();
    fetchPublicSurveysAndPolls();
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const config = await api.get('/public/config');
      setSystemConfig(config);
    } catch (error) {
      console.error('Error fetching system config:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [activeCategory]);

  useEffect(() => {
    if (selectedPost) {
      fetchPostSurveysAndPolls(selectedPost.slug);
    }
  }, [selectedPost]);

  const fetchPublicSurveysAndPolls = async () => {
    try {
      const [surveysData, pollsData] = await Promise.all([
        api.get('/public/surveys?placementType=PUBLIC_PORTAL'),
        api.get('/public/polls?placementType=PUBLIC_PORTAL')
      ]);
      setSurveys(surveysData);
      setPolls(pollsData);
    } catch (error) {
      console.error('Error fetching public surveys/polls:', error);
    }
  };

  const [postSurveys, setPostSurveys] = useState<any[]>([]);
  const [postPolls, setPostPolls] = useState<any[]>([]);

  const fetchPostSurveysAndPolls = async (slug: string) => {
    try {
      const [surveysData, pollsData] = await Promise.all([
        api.get(`/public/surveys?placementType=CONTENT_INLINE&targetSlug=${slug}`),
        api.get(`/public/polls?placementType=CONTENT_INLINE&targetSlug=${slug}`)
      ]);
      setPostSurveys(surveysData);
      setPostPolls(pollsData);
    } catch (error) {
      console.error('Error fetching post surveys/polls:', error);
    }
  };

  const fetchPublicData = async () => {
    try {
      const [noticesData, eventsData, sectionsData] = await Promise.all([
        api.get('/communication/notices/public'),
        api.get('/app-events/public'),
        api.get('/public/sections')
      ]);
      setNotices(noticesData);
      setEvents(eventsData);
      setSections(sectionsData);
    } catch (error: any) {
      console.error('Error fetching public data:', error);
      const errorMessage = error.response?.data?.error || 'Error fetching public data';
      const errorDetails = error.response?.data?.details ? `: ${error.response.data.details}` : '';
      toast.error(`${errorMessage}${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchNews = async () => {
    try {
      const url = activeCategory 
        ? `/public/posts?type=NEWS&lang=en&categoryId=${activeCategory}`
        : '/public/posts?type=NEWS&lang=en';
      const newsData = await api.get(url);
      setNews(newsData);
    } catch (error: any) {
      console.error('Error fetching news:', error);
      const errorMessage = error.response?.data?.error || 'Error fetching news';
      const errorDetails = error.response?.data?.details ? `: ${error.response.data.details}` : '';
      toast.error(`${errorMessage}${errorDetails}`);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/public/categories?type=POST');
      setCategories(data);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      const errorMessage = error.response?.data?.error || 'Error fetching categories';
      const errorDetails = error.response?.data?.details ? `: ${error.response.data.details}` : '';
      toast.error(`${errorMessage}${errorDetails}`);
    }
  };

  const handlePostClick = (post: any) => {
    setSelectedPost(post);
  };

  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [submittingVolunteer, setSubmittingVolunteer] = useState(false);
  const [volunteerFormData, setVolunteerFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    skills: '',
    availability: ''
  });

  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVolunteer(true);
    try {
      await api.post('/public/volunteer', volunteerFormData);
      toast.success('Thank you for your application! We will contact you soon.');
      setIsVolunteerModalOpen(false);
      setVolunteerFormData({
        fullName: '',
        email: '',
        phone: '',
        skills: '',
        availability: ''
      });
    } catch (error) {
      console.error('Error submitting volunteer application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmittingVolunteer(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-slate-950 text-white rounded-[3rem] mx-4 md:mx-0">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#10b981_0%,transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,#059669_0%,transparent_40%)]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="max-w-3xl">
            {onBack && (
              <button 
                onClick={onBack}
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-[10px] font-black uppercase tracking-widest mb-6 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Return to Home
              </button>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-8"
            >
              <Globe size={14} />
              Official Intelligence Hub
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black mb-8 leading-[0.85] tracking-tighter uppercase"
            >
              System <br />
              <span className="text-emerald-500">Transparency.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-tight font-medium tracking-tight"
            >
              Access real-time updates, official notices, and community initiatives. Our platform ensures every citizen stays informed and empowered.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={onJoinClick}
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/20 flex items-center justify-center gap-3 group"
              >
                Join Movement
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onAboutClick}
                className="bg-white/5 backdrop-blur-md text-white border border-white/10 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                Learn More
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Access Grid - System Gateway Feel */}
      <section className="px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Account & Status */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <User size={20} />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Account Services</h3>
            </div>
            <div className="space-y-2">
              <button 
                onClick={onPortalClick}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-all group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Member Dashboard</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>
              <button 
                onClick={onStatusClick}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-all group"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Track Application</span>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* Core Actions */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Zap size={20} />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Take Action</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onJoinClick} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl transition-all group gap-2">
                <Users size={18} className="text-emerald-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Join</span>
              </button>
              <button onClick={() => setIsVolunteerModalOpen(true)} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl transition-all group gap-2">
                <Heart size={18} className="text-emerald-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Volunteer</span>
              </button>
              <button onClick={onDonateClick} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl transition-all group gap-2">
                <Zap size={18} className="text-emerald-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Donate</span>
              </button>
              <button onClick={onGrievanceClick} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 rounded-2xl transition-all group gap-2">
                <ShieldAlert size={18} className="text-emerald-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Help</span>
              </button>
            </div>
          </div>

          {/* Information */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onDocumentsClick} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 rounded-2xl transition-all group gap-2">
                <Download size={18} className="text-amber-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Manifesto</span>
              </button>
              <button onClick={onCandidatesClick} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 rounded-2xl transition-all group gap-2">
                <User size={18} className="text-amber-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Candidates</span>
              </button>
              <button onClick={onTrainingClick} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 rounded-2xl transition-all group gap-2">
                <GraduationCap size={18} className="text-amber-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Training</span>
              </button>
              <button onClick={onAboutClick} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 rounded-2xl transition-all group gap-2">
                <Globe size={18} className="text-amber-600" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">About</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      {sections?.map((section) => {
        let content: any = {};
        try {
          if (section.content) {
            content = JSON.parse(section.content);
          }
        } catch (e) {
          console.warn(`[PublicPortal] Invalid JSON in section "${section.title}"`, section.content);
          content = { headline: section.title, subheadline: 'Content configuration error' };
        }

        switch (section.type) {
          case 'HERO':
            return (
              <section key={section.id} className="relative py-20 md:py-24 overflow-hidden rounded-[3rem]" style={{ backgroundColor: content.bg_color || "#F8FAFC" }}>
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                  <div className="max-w-4xl">
                    {content.badge && (
                      <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-8" style={{ backgroundColor: `${content.headline_color || "#10b981"}15`, color: content.headline_color || "#10b981" }}>
                        {content.badge}
                      </span>
                    )}
                    <h2 className="text-4xl md:text-6xl font-black leading-[0.85] mb-8 tracking-tighter uppercase" style={{ color: content.headline_color || "#0f172a" }}>
                      {content.headline || section.title}
                    </h2>
                    <p className="text-lg md:text-xl mb-10 leading-tight max-w-2xl font-medium tracking-tight" style={{ color: content.subheadline_color || "#64748b" }}>
                      {content.subheadline}
                    </p>
                    {content.ctaText && (
                      <button 
                        onClick={() => content.ctaLink?.startsWith('http') ? window.open(content.ctaLink, '_blank') : onJoinClick?.()} 
                        className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3 group"
                        style={{ backgroundColor: content.cta_bg_color || "#10b981", color: content.cta_text_color || "#ffffff" }}
                      >
                        {content.ctaText} 
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </section>
            );
          case 'HIGHLIGHT':
            return (
              <section key={section.id} className="py-20 max-w-7xl mx-auto px-8">
                <div className="mb-12">
                  <h2 className="text-3xl font-black tracking-tight uppercase text-slate-900">{section.title}</h2>
                  {content.description && <p className="text-slate-500 mt-2 font-medium">{content.description}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {content.items?.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                      <h3 className="text-lg font-black mb-3 uppercase tracking-tight">{item.title}</h3>
                      <p className="text-slate-500 mb-6 text-sm font-medium leading-relaxed">{item.description}</p>
                      {item.linkText && (
                        <button onClick={() => item.linkUrl?.startsWith('http') ? window.open(item.linkUrl, '_blank') : null} className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                          {item.linkText} <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          case 'CTA':
            return (
              <section key={section.id} className="py-16 bg-emerald-600 rounded-[3rem] mx-4 md:mx-0">
                <div className="max-w-7xl mx-auto px-8 text-center">
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-6 uppercase tracking-tight">{content.headline || section.title}</h2>
                  <p className="text-emerald-50 text-lg mb-10 max-w-2xl mx-auto font-medium">{content.subheadline}</p>
                  <button 
                    onClick={() => content.ctaLink?.startsWith('http') ? window.open(content.ctaLink, '_blank') : onJoinClick?.()}
                    className="bg-white text-emerald-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/20"
                  >
                    {content.ctaText || 'Get Started'}
                  </button>
                </div>
              </section>
            );
          case 'CONTENT_BLOCK':
            return (
              <section key={section.id} className="py-20 max-w-7xl mx-auto px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className={content.imageLeft ? 'order-last lg:order-first' : ''}>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight uppercase tracking-tight">{content.headline || section.title}</h2>
                    <div className="prose prose-slate max-w-none mb-8 text-slate-600 font-medium">
                      <Markdown>{content.body || section.content}</Markdown>
                    </div>
                    {content.ctaText && (
                      <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                        {content.ctaText}
                      </button>
                    )}
                  </div>
                  <div className="bg-slate-100 rounded-[2.5rem] aspect-video overflow-hidden border border-slate-100">
                    {content.imageUrl ? (
                      <img src={content.imageUrl} alt={section.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Globe size={64} />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          case 'NOTICE_BANNER':
            return (
              <div key={section.id} className="bg-amber-50 border-y border-amber-100 py-4">
                <div className="max-w-7xl mx-auto px-8 flex items-center justify-center gap-3">
                  <Megaphone size={18} className="text-amber-600" />
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">{content.text || section.title}</span>
                  {content.linkText && (
                    <a href={content.linkUrl || '#'} className="text-[10px] font-black text-amber-600 underline underline-offset-4 uppercase tracking-widest">
                      {content.linkText}
                    </a>
                  )}
                </div>
              </div>
            );
          default:
            return null;
        }
      })}


      {/* Latest News & Notices */}
      <section className="py-32 bg-white px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            
            {/* News */}
            <div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-16 gap-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                    <Zap size={12} />
                    Intelligence Feed
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase text-slate-900 leading-[0.85]">Latest <br /><span className="text-emerald-600">News.</span></h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      activeCategory === null ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900'
                    }`}
                  >
                    All
                  </button>
                  {categories?.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        activeCategory === cat.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-6">
                {news?.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handlePostClick(item)}
                    className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-8 flex flex-col sm:flex-row gap-8 cursor-pointer group relative"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="w-full sm:w-40 h-40 bg-slate-100 rounded-3xl flex-shrink-0 overflow-hidden border border-slate-100 relative z-10">
                      {item.featuredImage ? (
                        <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <FileText size={48} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Calendar size={12} />
                          {new Date(item.publishedAt || item.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        {item.isPinned && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            Pinned
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black mb-4 text-slate-900 leading-[1.1] group-hover:text-emerald-600 transition-colors uppercase tracking-tight line-clamp-2">{item.title}</h3>
                      <div className="flex items-center justify-between mt-auto">
                        {item.category && (
                          <span className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">
                            <Tag size={12} /> {item.category.name}
                          </span>
                        )}
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          Read Full Story <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {news.length === 0 && !loading && (
                  <div className="py-24 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                      <FileText size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">No News Available</h3>
                    <p className="text-slate-500 max-w-xs mx-auto font-medium">
                      Official updates will appear here once published by the administration.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notices */}
            <div>
              <div className="flex justify-between items-end mb-16">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                    <ShieldAlert size={12} />
                    Critical Alerts
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase text-slate-900 leading-[0.85]">Official <br /><span className="text-amber-600">Notices.</span></h2>
                </div>
              </div>
              <div className="grid gap-6">
                {(notices || [])?.filter(n => !n.isPopup).map((notice) => (
                  <div key={notice.id} className={`bg-white rounded-[2.5rem] border ${notice.isPinned ? 'border-amber-500 shadow-amber-50' : 'border-slate-100'} shadow-sm hover:shadow-2xl transition-all p-10 group relative overflow-hidden`}>
                    {notice.isPinned && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
                    
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 shadow-inner">
                          <Megaphone size={28} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Public Announcement</p>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ref: {notice.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      {notice.isPinned && (
                        <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                          Priority
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black mb-6 text-slate-900 uppercase tracking-tight group-hover:text-amber-600 transition-colors leading-tight">{notice.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-8 line-clamp-3 text-sm">{notice.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Issued: {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                      {notice.externalUrl && (
                        <a href={notice.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] hover:text-amber-600 transition-colors">
                          Download Document <Download size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {(notices || []).filter(n => !n.isPopup).length === 0 && !loading && (
                  <div className="py-24 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-white text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                      <Megaphone size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">No Active Notices</h3>
                    <p className="text-slate-500 max-w-xs mx-auto font-medium">
                      There are currently no public notices or official announcements.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Events */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-end mb-12">
                <h2 className="text-4xl font-black tracking-tight uppercase">Upcoming Events</h2>
                <button 
                  onClick={onPortalClick}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
                >
                  View All Events <ArrowRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {(events || [])?.map((event) => (
                  <div key={event.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.summary || event.description}</p>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                      {new Date(event.eventDate).toLocaleDateString()} at {event.startAt}
                    </div>
                  </div>
                ))}
                {(events || []).length === 0 && !loading && (
                  <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm col-span-full">
                    <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">No Upcoming Events</h3>
                    <p className="text-slate-500 text-lg max-w-md mx-auto">
                      We are currently planning our next community meetings, rallies, and events. Please stay tuned for updates.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Public Surveys & Polls */}
            {(surveys.length > 0 || polls.length > 0) && (
              <div className="lg:col-span-2 mt-12">
                <div className="flex justify-between items-end mb-12">
                  <h2 className="text-4xl font-black tracking-tight uppercase text-emerald-600">Community Voice</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {surveys?.map((survey) => (
                    <div key={survey.id} className="bg-emerald-50 rounded-3xl border border-emerald-100 shadow-sm p-8">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare size={20} className="text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Survey</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{survey.title}</h3>
                      <p className="text-slate-600 text-sm mb-6">{survey.description}</p>
                      <button onClick={() => toast.info('Please log in to participate in this survey.')} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all">
                        Take Survey
                      </button>
                    </div>
                  ))}
                  {polls?.map((poll) => (
                    <div key={poll.id} className="bg-blue-50 rounded-3xl border border-blue-100 shadow-sm p-8">
                      <div className="flex items-center gap-2 mb-4">
                        <Megaphone size={20} className="text-blue-600" />
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Poll</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{poll.title}</h3>
                      <div className="space-y-3 mt-4">
                        {poll.options?.map((opt: string, idx: number) => (
                          <button key={idx} onClick={() => toast.info('Please log in to vote in this poll.')} className="w-full py-2 px-4 bg-white border border-blue-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition-all text-left">
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="relative h-64 md:h-80 bg-slate-100">
              {selectedPost.featuredImage ? (
                <img src={selectedPost.featuredImage} alt={selectedPost.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <FileText size={80} />
                </div>
              )}
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <Calendar size={16} />
                  {new Date(selectedPost.publishedAt || selectedPost.createdAt).toLocaleDateString()}
                </div>
                {selectedPost.category && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full">
                    <Tag size={14} />
                    {selectedPost.category.name}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <User size={16} />
                  {selectedPost.author?.displayName || 'Admin'}
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight">
                {selectedPost.title}
              </h2>

              <div className="prose prose-slate max-w-none">
                <Markdown>{selectedPost.content}</Markdown>
              </div>

              {/* Inline Surveys & Polls */}
              {(postSurveys.length > 0 || postPolls.length > 0) && (
                <div className="mt-12 pt-12 border-t border-slate-100">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare size={20} className="text-emerald-600" />
                    Related Feedback
                  </h3>
                  <div className="grid gap-6">
                  {(postSurveys || [])?.map((survey) => (
                      <div key={survey.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h4 className="font-bold mb-2">{survey.title}</h4>
                        <p className="text-sm text-slate-600 mb-4">{survey.description}</p>
                        <button onClick={() => toast.info('Please log in to participate in this survey.')} className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all">
                          Start Survey
                        </button>
                      </div>
                    ))}
                  {(postPolls || [])?.map((poll) => (
                      <div key={poll.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h4 className="font-bold mb-4">{poll.title}</h4>
                        <div className="grid gap-2">
                          {poll.options?.map((opt: string, idx: number) => (
                            <button key={idx} onClick={() => toast.info('Please log in to vote in this poll.')} className="w-full py-2 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left">
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedPost(null)}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Modal */}
      {isVolunteerModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase">Volunteer Application</h2>
              <button onClick={() => setIsVolunteerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleVolunteerSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={volunteerFormData.fullName}
                  onChange={e => setVolunteerFormData({ ...volunteerFormData, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Email</label>
                  <input
                    required
                    type="email"
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={volunteerFormData.email}
                    onChange={e => setVolunteerFormData({ ...volunteerFormData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Phone</label>
                  <input
                    required
                    type="tel"
                    className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={volunteerFormData.phone}
                    onChange={e => setVolunteerFormData({ ...volunteerFormData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Skills</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Social Media, Event Planning"
                  className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={volunteerFormData.skills}
                  onChange={e => setVolunteerFormData({ ...volunteerFormData, skills: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Availability</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Weekends, Evenings"
                  className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={volunteerFormData.availability}
                  onChange={e => setVolunteerFormData({ ...volunteerFormData, availability: e.target.value })}
                />
              </div>
              <div className="pt-4">
                <button
                  disabled={submittingVolunteer}
                  type="submit"
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingVolunteer && <Loader2 className="animate-spin" size={20} />}
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
