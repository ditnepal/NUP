import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Globe, Menu, X, ChevronRight, Megaphone, Users, Heart, MessageSquare, Download, FileText, User, ExternalLink, GraduationCap, Calendar, Tag, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import Markdown from 'react-markdown';

interface PublicPortalProps {
  user?: UserProfile | null;
  onPortalClick?: () => void;
  onDocumentsClick?: () => void;
  onTrainingClick?: () => void;
  onJoinClick?: () => void;
  onStatusClick?: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ user, onPortalClick, onDocumentsClick, onTrainingClick, onJoinClick, onStatusClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicData();
    fetchCategories();
    fetchPublicSurveysAndPolls();
  }, []);

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
        api.get('/v1/public/surveys?placementType=PUBLIC_PORTAL'),
        api.get('/v1/public/polls?placementType=PUBLIC_PORTAL')
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
        api.get(`/v1/public/surveys?placementType=CONTENT_INLINE&targetSlug=${slug}`),
        api.get(`/v1/public/polls?placementType=CONTENT_INLINE&targetSlug=${slug}`)
      ]);
      setPostSurveys(surveysData);
      setPostPolls(pollsData);
    } catch (error) {
      console.error('Error fetching post surveys/polls:', error);
    }
  };

  const fetchPublicData = async () => {
    try {
      const [noticesData, eventsData] = await Promise.all([
        api.get('/communication/notices/public'),
        api.get('/v1/app-events/public')
      ]);
      setNotices(noticesData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching public data:', error);
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
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/public/categories?type=POST');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
      alert('Thank you for your application! We will contact you soon.');
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
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmittingVolunteer(false);
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
              <a href="#news" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">News</a>
              <button onClick={onTrainingClick} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Training</button>
              <button onClick={onStatusClick} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Check Status</button>
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Contact</a>
              {user ? (
                <button 
                  onClick={onPortalClick}
                  className="bg-slate-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                >
                  <User size={16} />
                  Member Portal
                </button>
              ) : (
                <button className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                  Join Us
                </button>
              )}
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
            <a href="#news" className="text-2xl font-bold text-slate-800">News</a>
            <button onClick={onTrainingClick} className="text-2xl font-bold text-slate-800 text-left">Training</button>
            <button onClick={onStatusClick} className="text-2xl font-bold text-slate-800 text-left">Check Status</button>
            <a href="#" className="text-2xl font-bold text-slate-800">Contact</a>
            {user ? (
              <button 
                onClick={onPortalClick}
                className="bg-slate-900 text-white w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2"
              >
                <User size={20} />
                Member Portal
              </button>
            ) : (
              <button className="bg-emerald-600 text-white w-full py-4 rounded-2xl text-lg font-bold">
                Join Us
              </button>
            )}
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
              <button onClick={onJoinClick} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2">
                Become a Member <ChevronRight size={20} />
              </button>
              <button onClick={onStatusClick} className="bg-white text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                Check Application Status
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
            <button 
              onClick={() => setIsVolunteerModalOpen(true)}
              className="text-blue-600 font-bold flex items-center gap-1 hover:gap-2 transition-all"
            >
              Apply Now <ChevronRight size={16} />
            </button>
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
            <button onClick={onDocumentsClick} className="text-rose-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">Browse Files <ChevronRight size={16} /></button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3">Training</h3>
            <p className="text-slate-500 mb-6">Access official party training materials and educational resources.</p>
            <button onClick={onTrainingClick} className="text-emerald-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">View Programs <ChevronRight size={16} /></button>
          </div>
        </div>
      </section>

      {/* Latest News & Notices */}
      <section id="news" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <div className="py-10 text-center text-slate-400 italic">
                    No news found in this category.
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
                {notices.map((notice) => (
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
                {notices.length === 0 && !loading && (
                  <div className="py-10 text-center text-slate-400 italic">
                    No notices published at this time.
                  </div>
                )}
              </div>
            </div>

            {/* Events */}
            <div className="lg:col-span-2">
              <div className="flex justify-between items-end mb-12">
                <h2 className="text-4xl font-black tracking-tight uppercase">Upcoming Events</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-slate-600 text-sm mb-4">{event.summary}</p>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                      {new Date(event.eventDate).toLocaleDateString()} at {event.startAt}
                    </div>
                  </div>
                ))}
                {events.length === 0 && !loading && (
                  <div className="py-10 text-center text-slate-400 italic">
                    No upcoming events at this time.
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
                      <button onClick={() => alert('Please log in to participate in this survey.')} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all">
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
                          <button key={idx} onClick={() => alert('Please log in to vote in this poll.')} className="w-full py-2 px-4 bg-white border border-blue-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-blue-100 transition-all text-left">
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
                        <button onClick={() => alert('Please log in to participate in this survey.')} className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all">
                          Start Survey
                        </button>
                      </div>
                    ))}
                    {postPolls.map((poll) => (
                      <div key={poll.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h4 className="font-bold mb-4">{poll.title}</h4>
                        <div className="grid gap-2">
                          {poll.options?.map((opt: string, idx: number) => (
                            <button key={idx} onClick={() => alert('Please log in to vote in this poll.')} className="w-full py-2 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left">
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
