import React, { useState, useEffect } from 'react';
import { UserProfile, AppEvent } from '../types';
import { api } from '../lib/api';
import { safeFormat } from '../lib/date';
import { motion } from 'motion/react';
import { 
  User, 
  ShieldAlert, 
  Award, 
  Heart, 
  Calendar, 
  Megaphone, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Users,
  MessageSquare,
  FileText,
  Globe,
  Activity,
  Zap,
  ArrowUpRight,
  ListTodo,
  Shield,
  GitGraph,
  Vote
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardHomeProps {
  user: UserProfile;
  setCurrentView: (view: any) => void;
}

const MOCK_CHART_DATA = [
  { name: 'Jan', members: 4000, supporters: 2400 },
  { name: 'Feb', members: 3000, supporters: 1398 },
  { name: 'Mar', members: 2000, supporters: 9800 },
  { name: 'Apr', members: 2780, supporters: 3908 },
  { name: 'May', members: 1890, supporters: 4800 },
  { name: 'Jun', members: 2390, supporters: 3800 },
  { name: 'Jul', members: 3490, supporters: 4300 },
];

export const DashboardHome: React.FC<DashboardHomeProps> = ({ user, setCurrentView }) => {
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsData, eventsData, configData, summaryData] = await Promise.all([
          api.get('/public/posts?type=NEWS&limit=3'),
          api.get('/app-events/public'),
          api.get('/public/config'),
          api.get('/dashboard/summary')
        ]);
        setNews(newsData);
        setEvents(eventsData);
        setSystemConfig(configData);
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.role]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const isAdmin = ['ADMIN', 'STAFF'].includes(user.role);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-8"
    >
      {/* Identity Hero Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
              <Globe size={12} />
              {systemConfig['PARTY_NAME'] || 'PPOS'} Official Portal • {summary?.scopeName || 'National'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              Welcome, <span className="text-emerald-400">{user.displayName}</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-xl">
              {user.role === 'ADMIN' ? 'System Administrator Control Center' : 
               user.role === 'MEMBER' ? 'Official Party Member Portal' :
               user.role === 'APPLICANT_MEMBER' ? 'Membership Application Hub' :
               'Public Supporter & Engagement Dashboard'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl min-w-[140px]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Role</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="font-bold text-white uppercase tracking-tight">{user.role.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl min-w-[140px]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
              <span className="font-bold text-white uppercase tracking-tight">Active Session</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Admin Command Center */}
      {isAdmin && summary && (
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Members', value: summary.totalMembers, icon: Users, color: 'emerald', trend: '+12%' },
              { label: 'Supporters', value: summary.totalSupporters, icon: Heart, color: 'rose', trend: '+8%' },
              { label: 'System Users', value: summary.totalUsers, icon: User, color: 'indigo', trend: 'Active' },
              { label: 'Open Grievances', value: summary.openGrievances, icon: ShieldAlert, color: 'amber', trend: '-5%' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-600' : stat.trend.startsWith('-') ? 'text-rose-600' : 'text-slate-400'}`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900">{stat.value?.toLocaleString() || 0}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <TrendingUp size={24} className="text-emerald-500" />
                  Party Growth Analytics
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentView('user-admin')}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    User Directory
                  </button>
                  <select className="bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 px-4 py-2">
                    <option>Last 6 Months</option>
                    <option>Last Year</option>
                  </select>
                </div>
              </div>
              <div className="h-[300px] w-full mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_CHART_DATA}>
                    <defs>
                      <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="members" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* User Breakdown for Admins */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
                {[
                  { label: 'Admins', key: 'ADMIN', color: 'indigo' },
                  { label: 'Staff', key: 'STAFF', color: 'blue' },
                  { label: 'Members', key: 'MEMBER', color: 'emerald' },
                  { label: 'Public', key: 'PUBLIC', color: 'slate' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className={`text-xl font-black text-${item.color}-600`}>{summary.userRoleBreakdown?.[item.key] || 0}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
              <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                <Zap size={24} className="text-emerald-400" />
                Priority Actions
              </h3>
              <div className="space-y-4">
                {summary.actionQueue && summary.actionQueue.length > 0 ? summary.actionQueue?.map((action: any, i: number) => (
                  <button 
                    key={i}
                    onClick={() => {
                      if (action.type === 'GRIEVANCE') setCurrentView('grievances');
                      else if (action.type === 'MEMBERSHIP') setCurrentView('membership');
                      else if (action.type === 'BOOTH') setCurrentView('booths');
                      else setCurrentView('dashboard');
                    }}
                    className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-left group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        action.priority === 'CRITICAL' || action.type === 'MEMBERSHIP' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {action.type}
                      </span>
                      <ArrowUpRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                    </div>
                    <p className="font-bold text-sm text-slate-200 line-clamp-1">{action.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{safeFormat(action.date, 'MMM d, h:mm a')}</p>
                  </button>
                )) : (
                  <div className="text-center py-8 opacity-50">
                    <CheckCircle2 size={32} className="mx-auto mb-2" />
                    <p className="text-xs">All clear! No pending actions.</p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setCurrentView('membership')}
                className="w-full mt-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-900/20"
              >
                View All Tasks
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Role-Specific Primary Widget */}
      <motion.div variants={itemVariants}>
        {user.role === 'MEMBER' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Award className="text-emerald-600" size={28} />
                Member Identity
              </h2>
              <button 
                onClick={() => setCurrentView('member-dashboard')}
                className="text-sm font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                Full Portal <ChevronRight size={16} />
              </button>
            </div>
            <div className="p-8 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <p className="text-slate-500 font-medium italic">"Your membership is your voice in the party's future. Stay active, stay engaged."</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membership Status</p>
                        <p className="text-lg font-black text-slate-800">ACTIVE MEMBER</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engagement Level</p>
                        <p className="text-lg font-black text-slate-800">HIGH IMPACT</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${summary.isVolunteer ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Zap size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volunteer Status</p>
                        <p className="text-lg font-black text-slate-800">{summary.isVolunteer ? (summary.volunteerStatus || 'ACTIVE') : 'NOT ENROLLED'}</p>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${summary.isDonor ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Heart size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Donor Status</p>
                        <p className="text-lg font-black text-slate-800">{summary.isDonor ? 'CONTRIBUTOR' : 'NOT ENROLLED'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {['Voter ID Verified', 'Dues Paid', 'Profile 100%'].map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                      <Globe size={24} className="text-emerald-300" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Official ID</span>
                    </div>
                    <div className="pt-4">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Member Name</p>
                      <p className="text-xl font-black tracking-tight">{user.displayName}</p>
                    </div>
                    <div className="flex justify-between items-end pt-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">ID Number</p>
                        <p className="font-mono font-bold text-sm">NUP-{user.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <Award size={20} className="text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {user.role === 'APPLICANT_MEMBER' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Clock className="text-amber-600" size={28} />
                Application Progress
              </h2>
              <button 
                onClick={() => setCurrentView('applicant-dashboard')}
                className="text-sm font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                Track Details <ChevronRight size={16} />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center animate-pulse">
                    <AlertCircle size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Under Review</h3>
                    <p className="text-slate-500 font-medium">Your membership application is being processed by the central committee.</p>
                  </div>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Time</p>
                  <p className="text-lg font-black text-slate-800">2-3 Business Days</p>
                </div>
              </div>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-600 bg-amber-200">
                      Verification Phase
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-amber-600">
                      65%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-amber-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[
                  { label: 'Submitted', status: 'complete' },
                  { label: 'Verification', status: 'active' },
                  { label: 'Approval', status: 'pending' },
                ].map((step, i) => (
                  <div key={i} className="text-center">
                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      step.status === 'complete' ? 'bg-emerald-500 text-white' :
                      step.status === 'active' ? 'bg-amber-500 text-white animate-pulse' :
                      'bg-slate-100 text-slate-400'
                    }`}>
                      {step.status === 'complete' ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{i + 1}</span>}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {user.role === 'PUBLIC' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <button 
                onClick={() => setCurrentView('membership-public')}
                className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 hover:border-emerald-500 transition-all text-left shadow-sm hover:shadow-xl group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <User size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Become a Member</h3>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed mb-6">Join thousands of citizens in building a better future. Get your official ID card and voting rights.</p>
                  <div className="inline-flex items-center gap-2 text-emerald-600 font-black uppercase tracking-widest text-sm">
                    Apply Now <ArrowRight size={18} />
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setCurrentView('grievances')}
                className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 hover:border-purple-500 transition-all text-left shadow-sm hover:shadow-xl group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-500" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <ShieldAlert size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Report an Issue</h3>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed mb-6">Submit grievances or suggestions for your local area. Track progress in real-time.</p>
                  <div className="inline-flex items-center gap-2 text-purple-600 font-black uppercase tracking-widest text-sm">
                    File Grievance <ArrowRight size={18} />
                  </div>
                </div>
              </button>

              <div className="grid grid-rows-2 gap-4">
                <button 
                  onClick={() => setCurrentView('donations')}
                  className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 hover:bg-rose-100 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white text-rose-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Heart size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-rose-900 uppercase tracking-tight">Donate Now</h4>
                      <p className="text-xs text-rose-700 font-medium">Support our mission financially.</p>
                    </div>
                  </div>
                </button>
                <button 
                  onClick={() => setCurrentView('volunteers-public')}
                  className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 hover:bg-indigo-100 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-indigo-900 uppercase tracking-tight">Volunteer</h4>
                      <p className="text-xs text-indigo-700 font-medium">Contribute your skills and time.</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Public User Activity */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <Activity size={24} className="text-slate-500" />
                  My Activity
                </h3>
              </div>
              <div className="p-8">
                {summary?.actionQueue && summary.actionQueue.length > 0 ? (
                  <div className="space-y-4">
                    {summary.actionQueue?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                            {item.type === 'GRIEVANCE' ? <ShieldAlert size={20} /> : <FileText size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-black">{item.type} • {item.status}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{safeFormat(item.date, 'MMM d')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ListTodo size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">No recent activity found. Start by reporting an issue or applying for membership!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Module Status Indicators (Master Plan Integration) */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'War Room', icon: ShieldAlert, status: systemConfig['ENABLE_WAR_ROOM'] !== 'false' ? 'Active' : 'Offline', color: 'rose', view: 'warroom' },
          { label: 'PGIS', icon: Shield, status: systemConfig['ENABLE_PGIS'] !== 'false' ? 'Active' : 'Offline', color: 'emerald', view: 'pgis' },
          { label: 'Election', icon: Vote, status: 'Monitoring', color: 'blue', view: 'election' },
          { label: 'Hierarchy', icon: GitGraph, status: 'Verified', color: 'indigo', view: 'hierarchy' },
        ].map((module, i) => (
          <button 
            key={i}
            onClick={() => setCurrentView(module.view)}
            className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-left group"
          >
            <div className={`w-10 h-10 bg-${module.color}-50 text-${module.color}-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <module.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{module.label}</p>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${module.status === 'Active' || module.status === 'Verified' ? 'bg-emerald-500' : module.status === 'Monitoring' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <span className="text-xs font-bold text-slate-700">{module.status}</span>
              </div>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Secondary Grid: News & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          {/* News Feed */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Megaphone size={24} className="text-emerald-500" />
                Latest Updates
              </h3>
              <button className="text-sm font-bold text-emerald-600 hover:underline">View All</button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {news?.length > 0 ? news?.map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-video bg-slate-100 rounded-3xl mb-4 overflow-hidden shadow-sm">
                    <img src={item.featuredImage || `https://picsum.photos/seed/${item.title}/400/225`} alt="News" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {item.type}
                    </span>
                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{safeFormat(item.publishedAt || item.createdAt, 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Megaphone size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No news updates available.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-8">
          {/* Upcoming Events */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Calendar size={24} className="text-blue-500" />
                Events
              </h3>
              <button 
                onClick={() => setCurrentView('events')}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="p-4 space-y-4">
              {events?.length > 0 ? events?.map((event, i) => (
                <div key={i} className="p-4 rounded-3xl hover:bg-slate-50 transition-all flex items-center gap-4 group">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-[10px] font-black uppercase leading-none">{safeFormat(event.eventDate, 'MMM')}</span>
                    <span className="text-xl font-black leading-none">{safeFormat(event.eventDate, 'd')}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 truncate">{event.title}</h4>
                    <p className="text-xs text-slate-500 font-medium truncate">{event.location}</p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium text-sm">No upcoming events.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Support Widget */}
          <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2" />
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Need Help?</h3>
            <p className="text-emerald-100 text-sm font-medium mb-6 leading-relaxed">Our support team is available to assist you with any queries or issues.</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-bold">
                <MessageSquare size={18} className="text-emerald-300" />
                {systemConfig['CONTACT_EMAIL'] || 'support@ppos.org'}
              </div>
              <div className="flex items-center gap-3 text-sm font-bold">
                <Users size={18} className="text-emerald-300" />
                Community Support
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
