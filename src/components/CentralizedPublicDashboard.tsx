import React, { useState, useEffect } from 'react';
import { UserProfile, AppEvent } from '../types';
import { api } from '../lib/api';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
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
  Layout,
  ExternalLink,
  Settings,
  Download,
  Printer,
  Share2,
  XCircle,
  Loader2,
  Bell,
  UserPlus,
  LogOut
} from 'lucide-react';
import MemberIdCard from './MemberIdCard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface CentralizedPublicDashboardProps {
  user: UserProfile;
  setCurrentView: (view: any) => void;
  onLogout: () => void;
}

export const CentralizedPublicDashboard: React.FC<CentralizedPublicDashboardProps> = ({ 
  user, 
  setCurrentView,
  onLogout 
}) => {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [volunteer, setVolunteer] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [donorProfile, setDonorProfile] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({});

  const getProgress = () => {
    if (profile?.status === 'APPROVED') return 100;
    if (profile?.status === 'PENDING') return 65;
    if (profile?.status === 'REJECTED') return 0;
    return 30; // Default for just started
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newsData, eventsData, noticesData, configData, summaryData, profileData, volunteerData, donationsData] = await Promise.all([
          api.get('/public/posts?type=NEWS&limit=3').catch(() => []),
          api.get('/app-events/public').catch(() => []),
          api.get('/communication/notices/members').catch(() => []),
          api.get('/public/config').catch(() => ({})),
          api.get('/dashboard/summary').catch(() => null),
          user.role === 'MEMBER' || user.role === 'APPLICANT_MEMBER' ? api.get('/members/me').catch(() => null) : Promise.resolve(null),
          api.get('/volunteers/me').catch(() => null),
          api.get('/finance/donations/me').catch(() => null)
        ]);
        
        setNews(newsData);
        setEvents(eventsData);
        setNotices(noticesData);
        setSystemConfig(configData);
        setSummary(summaryData);
        setProfile(profileData);
        setVolunteer(volunteerData);
        if (donationsData) {
          setDonations(donationsData.donations || []);
          setDonorProfile(donationsData.profile || null);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id, user.role]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Globe size={24} className="text-emerald-600 animate-pulse" />
          </div>
        </div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Initializing Portal...</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-8 pb-12 px-4 sm:px-6 lg:px-8"
    >
      {/* Identity & Status Hero */}
      <motion.div variants={itemVariants} className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl shadow-slate-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                {user.role.replace('_', ' ')} • Official Portal
              </span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                Hello, <span className="text-emerald-400">{user.displayName}</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl font-medium">
                {user.role === 'MEMBER' ? 'Your active participation drives our collective progress.' :
                 user.role === 'APPLICANT_MEMBER' ? 'Your journey to becoming a member is in progress.' :
                 'Welcome to your centralized engagement hub.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setCurrentView('profile')}
                className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-400 hover:text-white transition-all flex items-center gap-2"
              >
                <Settings size={16} />
                Manage Profile
              </button>
              {user.role === 'PUBLIC' && (
                <button 
                  onClick={() => setCurrentView('membership-public')}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Award size={16} />
                  Join the Party
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Status Card */}
          <div className="w-full lg:w-auto">
            <AnimatePresence mode="wait">
              {user.role === 'MEMBER' && profile && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] min-w-[320px] space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Membership ID</p>
                      <p className="text-2xl font-black text-white tracking-tighter">
                        {profile.membershipId || `PPOS-${user.id.slice(0, 6).toUpperCase()}`}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
                      <Award size={24} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">ACTIVE</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Joined</p>
                      <p className="text-sm font-bold text-white">{format(new Date(profile.joinedDate || user.createdAt), 'MMM yyyy')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setCurrentView('member-dashboard')}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    View ID Card <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {user.role === 'APPLICANT_MEMBER' && profile && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] min-w-[320px] space-y-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Application Status</p>
                      <p className="text-2xl font-black text-amber-400 tracking-tighter uppercase">
                        {profile.status.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center animate-pulse">
                      <Clock size={24} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Progress</span>
                      <span>{getProgress()}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgress()}%` }}
                        className="h-full bg-amber-500"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setCurrentView('applicant-dashboard')}
                    className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-widest text-amber-400 transition-all flex items-center justify-center gap-2"
                  >
                    Track Details <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {user.role === 'PUBLIC' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] min-w-[320px] space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center">
                      <Activity size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Next Action</p>
                      <p className="text-lg font-black text-white leading-tight">Complete your profile to unlock all features.</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Verify Identity', done: false },
                      { label: 'Register as Supporter', done: true },
                      { label: 'Join Community', done: false }
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${step.done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                          {step.done && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs font-bold ${step.done ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { id: 'membership-public', label: 'Membership', icon: UserPlus, color: 'emerald', show: user.role === 'PUBLIC' },
          { id: 'member-dashboard', label: 'My ID Card', icon: Award, color: 'emerald', show: user.role === 'MEMBER' },
          { id: 'applicant-dashboard', label: 'App Status', icon: Clock, color: 'amber', show: user.role === 'APPLICANT_MEMBER' },
          { id: 'grievances', label: 'Grievances', icon: ShieldAlert, color: 'rose', show: true },
          { id: 'donations', label: 'Donations', icon: Heart, color: 'pink', show: true },
          { id: 'volunteers', label: 'Volunteer', icon: Zap, color: 'indigo', show: true },
          { id: 'surveys', label: 'Surveys', icon: ListTodo, color: 'blue', show: true },
          { id: 'public-documents', label: 'Documents', icon: FileText, color: 'slate', show: true },
        ].filter(a => a.show).map((action, i) => (
          <button
            key={i}
            onClick={() => setCurrentView(action.id)}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-center"
          >
            <div className={`w-12 h-12 mx-auto bg-${action.color}-50 text-${action.color}-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <action.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{action.label}</p>
            <div className="flex items-center justify-center gap-1 text-slate-900 font-bold text-xs">
              Open <ChevronRight size={14} />
            </div>
          </button>
        ))}
      </motion.div>

      {/* My Membership Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Award size={28} className="text-emerald-600" />
            My Membership
          </h2>
          <span className="px-4 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-200">
            Portal Foundation v1.0
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Status & Overview */}
          <div className="lg:col-span-2 space-y-6">
            {user.role === 'PUBLIC' && (
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                    <UserPlus size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4">Join the Movement</h3>
                  <p className="text-slate-500 text-lg mb-8 max-w-md">
                    You are currently a registered user. Become a full party member to unlock voting rights, exclusive events, and official representation.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setCurrentView('membership-public')}
                      className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                    >
                      Apply for Membership <ArrowRight size={18} />
                    </button>
                    <button className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
                      View Benefits
                    </button>
                  </div>
                </div>
              </div>
            )}

            {user.role === 'APPLICANT_MEMBER' && (
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Application Status</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1">Tracking your journey to official membership.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tracking Code</p>
                    <p className="font-mono font-bold text-indigo-600">#{profile?.id?.slice(-8)?.toUpperCase() || 'PENDING'}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Progress Tracker */}
                  <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2" />
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-amber-500 -translate-y-1/2 transition-all duration-1000" 
                      style={{ width: `${getProgress()}%` }}
                    />
                    <div className="relative flex justify-between">
                      {[
                        { label: 'Applied', status: 'SUBMITTED', icon: FileText },
                        { label: 'Verification', status: 'VERIFYING', icon: Shield },
                        { label: 'Approval', status: 'PENDING', icon: Clock },
                        { label: 'Official', status: 'APPROVED', icon: Award },
                      ].map((step, i) => {
                        const isCompleted = getProgress() > (i * 30);
                        const isCurrent = profile?.status === step.status || (i === 2 && profile?.status === 'PENDING');
                        
                        return (
                          <div key={i} className="flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm z-10 transition-colors ${
                              isCompleted ? 'bg-amber-500 text-white' : 
                              isCurrent ? 'bg-white text-amber-500 border-amber-500' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <step.icon size={16} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${
                              isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'
                            }`}>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                          <Clock size={16} />
                        </div>
                        <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Next Steps</h4>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Your application is currently under review by the district committee. This process typically takes 3-5 business days.
                      </p>
                    </div>
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                          <MessageSquare size={16} />
                        </div>
                        <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Support</h4>
                      </div>
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Need to update your details? Contact your local coordinator or visit the help center.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {user.role === 'MEMBER' && (
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Member Overview</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1">Official status and active credentials.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                    Active Member
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                    <p className="text-lg font-bold text-slate-900">
                      {profile?.joinedAt ? format(new Date(profile.joinedAt), 'MMM yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiry Date</p>
                    <p className="text-lg font-bold text-slate-900">
                      {profile?.expiryDate ? format(new Date(profile.expiryDate), 'dd MMM yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">District Unit</p>
                    <p className="text-lg font-bold text-slate-900 truncate">
                      {profile?.orgUnit?.name || 'Global'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => setCurrentView('renewals')}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    Renew Membership <Zap size={14} />
                  </button>
                  <button className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">
                    Update Info
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Member Card / Quick Stats */}
          <div className="space-y-6">
            {user.role === 'MEMBER' ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Official ID Card</p>
                <div className="scale-90 origin-top">
                  <MemberIdCard member={profile} />
                </div>
                <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold text-xs hover:border-emerald-200 hover:text-emerald-600 transition-all flex items-center justify-center gap-2">
                  <Download size={16} /> Download Digital ID
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white h-full flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tight mb-4">Membership Benefits</h4>
                  <ul className="space-y-4">
                    {[
                      'Official Voting Rights',
                      'District Representation',
                      'Exclusive Member Portal',
                      'Party ID Card',
                      'Priority Event Access'
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 p-4 bg-white/10 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Support Center</p>
                  <p className="text-xs text-slate-300">Have questions? Our team is here to help you through the process.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* My Volunteer Section */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Zap size={28} className="text-indigo-600" />
            My Volunteer
          </h2>
          <span className="px-4 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-200">
            Volunteer Portal v1.0
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Status & Overview */}
          <div className="lg:col-span-2 space-y-6">
            {!volunteer && (
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                    <Zap size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4">Serve the Community</h3>
                  <p className="text-slate-500 text-lg mb-8 max-w-md">
                    You haven't applied to be a volunteer yet. Join our team of dedicated volunteers and help make a real impact on the ground.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => setCurrentView('volunteer-enrollment')}
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                    >
                      Apply to Volunteer <ArrowRight size={18} />
                    </button>
                    <button className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
                      Volunteer Roles
                    </button>
                  </div>
                </div>
              </div>
            )}

            {volunteer && volunteer.status === 'PENDING' && (
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Volunteer Application</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1">Your application is being processed.</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-200">
                    Under Review
                  </span>
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Application Status</h4>
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Thank you for your interest! Our volunteer coordinators are reviewing your skills and availability. You will be notified once a suitable project is found.
                  </p>
                </div>
              </div>
            )}

            {volunteer && volunteer.status === 'APPROVED' && (
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Volunteer Dashboard</h3>
                    <p className="text-slate-500 text-xs font-medium mt-1">Active assignments and contributions.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                    Active Volunteer
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Projects</p>
                      <p className="text-2xl font-black text-slate-900">{volunteer.assignments?.length || 0}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Hours</p>
                      <p className="text-2xl font-black text-slate-900">{volunteer.totalHours || 0}h</p>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Verified Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {volunteer.skills?.split(',').map((skill: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setCurrentView('volunteers')}
                  className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  Open Volunteer Portal <ArrowUpRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Quick Stats / Info */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white h-full flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight mb-4">Impact Summary</h4>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Community Reach</p>
                      <p className="text-sm font-bold">12,450+ People Impacted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400">
                      <Users size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Volunteers</p>
                      <p className="text-sm font-bold">2,800+ Members Serving</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Coordinator Note</p>
                <p className="text-xs text-slate-300">"Every hour you give brings us closer to our shared vision."</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Donor Status */}
      <motion.div variants={itemVariants}>
        {donations.length > 0 ? (
          <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-rose-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Heart size={24} className="text-rose-300" />
                  Donor Impact
                </h3>
                <p className="text-rose-200 text-xs font-medium mt-1">Thank you for your generous support.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest">Total Donated</p>
                <p className="text-2xl font-black">NPR {(donorProfile?.totalDonated || donations.reduce((acc, d) => acc + d.amount, 0)).toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-4">
              {donations.length > 0 ? (
                donations.slice(0, 2).map((donation, i) => (
                  <div key={i} className="p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm">{donation.campaign?.title || 'General Donation'}</h4>
                      <p className="text-[10px] text-rose-200 uppercase tracking-widest">{format(new Date(donation.transaction?.date || donation.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <p className="font-black text-sm">NPR {(donation.transaction?.amount || donation.amount).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs font-bold text-rose-100 italic">No recent donations found.</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setCurrentView('donations')}
              className="w-full mt-6 py-3 bg-white text-rose-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 transition-all"
            >
              Donation History
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <Heart size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Support the Movement</h3>
              <p className="text-slate-500 mt-2">Your contributions help us reach more people and build a better future.</p>
            </div>
            <button 
              onClick={() => setCurrentView('donations')}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2 group"
            >
              Donate Now
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Activity & Stats */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Activity size={24} className="text-emerald-500" />
                Your Activity Feed
              </h3>
              <button 
                onClick={() => setCurrentView('notices')}
                className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
              >
                View All Notices
              </button>
            </div>
            <div className="p-8">
              {summary?.actionQueue && summary.actionQueue.length > 0 ? (
                <div className="space-y-4">
                  {summary.actionQueue.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm group-hover:text-emerald-600 transition-colors">
                          {item.type === 'GRIEVANCE' ? <ShieldAlert size={24} className="text-rose-500" /> : 
                           item.type === 'MEMBERSHIP' ? <Award size={24} className="text-emerald-500" /> : 
                           item.type === 'DONATION' ? <Heart size={24} className="text-pink-500" /> :
                           item.type === 'SURVEY' ? <ListTodo size={24} className="text-blue-500" /> :
                           item.type === 'CAMPAIGN' ? <Megaphone size={24} className="text-indigo-500" /> :
                           <FileText size={24} className="text-slate-500" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 tracking-tight">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'COMPLETED' || item.status === 'APPROVED' || item.status === 'ACTIVE' ? 'text-emerald-600' : 
                              item.status === 'PENDING' || item.status === 'VERIFIED' ? 'text-amber-600' : 
                              item.status === 'REJECTED' || item.status === 'CANCELLED' ? 'text-rose-600' :
                              'text-slate-500'
                            }`}>{item.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400">{format(new Date(item.date || item.createdAt), 'MMM d')}</p>
                        <p className="text-[10px] text-slate-300">{format(new Date(item.date || item.createdAt), 'h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <ListTodo size={40} className="text-slate-200" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Activity Yet</h4>
                  <p className="text-slate-500 font-medium max-w-xs mx-auto">Start your journey by exploring the quick actions above!</p>
                </div>
              )}
            </div>
          </div>

          {/* Engagement Stats (For Members) */}
          {user.role === 'MEMBER' && profile?.stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Events Attended', value: profile.stats.eventsAttended, icon: Calendar, color: 'blue' },
                { label: 'Volunteer Hours', value: profile.stats.volunteerHours, icon: Zap, color: 'indigo' },
                { label: 'Total Donated', value: `NPR ${profile.stats.totalDonated}`, icon: Heart, color: 'rose' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all">
                  <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-6`}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right Column: News & Events */}
        <motion.div variants={itemVariants} className="space-y-8">
          {/* Important Notices */}
          {notices.length > 0 && (
            <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2" />
              <h3 className="text-xl font-black uppercase tracking-tight mb-6 flex items-center gap-3">
                <Bell size={24} className="text-emerald-300" />
                Alerts & Notices
              </h3>
              <div className="space-y-4">
                {notices.slice(0, 2).map((notice, i) => (
                  <div key={i} className="p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl">
                    <h4 className="font-bold text-sm mb-1">{notice.title}</h4>
                    <p className="text-xs text-emerald-100 line-clamp-2">{notice.content}</p>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setCurrentView('notices')}
                className="w-full mt-6 py-3 bg-white text-emerald-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 transition-all"
              >
                View All Notices
              </button>
            </div>
          )}

          {/* News Feed */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Megaphone size={24} className="text-emerald-500" />
                Latest News
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {news.map((item, i) => (
                <div key={i} className="group cursor-pointer flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                    <img 
                      src={item.featuredImage || `https://picsum.photos/seed/${item.title}/200/200`} 
                      alt="News" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(new Date(item.publishedAt || item.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Calendar size={24} className="text-blue-500" />
                Events
              </h3>
              <button 
                onClick={() => setCurrentView('events')}
                className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="p-4 space-y-2">
              {events.slice(0, 3).map((event: any, i) => {
                const date = event.eventDate || event.startDate;
                return (
                  <div key={i} className="p-4 rounded-3xl hover:bg-slate-50 transition-all flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-[8px] font-black uppercase leading-none">{format(new Date(date), 'MMM')}</span>
                      <span className="text-lg font-black leading-none">{format(new Date(date), 'd')}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 truncate text-sm">{event.title}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{event.location}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CentralizedPublicDashboard;
