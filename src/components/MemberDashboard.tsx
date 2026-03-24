import React, { useState, useEffect } from 'react';
import { UserProfile, Event } from '../types';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { 
  User, 
  CreditCard, 
  Calendar, 
  Megaphone, 
  Heart, 
  MessageSquare, 
  ChevronRight, 
  Award,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  ListTodo,
  Mail,
  Phone,
  Globe,
  Printer,
  Settings,
  X,
  CheckCircle
} from 'lucide-react';
import MemberIdCard from './MemberIdCard';
import { MemberProfileSettings } from './MemberProfileSettings';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MemberDashboardProps {
  user: UserProfile;
  onViewEvent: (id: string) => void;
}

interface MemberProfile {
  id: string;
  fullName: string;
  membershipId: string;
  trackingCode: string;
  status: string;
  province: string;
  joinedDate: string;
  terminationHistory?: string;
  cardStatus?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  issueDate?: string;
  expiryDate?: string;
  qrCodeUrl?: string;
  profilePhotoUrl?: string;
  paymentMethod?: string;
  orgUnit: {
    name: string;
    level: string;
  };
  stats: {
    totalDonated: number;
    eventsAttended: number;
    volunteerHours: number;
    activeGrievances: number;
    pendingTasks: number;
    upcomingEvents: number;
  };
}

