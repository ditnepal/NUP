import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Globe, Menu, X, ChevronRight, Megaphone, Users, Heart, MessageSquare, Download, FileText, User, ExternalLink, GraduationCap, Calendar, Tag, Loader2, Search, MapPin, Phone, Mail, ArrowRight, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
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
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ user, onPortalClick, onDocumentsClick, onTrainingClick, onJoinClick, onStatusClick, onDonateClick, onGrievanceClick, onCandidatesClick, onCampaignsClick, onAboutClick, onHomeClick }) => {
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
      <section className="relative py-20 md:py-32 overflow-hidden bg-slate-900 text-white rounded-3xl">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
              Official Portal
            </span>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
              Building a <span className="text-emerald-400 italic">Prosperous</span> Nepal Together.
            </h1>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl leading-relaxed">
              Join the movement for change. Our portal provides the latest news, updates, and resources for our members and supporters.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onJoinClick}
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 flex items-center gap-3 group"
              >
                Join the Movement
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onAboutClick}
                className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-white/20 transition-all"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Dynamic Sections or Baseline Fallback */}
      {sections.length > 0 ? (
        sections.map((section) => {
          let content: any = {};
          try {
            if (section.content) {
              content = JSON.parse(section.content);
            }
          } catch (e) {
            // If JSON parsing fails, try to provide a minimal fallback to prevent crash
            // and log a more helpful message for developers
            console.warn(`[PublicPortal] Invalid JSON in section "${section.title}" (ID: ${section.id}). Content:`, section.content);
            content = { headline: section.title, subheadline: 'Content configuration error' };
          }

          switch (section.type) {
            case 'HERO':
              const headlineColor = content.headline_color || "#DC143C";
              const subheadlineColor = content.subheadline_color || "#006400";
              const ctaBgColor = content.cta_bg_color || "#FFD700";
              const ctaTextColor = content.cta_text_color || "#000000";

              return (
                <section 
                  key={section.id} 
                  className="relative py-24 md:py-32 overflow-hidden"
                  style={{ backgroundColor: content.bg_color || "#F8FAFC" }}
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-4xl">
                      {content.badge && (
                        <span 
                          className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
                          style={{ 
                            backgroundColor: `${headlineColor}15`,
                            color: headlineColor 
                          }}
                        >
                          {content.badge}
                        </span>
                      )}
                      
                      <h1 
                        className="text-6xl md:text-8xl font-black leading-[0.85] mb-8 tracking-tighter"
                        style={{ color: headlineColor }}
                      >
                        {content.headline || section.title}
                      </h1>
                      
                      <p 
                        className="text-xl md:text-2xl mb-12 leading-relaxed max-w-2xl font-medium"
                        style={{ color: subheadlineColor }}
                      >
                        {content.subheadline}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-5">
                        {content.ctaText && (
                          <button 
                            onClick={() => content.ctaLink?.startsWith('http') ? window.open(content.ctaLink, '_blank') : onJoinClick?.()} 
                            className="px-10 py-5 rounded-2xl text-xl font-black transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center gap-3 group"
                            style={{ 
                              backgroundColor: ctaBgColor, 
                              color: ctaTextColor,
                              boxShadow: `0 20px 40px -10px ${ctaBgColor}40`
                            }}
                          >
                            {content.ctaText} 
                            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                        
                        {content.secondaryCtaText && (
                          <button 
                            onClick={onStatusClick}
                            className="bg-white/80 backdrop-blur-sm text-slate-800 border-2 border-slate-200 px-10 py-5 rounded-2xl text-xl font-bold hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg"
                          >
                            {content.secondaryCtaText}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative background element */}
                  <div 
                    className="absolute top-0 right-0 w-1/2 h-full -skew-x-12 translate-x-1/4 z-0 hidden lg:block opacity-5"
                    style={{ backgroundColor: headlineColor }}
                  ></div>
                </section>
              );
            case 'HIGHLIGHT':
              return (
                <section key={section.id} className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="mb-12">
                    <h2 className="text-3xl font-black tracking-tight uppercase">{section.title}</h2>
                    {content.description && <p className="text-slate-500 mt-2">{content.description}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {content.items?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                        <p className="text-slate-500 mb-6">{item.description}</p>
                        {item.linkText && (
                          <a href={item.linkUrl || '#'} className="text-emerald-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
                            {item.linkText} <ChevronRight size={16} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            case 'CTA':
              return (
                <section key={section.id} className="py-20 bg-emerald-600">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-black text-white mb-6">{content.headline || section.title}</h2>
                    <p className="text-emerald-50 text-xl mb-10 max-w-2xl mx-auto">{content.subheadline}</p>
                    <button 
                      onClick={() => content.ctaLink?.startsWith('http') ? window.open(content.ctaLink, '_blank') : onJoinClick?.()}
                      className="bg-white text-emerald-600 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-900/20"
                    >
                      {content.ctaText || 'Get Started'}
                    </button>
                  </div>
                </section>
              );
            case 'CONTENT_BLOCK':
              return (
                <section key={section.id} className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className={content.imageLeft ? 'order-last lg:order-first' : ''}>
                      <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">{content.headline || section.title}</h2>
                      <div className="prose prose-slate max-w-none mb-8">
                        <Markdown>{content.body || section.content}</Markdown>
                      </div>
                      {content.ctaText && (
                        <button className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
                          {content.ctaText}
                        </button>
                      )}
                    </div>
                    <div className="bg-slate-100 rounded-3xl aspect-video overflow-hidden">
                      {content.imageUrl ? (
                        <img src={content.imageUrl} alt={section.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Globe size={80} />
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            case 'NOTICE_BANNER':
              return (
                <div key={section.id} className="bg-amber-50 border-y border-amber-100 py-3">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-3">
                    <Megaphone size={18} className="text-amber-600" />
                    <span className="text-sm font-bold text-amber-900">{content.text || section.title}</span>
                    {content.linkText && (
                      <a href={content.linkUrl || '#'} className="text-sm font-black text-amber-600 underline underline-offset-4">
                        {content.linkText}
                      </a>
                    )}
                  </div>
                </div>
              );
            default:
              return null;
          }
        })
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative py-24 md:py-32 overflow-hidden bg-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-emerald-500/20"
                >
                  <Globe size={12} />
                  Official Public Portal
                </motion.div>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-6xl md:text-8xl font-black text-white leading-[0.85] mb-8 tracking-tighter uppercase"
                >
                  Stay Informed. <br />
                  <span className="text-emerald-500">Stay Connected.</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-slate-400 mb-10 leading-relaxed max-w-xl font-medium"
                >
                  The official source for party news, policy updates, and community announcements. Real-time data from the heart of our movement.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col sm:flex-row gap-5"
                >
                  <button onClick={onJoinClick} className="bg-emerald-600 text-white px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/20 flex items-center justify-center gap-3 group">
                    Join the Movement <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={onStatusClick} className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                    Check Status
                  </button>
                </motion.div>
              </div>
            </div>
            
            {/* Abstract Background Element */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-600/5 -skew-x-12 translate-x-1/4 z-0 hidden lg:block"></div>
          </section>

          {/* Action Blocks */}
          <section className="py-24 px-8">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 hover:border-emerald-500 transition-all group relative overflow-hidden">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 border border-emerald-500/20">
                  <Heart size={32} />
                </div>
                <h3 className="text-2xl font-black mb-4 text-slate-900 uppercase tracking-tight">Volunteer</h3>
                <p className="text-slate-500 mb-8 leading-relaxed font-medium">Contribute your skills and time to our local campaigns and initiatives. Be the change.</p>
                <button 
                  onClick={() => setIsVolunteerModalOpen(true)}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all"
                >
                  Apply Now <ChevronRight size={18} />
                </button>
              </div>

              <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 hover:border-emerald-500 transition-all group relative overflow-hidden">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-3xl flex items-center justify-center mb-8 border border-amber-500/20">
                  <Megaphone size={32} />
                </div>
                <h3 className="text-2xl font-black mb-4 text-slate-900 uppercase tracking-tight">Donate</h3>
                <p className="text-slate-500 mb-8 leading-relaxed font-medium">Support our mission with a financial contribution. Every contribution fuels our progress.</p>
                <button onClick={onDonateClick} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all">Contribute <ChevronRight size={18} /></button>
              </div>

              <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 hover:border-emerald-500 transition-all group relative overflow-hidden">
                <div className="w-16 h-16 bg-slate-200 text-slate-600 rounded-3xl flex items-center justify-center mb-8 border border-slate-300">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-2xl font-black mb-4 text-slate-900 uppercase tracking-tight">Complaints</h3>
                <p className="text-slate-500 mb-8 leading-relaxed font-medium">Report issues in your local area or provide feedback to the party. We listen.</p>
                <button onClick={onGrievanceClick} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all">Submit Issue <ChevronRight size={18} /></button>
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      {/* Latest News & Notices */}
      <section className="py-24 bg-slate-50 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* News */}
            <div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
                <h2 className="text-4xl font-black tracking-tight uppercase">Latest News</h2>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                      activeCategory === null ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        activeCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-8">
                {news.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handlePostClick(item)}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all p-8 flex gap-6 cursor-pointer group"
                  >
                    <div className="w-24 h-24 bg-slate-200 rounded-2xl flex-shrink-0 overflow-hidden">
                      {item.featuredImage ? (
                        <img src={item.featuredImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <FileText size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                          {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                        </span>
                        {item.isPinned && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider">
                            Pinned
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                      {item.category && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {item.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {news.length === 0 && !loading && (
                  <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">No News Available</h3>
                    <p className="text-slate-500 text-lg max-w-md mx-auto">
                      We are currently updating our news feed. Check back soon for the latest updates and announcements from {systemConfig['PARTY_NAME']}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notices */}
            <div>
              <div className="flex justify-between items-end mb-12">
                <h2 className="text-4xl font-black tracking-tight uppercase">Notices</h2>
              </div>
              <div className="grid gap-6">
                {notices.filter(n => !n.isPopup).map((notice) => (
                  <div key={notice.id} className={`bg-white rounded-3xl border ${notice.isPinned ? 'border-emerald-200 shadow-emerald-50' : 'border-slate-100'} shadow-sm p-8`}>
                    {notice.isPinned && (
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                        Pinned
                      </span>
                    )}
                    <h3 className="text-xl font-bold mb-2">{notice.title}</h3>
                    <p className="text-slate-600 text-sm mb-4">{notice.content}</p>
                    {notice.externalUrl && (
                      <a href={notice.externalUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                        View Details <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                ))}
                {notices.filter(n => !n.isPopup).length === 0 && !loading && (
                  <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Megaphone size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">No Active Notices</h3>
                    <p className="text-slate-500 text-lg max-w-md mx-auto">
                      There are currently no public notices or official announcements published at this time.
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
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.summary || event.description}</p>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                      {new Date(event.eventDate).toLocaleDateString()} at {event.startAt}
                    </div>
                  </div>
                ))}
                {events.length === 0 && !loading && (
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
                  {surveys.map((survey) => (
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
                  {polls.map((poll) => (
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
                    {postSurveys.map((survey) => (
                      <div key={survey.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h4 className="font-bold mb-2">{survey.title}</h4>
                        <p className="text-sm text-slate-600 mb-4">{survey.description}</p>
                        <button onClick={() => toast.info('Please log in to participate in this survey.')} className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all">
                          Start Survey
                        </button>
                      </div>
                    ))}
                    {postPolls.map((poll) => (
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
