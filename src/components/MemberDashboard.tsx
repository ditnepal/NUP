import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
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
  Loader2,
  AlertCircle,
  ListTodo
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MemberDashboardProps {
  user: UserProfile;
  onViewEvent: (id: string) => void;
}

interface MemberProfile {
  id: string;
  fullName: string;
  membershipId: string;
  status: string;
  province: string;
  joinedDate: string;
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

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ user, onViewEvent }) => {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, newsData, eventsData] = await Promise.all([
          api.get('/members/me'),
          api.get('/public/posts?type=NEWS&limit=2'),
          api.get('/events')
        ]);
        setProfile(profileData);
        setNews(newsData.slice(0, 2));
        setEvents(eventsData.slice(0, 2));
      } catch (error) {
        console.error('Error fetching member data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-amber-800">
        <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
        <p>We couldn't find your membership profile. Please contact support if you believe this is an error.</p>
      </div>
    );
  }

  const chartData = [
    { name: 'Donated', value: profile.stats.totalDonated / 1000 }, // Simplified for chart
    { name: 'Events', value: profile.stats.eventsAttended },
    { name: 'Hours', value: profile.stats.volunteerHours },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Member Portal</h1>
          <p className="text-slate-500">Welcome back, {user.displayName}. Here's your activity overview.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-200 transition-all flex items-center gap-2">
            <Share2 size={16} />
            Refer a Friend
          </button>
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
            Renew Membership
          </button>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: ID Card & Chart */}
        <div className="space-y-8">
          {/* Digital ID Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <span className="font-black tracking-tight">NUP MEMBER</span>
                </div>
                <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded uppercase tracking-widest">
                  {profile.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl border border-white/30 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-lg font-bold">{profile.fullName}</p>
                  <p className="text-xs text-slate-400 font-mono">ID: {profile.membershipId || 'PENDING'}</p>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Member Since</p>
                  <p className="text-sm font-bold">
                    {profile.joinedDate ? format(new Date(profile.joinedDate), 'MMMM yyyy') : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Province</p>
                  <p className="text-sm font-bold">{profile.province}</p>
                </div>
              </div>
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