import { PaymentMethodSelector } from './ui/PaymentMethodSelector';

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ user, onViewEvent }) => {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewalNote, setRenewalNote] = useState('');
  const [renewalError, setRenewalError] = useState('');
  const [renewalSuccess, setRenewalSuccess] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);

  const fetchRenewals = async () => {
    try {
      const renewalsData = await api.get('/members/me/renewals');
      setRenewals(renewalsData);
    } catch (error) {
      console.error('Error fetching renewals:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, newsData, eventsData, noticesData] = await Promise.all([
          api.get('/members/me'),
          api.get('/public/posts?type=NEWS&limit=2'),
          api.get('/v1/app-events/members'),
          api.get('/communication/notices/members')
        ]);
        
        setProfile(profileData);
        setNews(newsData.slice(0, 2));
        setEvents(eventsData.slice(0, 2));
        setNotices(noticesData);
        await fetchRenewals();
      } catch (error) {
        console.error('Error fetching member data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) {
      setRenewalError('Please select a payment method.');
      return;
    }
    setRenewalError('');
    setRenewalSuccess('');
    try {
      await api.post('/members/me/renewals', { 
        memberNote: renewalNote,
        paymentMethod: selectedMethod.provider
      });
      
      const isManual = selectedMethod.instructions ? true : false;
      setRenewalSuccess(isManual 
        ? 'Renewal request initiated. Please follow the payment instructions provided.' 
        : 'Renewal request submitted successfully.'
      );
      
      setRenewalNote('');
      setSelectedMethod(null);
      setIsRenewing(false);
      await fetchRenewals();
    } catch (err: any) {
      setRenewalError(err.message || 'Failed to submit renewal request.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl text-amber-800 text-center max-w-2xl mx-auto mt-12">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} className="text-amber-600" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Profile Not Found</h2>
        <p className="text-amber-700 mb-8">We couldn't find your membership profile. If you have already applied, please check your application status using your tracking code.</p>
        <button 
          onClick={() => window.location.reload()} // Or navigate to status portal if possible
          className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all"
        >
          Refresh Profile
        </button>
      </div>
    );
  }

  if (profile.status !== 'ACTIVE') {
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'REJECTED': 
        case 'TERMINATED':
        case 'SUSPENDED':
          return <XCircle className="text-rose-500" size={48} />;
        default: return <Clock className="text-amber-500" size={48} />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'REJECTED': 
        case 'TERMINATED':
        case 'SUSPENDED':
          return 'bg-rose-100 text-rose-700 border-rose-200';
        default: return 'bg-amber-100 text-amber-700 border-amber-200';
      }
    };

    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 md:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 p-4 bg-slate-50 rounded-full">
              {getStatusIcon(profile.status)}
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Application Status</h1>
            <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border mb-8 ${getStatusColor(profile.status)}`}>
              {profile.status}
            </div>
            
            <p className="text-slate-600 mb-10">
              {profile.status === 'PENDING' || profile.status === 'VERIFIED' 
                ? "Your membership application is currently being reviewed by our administrative team. We'll notify you once a decision is made."
                : profile.status === 'REJECTED'
                ? "Unfortunately, your membership application has been rejected. Please see the reason below."
                : profile.status === 'SUSPENDED'
                ? "Your membership is currently suspended. Please contact the administrator for more information."
                : profile.status === 'TERMINATED'
                ? "Your membership has been terminated. Please contact the administrator for more information."
                : "Your application is in progress."}
            </p>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                <p className="font-bold text-slate-700">{profile.fullName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking Code</p>
                <p className="font-mono font-bold text-slate-700">{profile.trackingCode || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                <p className="font-bold text-slate-700 uppercase">{profile.paymentMethod || 'N/A'}</p>
              </div>
            </div>

            {(profile.status === 'REJECTED' || profile.status === 'TERMINATED' || profile.status === 'SUSPENDED') && (
              <div className="w-full p-6 bg-rose-50 border border-rose-100 rounded-3xl text-left mb-10">
                <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-2">Reason</p>
                <p className="text-rose-700 font-medium">
                  {(() => {
                    if (profile.terminationHistory) {
                      try {
                        const history = JSON.parse(profile.terminationHistory);
                        if (Array.isArray(history) && history.length > 0) {
                          return history[history.length - 1].reason;
                        }
                      } catch (e) {
                        console.error('Error parsing termination history:', e);
                      }
                    }
                    return 'Please contact the administrator for more details.';
                  })()}
                </p>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Donated', value: profile.stats.totalDonated / 1000 }, // Simplified for chart
    { name: 'Events', value: profile.stats.eventsAttended },
    { name: 'Hours', value: profile.stats.volunteerHours },
  ];

  if (isEditingProfile) {
    return (
      <MemberProfileSettings 
        profile={profile} 
        onBack={() => setIsEditingProfile(false)} 
        onUpdate={async () => {
          try {
            const profileData = await api.get('/members/me');
            setProfile(profileData);
          } catch (error) {
            console.error('Error refreshing profile:', error);
          }
        }} 
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Member Portal</h1>
          <p className="text-slate-500">Welcome back, {user.displayName}. Here's your activity overview.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Settings size={16} />
            Profile Settings
          </button>
          <button className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-200 transition-all flex items-center gap-2 hidden sm:flex">
            <Share2 size={16} />
            Refer a Friend
          </button>
          
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs text-slate-500 font-medium">
              Expires: {profile.expiryDate ? new Date(profile.expiryDate).toLocaleDateString() : 'N/A'}
            </div>
            {renewals.some(r => r.status === 'PENDING') ? (
              <button disabled className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl font-bold text-sm cursor-not-allowed flex items-center gap-2">
                <Clock size={16} />
                Renewal Pending
              </button>
            ) : (
              <div className="flex flex-col items-end">
                <button onClick={() => setIsRenewing(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                  Renew
                </button>
                {renewals.length > 0 && renewals[0].status === 'REJECTED' && (
                  <div className="mt-2 text-[10px] text-red-600 font-medium flex items-center gap-1 max-w-[200px] text-right">
                    <AlertCircle size={10} className="shrink-0" />
                    Last request rejected: {renewals[0].adminNote || 'No reason provided'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {renewalSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} />
          <p className="font-medium">{renewalSuccess}</p>
        </div>
      )}

      {isRenewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Request Renewal</h3>
              <button onClick={() => setIsRenewing(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <p className="text-slate-600 mb-6 text-sm">
              Submit a request to renew your membership. An administrator will review your request and extend your membership expiry date.
            </p>

            <form onSubmit={handleRenewalSubmit}>
              <div className="mb-6">
                <PaymentMethodSelector 
                  module="RENEWALS"
                  selectedMethodId={selectedMethod?.id || null}
                  onSelect={setSelectedMethod}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Note (Optional)
                </label>
                <textarea
                  value={renewalNote}
                  onChange={(e) => setRenewalNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                  placeholder="Any message for the admin..."
                />
              </div>

              {renewalError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {renewalError}
                </div>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsRenewing(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedMethod}
                  className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Donated', value: `NPR ${profile.stats.totalDonated.toLocaleString()}`, icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Events Attended', value: profile.stats.eventsAttended, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Volunteer Hours', value: `${profile.stats.volunteerHours} hrs`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Active Grievances', value: profile.stats.activeGrievances, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Pending Tasks', value: profile.stats.pendingTasks, icon: ListTodo, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Upcoming Events', value: profile.stats.upcomingEvents, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shrink-0`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden fixed-size card for export only - positioned off-screen but NOT invisible */}
      <div 
        className="fixed top-0 pointer-events-none" 
        style={{ left: '-9999px', width: '632px', height: '400px', backgroundColor: '#ffffff' }}
      >
        <MemberIdCard member={profile as any} id="member-id-card-export-target-dashboard" isExporting={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: ID Card & Chart */}
        <div className="space-y-8">
          {/* Digital ID Card */}
          <div className="space-y-4">
            <MemberIdCard member={profile as any} id="member-id-card-dashboard" />
            <div className="flex gap-3">
              <button 
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
              >
                <Printer size={14} />
                Print Card
              </button>
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
                onClick={async () => {
                  const cardElement = document.getElementById('member-id-card-export-target-dashboard');
                  if (!cardElement) return;
                  try {
                    const html2canvas = (await import('html2canvas')).default;
                    
                    // Wait for fonts to be ready
                    if (document.fonts) {
                      await document.fonts.ready;
                    }

                    // Ensure all images are fully loaded and decoded before capture
                    const images = cardElement.getElementsByTagName('img');
                    const loadPromises = Array.from(images).map(async (img) => {
                      if (!img.complete) {
                        await new Promise((resolve) => {
                          img.onload = resolve;
                          img.onerror = resolve;
                        });
                      }
                      // Try to decode the image to ensure it's actually ready to be painted
                      try {
                        if ('decode' in img) {
                          await img.decode();
                        }
                      } catch (e) {
                        console.warn('Image decode failed, proceeding anyway', e);
                      }
                    });
                    
                    await Promise.all(loadPromises);
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const canvas = await html2canvas(cardElement, { 
                      scale: 2, 
                      useCORS: true,
                      backgroundColor: '#ffffff',
                      logging: false,
                      width: 632,
                      height: 400,
                      x: 0,
                      y: 0,
                      scrollX: 0,
                      scrollY: 0,
                      windowWidth: 632,
                      windowHeight: 400,
                      onclone: (clonedDoc) => {
                        const clonedElement = clonedDoc.getElementById('member-id-card-export-target-dashboard');
                        if (clonedElement) {
                          clonedElement.style.visibility = 'visible';
                          clonedElement.style.position = 'static';
                          clonedElement.style.left = 'auto';
                          clonedElement.style.top = 'auto';
                        }
                      }
                    });
                    
                    const link = document.createElement('a');
                    link.download = `NUP-Member-Card.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                <Download size={14} />
                Download
              </button>
            </div>
          </div>
          
          {/* Activity Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Activity Overview</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#a855f7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle Column: News & Events */}
        <div className="lg:col-span-2 space-y-8">
          {/* Notices Feed */}
          {notices.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Megaphone size={20} className="text-emerald-500" />
                  Important Notices
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {notices.map((notice) => (
                  <div key={notice.id} className={`p-4 rounded-2xl border ${notice.isPinned ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <h4 className="font-bold text-slate-800 mb-1">{notice.title}</h4>
                    <p className="text-xs text-slate-600 mb-2">{notice.content}</p>
                    {notice.externalUrl && (
                      <a href={notice.externalUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold text-xs hover:underline">View Details</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News Feed */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Megaphone size={20} className="text-emerald-500" />
                Latest Updates
              </h3>
              <button className="text-sm font-bold text-emerald-600 hover:underline">View All</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {news.length > 0 ? news.map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-video bg-slate-100 rounded-2xl mb-3 overflow-hidden">
                    <img src={item.featuredImage || `https://picsum.photos/seed/${item.title}/400/225`} alt="News" className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                    {item.type}
                  </span>
                  <h4 className="font-bold text-slate-800 mt-2 group-hover:text-emerald-600 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{format(new Date(item.publishedAt || item.createdAt), 'MMM d, yyyy')}</p>
                </div>
              )) : (
                <div className="col-span-2 text-center py-8 text-slate-500">
                  No news updates available.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-blue-500" />
                Upcoming Events
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {events.length > 0 ? events.map((event, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold uppercase leading-none">{format(new Date(event.startDate), 'MMM')}</span>
                      <span className="text-lg font-black leading-none">{format(new Date(event.startDate), 'd')}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{event.title}</h4>
                      <p className="text-xs text-slate-500">{event.location} • {event.type}</p>
                      <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center gap-2">
                        <span className="font-semibold">Organizer: {event.organizer.name}</span>
                        <a href={`mailto:${event.organizer.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Mail size={12} /> Email
                        </a>
                        <a href={`tel:${event.organizer.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Phone size={12} /> Call
                        </a>
                        {event.organizer.socialMedia.facebook && (
                          <a href={event.organizer.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Globe size={12} /> FB
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onViewEvent(event.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-500">
                  No upcoming events.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
