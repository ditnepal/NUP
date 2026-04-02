import React, { useState, useEffect } from 'react';
import { UserProfile, AppEvent, TrainingProgram, Course, Lesson, Grievance, GrievanceCategory } from '../types';
import { api } from '../lib/api';
import { usePermissions } from '../hooks/usePermissions';
import { safeFormat } from '../lib/date';
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
  Bell,
  UserPlus,
  MapPin,
  BookOpen,
  Paperclip,
  Search,
  Pin,
  GraduationCap,
  Layers,
  ArrowLeft,
  PlayCircle,
  Vote,
  ClipboardList,
  Send,
  X,
  Plus,
  ShieldCheck,
  MessageCircle,
  History,
  IdCard,
  AlertCircle,
  LayoutDashboard,
  HandCoins,
  UserCircle
} from 'lucide-react';
import MemberIdCard from './MemberIdCard';
import { MemberCardModal } from './MemberCardModal';
import { MemberProfileSettings } from './MemberProfileSettings';
import { PaymentMethodSelector } from './ui/PaymentMethodSelector';
import { GrievanceStatusBadge, GrievancePriorityBadge } from './ui/GrievanceBadges';
import { toast } from 'sonner';

interface Survey {
  id: string;
  title: string;
  description: string;
  status: string;
  _count: { responses: number };
  createdAt: string;
  questions?: any[];
}

interface Poll {
  id: string;
  question: string;
  status: string;
  options: { id: string; text: string; _count: { votes: number } }[];
  _count: { votes: number };
}

interface CentralizedPublicDashboardProps {
  user: UserProfile;
  setCurrentView: (view: any) => void;
  onLogout: () => void;
  initialTab?: 'overview' | 'membership' | 'volunteer' | 'donations' | 'profile' | 'notices' | 'events' | 'training' | 'surveys' | 'grievances';
}

export const CentralizedPublicDashboard: React.FC<CentralizedPublicDashboardProps> = ({ 
  user, 
  setCurrentView,
  onLogout,
  initialTab = 'overview'
}) => {
  const { can } = usePermissions(user);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [grievanceCategories, setGrievanceCategories] = useState<GrievanceCategory[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [volunteer, setVolunteer] = useState<any>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [donorProfile, setDonorProfile] = useState<any>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'membership' | 'volunteer' | 'donations' | 'profile' | 'notices' | 'events' | 'training' | 'surveys' | 'grievances'>(initialTab);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewalNote, setRenewalNote] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Training drill-down state
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Survey/Poll state
  const [showTakeSurvey, setShowTakeSurvey] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showIdCard, setShowIdCard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [surveyTab, setSurveyTab] = useState<'surveys' | 'polls'>('surveys');

  // Grievance state
  const [showNewGrievanceModal, setShowNewGrievanceModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [newGrievance, setNewGrievance] = useState({
    title: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM'
  });
  const [grievanceResponse, setGrievanceResponse] = useState('');

  const getProgress = () => {
    if (profile?.status === 'APPROVED') return 100;
    if (profile?.status === 'PENDING') return 65;
    if (profile?.status === 'REJECTED') return 0;
    return 30; // Default for just started
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const promises: Promise<any>[] = [
          api.get('/public/posts?type=NEWS&limit=3').catch(() => []),
          api.get('/app-events/public').catch(() => []),
          api.get('/public/config').catch(() => ({})),
          api.get('/public/fundraisers').catch(() => [])
        ];
        
        const keys: string[] = ['news', 'events', 'config', 'fundraisers'];

        if (can('COMMUNICATION', 'VIEW')) {
          promises.push(api.get('/communication/notices/members').catch(() => []));
          keys.push('notices');
        }
        
        if (can('TRAINING', 'VIEW')) {
          promises.push(api.get('/training/programs/portal').catch(() => []));
          keys.push('programs');
        }
        
        if (can('SURVEYS', 'VIEW')) {
          promises.push(api.get('/surveys').catch(() => []));
          keys.push('surveys');
          promises.push(api.get('/surveys/polls').catch(() => []));
          keys.push('polls');
        }
        
        if (can('GRIEVANCES', 'VIEW')) {
          promises.push(api.get('/grievances').catch(() => []));
          keys.push('grievances');
          promises.push(api.get('/grievances/categories').catch(() => []));
          keys.push('grievanceCats');
        }
        
        if (can('DASHBOARD', 'VIEW')) {
          promises.push(api.get('/dashboard/summary').catch(() => null));
          keys.push('summary');
        }

        if (user.role === 'MEMBER' || user.role === 'APPLICANT_MEMBER') {
          promises.push(api.get('/members/me').catch(() => null));
          keys.push('profile');
          promises.push(api.get('/members/me/renewals').catch(() => []));
          keys.push('renewals');
        }

        // /volunteers/me only requires authentication, no specific module permission
        promises.push(api.get('/volunteers/me').catch(() => null));
        keys.push('volunteer');

        if (can('FUNDRAISING', 'VIEW')) {
          promises.push(api.get('/finance/donations/me').catch(() => null));
          keys.push('donations');
        }

        const results = await Promise.all(promises);
        
        results.forEach((data, index) => {
          const key = keys[index];
          if (key === 'news') setNews(Array.isArray(data) ? data : []);
          if (key === 'events') setEvents(Array.isArray(data) ? data : []);
          if (key === 'config') setSystemConfig(data || {});
          if (key === 'fundraisers') setActiveCampaigns(Array.isArray(data) ? data : []);
          if (key === 'notices') setNotices(Array.isArray(data) ? data : []);
          if (key === 'programs') setPrograms(Array.isArray(data) ? data : []);
          if (key === 'surveys') setSurveys(Array.isArray(data) ? data.filter((s: any) => s.status === 'ACTIVE') : []);
          if (key === 'polls') setPolls(Array.isArray(data) ? data.filter((p: any) => p.status === 'ACTIVE') : []);
          if (key === 'grievances') setGrievances(Array.isArray(data) ? data : []);
          if (key === 'grievanceCats') setGrievanceCategories(Array.isArray(data) ? data : []);
          if (key === 'summary') setSummary(data);
          if (key === 'profile') setProfile(data);
          if (key === 'renewals') setRenewals(Array.isArray(data) ? data : []);
          if (key === 'volunteer') setVolunteer(data);
          if (key === 'donations' && data) {
            setDonations(Array.isArray(data.donations) ? data.donations : []);
            setDonorProfile(data.profile || null);
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id, user.role, can]);

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) {
      toast.error('Please select a payment method.');
      return;
    }
    try {
      await api.post('/members/me/renewals', { 
        memberNote: renewalNote,
        paymentMethod: selectedMethod.provider
      });
      
      const isManual = selectedMethod.instructions ? true : false;
      toast.success(isManual 
        ? 'Renewal request initiated. Please follow the payment instructions provided.' 
        : 'Renewal request submitted successfully.'
      );
      
      setRenewalNote('');
      setSelectedMethod(null);
      setIsRenewing(false);
      const renewalsData = await api.get('/members/me/renewals').catch(() => []);
      setRenewals(renewalsData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit renewal request.');
    }
  };

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
      {/* Dashboard Header - Continuity Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentView('public')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-900 transition-all group shadow-sm"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Exit to Portal</span>
          </button>
          
          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />
          
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <LayoutDashboard size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{activeTab}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user.displayName}</p>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest opacity-70">
              {user.role.replace('_', ' ')} {user.orgUnitName ? `• ${user.orgUnitName}` : ''}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1 shadow-sm overflow-hidden">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
              alt="Avatar"
              className="w-full h-full rounded-xl object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Hero Section - Command Center Style */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 text-white p-8 md:p-12 shadow-2xl mb-8 border border-slate-800">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                {user.role.replace('_', ' ')}
              </span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Clock size={12} /> Last Login: {safeFormat(new Date(), 'MMM d, h:mm a')}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
              Welcome, <span className="text-emerald-400">{user.displayName?.split(' ')[0] || 'Citizen'}</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-xl leading-relaxed font-medium">
              Your centralized workspace for party engagement, community service, and official documentation.
            </p>
          </div>

          <div className="flex flex-col gap-4 min-w-[320px]">
            {/* Dynamic Status Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-all" />
              
              <div className="flex items-center justify-between mb-6 relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account Status</span>
                {user.role === 'MEMBER' ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={14} /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                    <AlertCircle size={14} /> {profile?.status || 'Pending'}
                  </span>
                )}
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: user.role === 'MEMBER' ? '100%' : `${getProgress()}%` }}
                    className={`h-full rounded-full ${user.role === 'MEMBER' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                </div>
                <p className="text-sm font-bold text-slate-300 leading-snug">
                  {user.role === 'MEMBER' 
                    ? 'Your membership is active and verified. You have full access to all services.' 
                    : `Your application is ${getProgress()}% complete. Follow the next steps to verify.`}
                </p>
              </div>
            </div>

            {/* Primary Action Button */}
            {user.role === 'PUBLIC' && (
              <button 
                onClick={() => setActiveTab('membership')}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 group"
              >
                Apply for Membership
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            {user.role === 'APPLICANT_MEMBER' && (
              <button 
                onClick={() => setActiveTab('membership')}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 group"
              >
                Track Application
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            {user.role === 'MEMBER' && (
              <button 
                onClick={() => setActiveTab('volunteer')}
                className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-2 group"
              >
                Find Volunteer Projects
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Actions Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { id: 'membership', label: 'Membership', icon: UserPlus, color: 'bg-emerald-500', shadow: 'shadow-emerald-200', show: true },
              { id: 'grievances', label: 'Help Desk', icon: ShieldAlert, color: 'bg-rose-500', shadow: 'shadow-rose-200', show: true },
              { id: 'donations', label: 'Donate', icon: Heart, color: 'bg-pink-500', shadow: 'shadow-pink-200', show: true },
              { id: 'volunteer', label: 'Volunteer', icon: Zap, color: 'bg-amber-500', shadow: 'shadow-amber-200', show: true }
            ].filter(a => a.show).map((action) => (
              <button
                key={action.id}
                onClick={() => setActiveTab(action.id as any)}
                className="group relative p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all text-left overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${action.color} opacity-[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`} />
                <div className={`w-14 h-14 ${action.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg ${action.shadow} group-hover:scale-110 transition-transform`}>
                  <action.icon size={28} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Quick Access</p>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{action.label}</h3>
              </button>
            ))}
          </motion.div>

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Status & Tasks */}
        <div className="lg:col-span-2 space-y-8">
          {/* Membership Status Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Award size={24} className="text-emerald-500" />
                Membership Status
              </h3>
              <button 
                onClick={() => setActiveTab('membership')}
                className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
              >
                Manage Membership
              </button>
            </div>
            <div className="p-8">
              {user.role === 'MEMBER' ? (
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/2">
                    <div className="scale-90 origin-left">
                      {profile && <MemberIdCard member={profile} />}
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined</p>
                        <p className="text-sm font-black text-slate-900">{profile?.joinedAt ? safeFormat(profile.joinedAt, 'MMM yyyy') : 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiry</p>
                        <p className="text-sm font-black text-slate-900">{profile?.expiryDate ? safeFormat(profile.expiryDate, 'dd MMM yyyy') : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setActiveTab('membership')}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        View Digital ID <Download size={14} />
                      </button>
                      <button 
                        onClick={() => { setActiveTab('membership'); setIsRenewing(true); }}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                      >
                        Renew Membership <Clock size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : user.role === 'APPLICANT_MEMBER' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 tracking-tight">Application Under Review</p>
                        <p className="text-xs text-amber-700 font-bold">Estimated completion: 3-5 business days</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('membership')}
                      className="px-4 py-2 bg-white text-amber-600 rounded-xl font-black uppercase tracking-widest text-[10px] border border-amber-200 hover:bg-amber-50 transition-all"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <UserPlus size={32} className="text-slate-300" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Join the Movement</h4>
                  <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Become an official member to unlock voting rights and exclusive party benefits.</p>
                  <button 
                    onClick={() => setActiveTab('membership')}
                    className="px-8 py-3 bg-emerald-500 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Start Application
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Volunteer Hub Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Zap size={24} className="text-indigo-500" />
                Volunteer Hub
              </h3>
              <button 
                onClick={() => setActiveTab('volunteer')}
                className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Volunteer Portal
              </button>
            </div>
            <div className="p-8">
              {volunteer && volunteer.status === 'APPROVED' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Contribution</p>
                      <p className="text-3xl font-black text-indigo-900">{volunteer.totalHours || 0} Hours</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Projects</p>
                      <p className="text-3xl font-black text-slate-900">{volunteer.assignments?.length || 0}</p>
                    </div>
                  </div>
                  <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Next Assignment</p>
                      <p className="text-sm font-bold leading-snug">Check the portal for new community outreach projects in your district.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('volunteer')}
                      className="mt-6 w-full py-3 bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-400 transition-all"
                    >
                      View Assignments
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Zap size={32} className="text-slate-300" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Serve your Community</h4>
                  <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Join our volunteer network to make a direct impact on the ground.</p>
                  <button 
                    onClick={() => setActiveTab('volunteer')}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Apply to Volunteer
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Grievances Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group hover:shadow-2xl transition-all relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="p-8 border-b border-slate-100 flex justify-between items-center relative z-10">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <ShieldAlert size={24} className="text-rose-500" />
                Grievances & Support
              </h3>
              <button 
                onClick={() => setActiveTab('grievances')}
                className="text-xs font-black text-rose-600 uppercase tracking-widest hover:underline"
              >
                View History
              </button>
            </div>
            <div className="p-8 relative z-10">
              {grievances.length > 0 ? (
                <div className="space-y-4">
                  {(grievances || []).slice(0, 2).map((g, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group/item">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                          <ShieldAlert size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 tracking-tight text-sm uppercase">{g.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <GrievanceStatusBadge status={g.status} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{safeFormat(g.createdAt, 'MMM d')}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover/item:text-rose-500 transition-colors" />
                    </div>
                  ))}
                  <button 
                    onClick={() => { setActiveTab('grievances'); setShowNewGrievanceModal(true); }}
                    className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    Submit New Request <Plus size={14} />
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <ShieldAlert size={32} className="text-slate-300" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Need Assistance?</h4>
                  <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Our support team is here to help you with any issues or grievances.</p>
                  <button 
                    onClick={() => { setActiveTab('grievances'); setShowNewGrievanceModal(true); }}
                    className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
                  >
                    Submit Grievance
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Profile & Engagement */}
        <div className="space-y-8">
          {/* Profile Summary Widget */}
          <motion.div variants={itemVariants} className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            
            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white/10 overflow-hidden shadow-2xl">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              </div>
              
              <div>
                <h4 className="text-2xl font-black tracking-tight">{user.displayName}</h4>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{user.role.replace('_', ' ')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ID</p>
                  <p className="text-xs font-black">#{user.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Verified</p>
                  <p className="text-xs font-black text-emerald-400">YES</p>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('profile')}
                className="w-full py-3 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                Edit Profile <Settings size={14} />
              </button>
            </div>
          </motion.div>

          {/* Training Programs Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <GraduationCap size={24} className="text-blue-500" />
                Training & Skills
              </h3>
              <button 
                onClick={() => setActiveTab('training')}
                className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                View Catalog
              </button>
            </div>
            <div className="p-8 space-y-4">
              {programs.length > 0 ? (
                (programs || []).slice(0, 2).map((p, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 tracking-tight text-sm">{p.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover/item:text-blue-500 transition-colors" />
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs italic text-center py-4">No new programs available.</p>
              )}
              <button 
                onClick={() => setActiveTab('training')}
                className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 hover:text-white transition-all"
              >
                Explore Training <ArrowUpRight size={14} />
              </button>
            </div>
          </motion.div>

          {/* Surveys & Polls Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <ListTodo size={24} className="text-indigo-500" />
                Surveys & Polls
              </h3>
              <button 
                onClick={() => setActiveTab('surveys')}
                className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                Participate
              </button>
            </div>
            <div className="p-8 space-y-4">
              {surveys.length > 0 || polls.length > 0 ? (
                <>
                  {(surveys || []).slice(0, 1).map((s, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                          <ClipboardList size={18} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 tracking-tight text-sm">{s.title}</p>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Survey</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover/item:text-indigo-500 transition-colors" />
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-slate-500 text-xs italic text-center py-4">No active surveys found.</p>
              )}
              <button 
                onClick={() => setActiveTab('surveys')}
                className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 hover:text-white transition-all"
              >
                Join Discussion <Vote size={14} />
              </button>
            </div>
          </motion.div>

          {/* Donor Impact Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm group">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Heart size={24} className="text-emerald-500" />
                Donor Impact
              </h3>
              <button 
                onClick={() => setActiveTab('donations')}
                className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
              >
                History
              </button>
            </div>
            <div className="p-8">
              {donations.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Contribution</p>
                      <p className="text-3xl font-black text-emerald-900">₹{(donations || []).reduce((acc, d) => acc + d.amount, 0).toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                      <TrendingUp size={24} />
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('donations')}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    Make a Donation <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Heart size={32} className="text-slate-300" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Support the Cause</h4>
                  <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Your contributions fuel our community initiatives and outreach programs.</p>
                  <button 
                    onClick={() => setActiveTab('donations')}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Donate Now
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Activity & News Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Activity size={24} className="text-emerald-500" />
              Activity Feed
            </h3>
            <button 
              onClick={() => setActiveTab('notices')}
              className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
            >
              View Notices
            </button>
          </div>
          <div className="p-8">
            {summary?.actionQueue && summary.actionQueue.length > 0 ? (
              <div className="space-y-4">
                {(summary?.actionQueue || []).map((item: any, i: number) => (
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
                            'text-slate-500'
                          }`}>{item.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400">{safeFormat(item.date || item.createdAt, 'MMM d')}</p>
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
        </motion.div>
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Megaphone size={24} className="text-emerald-500" />
                Latest News
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {news?.slice(0, 3).map((item, i) => (
                <div key={i} className="group cursor-pointer flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 shadow-sm">
                    <img 
                      src={item.featuredImage || `https://picsum.photos/seed/${item.title}/200/200`} 
                      alt="News" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-slate-900 text-sm group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">{item.title}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{safeFormat(item.publishedAt || item.createdAt, 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <Calendar size={24} className="text-blue-500" />
                Events
              </h3>
              <button 
                onClick={() => setActiveTab('events')}
                className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="p-4 space-y-2">
              {events?.slice(0, 3).map((event: any, i) => {
                const date = event.eventDate || event.startDate;
                return (
                  <div key={i} className="p-4 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex flex-col items-center justify-center text-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="text-[10px] font-black uppercase leading-none">{safeFormat(date, 'MMM')}</span>
                      <span className="text-lg font-black leading-none">{safeFormat(date, 'd')}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 truncate text-sm">{event.title}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{event.location}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )}

      {/* Notices Tab */}
      {activeTab === 'notices' && (
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Important Notices</h2>
              <p className="text-slate-600">Stay updated with the latest official communications and alerts.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center gap-2">
                <Bell size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">{notices.length} Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notices.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bell size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Notices</h3>
                <p className="text-slate-600">You're all caught up! Check back later for new updates.</p>
              </div>
            ) : (
              notices?.map((notice, i) => (
                <motion.div 
                  key={notice.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${notice.isPinned ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Bell size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Official Notice</span>
                        <span className="text-sm font-bold text-slate-900">{safeFormat(notice.publishAt || notice.createdAt, 'MMMM d, yyyy')}</span>
                      </div>
                    </div>
                    {notice.isPinned && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full uppercase tracking-wider border border-amber-200">Pinned</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors">{notice.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-8 line-clamp-3 flex-grow">{notice.content}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {safeFormat(notice.publishAt || notice.createdAt, 'h:mm a')}
                      </span>
                    </div>
                    {notice.externalUrl && (
                      <a 
                        href={notice.externalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all flex items-center gap-2"
                      >
                        View Details <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Events Tab Content */}
      {activeTab === 'events' && (
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">My Events</h2>
              <p className="text-slate-600">Upcoming rallies, meetings, and community engagements.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.length === 0 ? (
              <div className="lg:col-span-2 py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Upcoming Events</h3>
                <p className="text-slate-600">You're all caught up! Check back later for new events.</p>
              </div>
            ) : (
              events?.map((event, i) => (
                <motion.div 
                  key={event.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex flex-col items-center justify-center text-center shrink-0 group-hover:scale-105 transition-transform">
                        <span className="text-[10px] font-bold uppercase leading-none">{safeFormat(event.eventDate, 'MMM')}</span>
                        <span className="text-xl font-bold leading-none">{safeFormat(event.eventDate, 'd')}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Event Date</span>
                        <span className="text-sm font-bold text-slate-900">{safeFormat(event.eventDate, 'MMMM d, yyyy')}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      event.audience === 'MEMBERS' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {event.audience}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{event.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-8 line-clamp-2 flex-grow">{event.summary || event.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {event.startAt} {event.endAt ? `- ${event.endAt}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider truncate max-w-[150px]">
                        {event.location}
                      </span>
                    </div>
                    {event.attachmentUrl && (
                      <a 
                        href={event.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="ml-auto px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-blue-600 transition-all flex items-center gap-2"
                      >
                        Details <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Training Tab Content */}
      {activeTab === 'training' && (
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">My Training</h2>
              <p className="text-slate-600">Access official party training materials and educational resources.</p>
            </div>
          </div>

          {!selectedProgram && !selectedCourse && (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search programs or resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  {['All', ...new Set(programs?.map(p => p.category) || [])].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                        filterCategory === cat 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(programs || []).filter(p => {
                  const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                       p.description?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
                  return matchesSearch && matchesCategory;
                }).map((program) => (
                  <div key={program.id} className={`bg-white rounded-2xl border ${program.isPinned ? 'border-emerald-200 shadow-sm' : 'border-slate-200'} p-8 shadow-sm hover:shadow-md transition-all group flex flex-col`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <BookOpen size={28} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {program.isPinned && (
                          <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            <Pin size={12} className="fill-emerald-700" /> Pinned
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
                          <Users size={12} className="text-blue-700" /> {program.audience}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">{program.name}</h3>
                    <p className="text-slate-600 text-sm mb-6 line-clamp-3 flex-grow leading-relaxed">{program.description}</p>
                    
                    <div className="space-y-4 pt-6 border-t border-slate-100 mt-auto">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock size={16} /> {safeFormat(program.createdAt, 'MMM d, yyyy')}</span>
                        <span className="px-2 py-1 bg-slate-100 rounded-md text-slate-600">{program.category}</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {program.courses && program.courses.length > 0 && (
                          <button 
                            onClick={() => setSelectedProgram(program)}
                            className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all group/link"
                          >
                            <span className="text-sm font-bold flex items-center gap-2"><Layers size={18} /> View {program.courses.length} Courses</span>
                            <ChevronRight size={18} className="opacity-0 group-hover/link:opacity-100 transition-all" />
                          </button>
                        )}
                        {program.externalUrl && (
                          <a 
                            href={program.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all group/link border border-slate-200"
                          >
                            <span className="text-sm font-bold flex items-center gap-2"><ExternalLink size={18} /> Open Resource</span>
                            <ChevronRight size={18} className="opacity-0 group-hover/link:opacity-100 transition-all" />
                          </a>
                        )}
                        {program.attachmentUrl && (
                          <a 
                            href={program.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all group/link border border-slate-200"
                          >
                            <span className="text-sm font-bold flex items-center gap-2"><Paperclip size={18} /> Download Material</span>
                            <ChevronRight size={18} className="opacity-0 group-hover/link:opacity-100 transition-all" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {programs.length === 0 && (
                  <div className="col-span-full py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <GraduationCap size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Training Programs Available</h3>
                    <p className="text-slate-600">We are currently developing new training materials. Please check back soon.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {selectedProgram && !selectedCourse && (
            <div className="space-y-8">
              <button 
                onClick={() => setSelectedProgram(null)}
                className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-black uppercase tracking-widest text-[10px] transition-all mb-8 bg-white border border-slate-200 px-6 py-3 rounded-xl w-fit group shadow-sm"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Programs
              </button>

              <div className="bg-white rounded-[2rem] border border-slate-200 p-8 md:p-12 shadow-sm mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">{selectedProgram.name}</h2>
                  <p className="text-slate-600 text-lg leading-relaxed max-w-3xl">{selectedProgram.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {selectedProgram.courses?.map((course) => (
                  <div key={course.id} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all group flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Layers size={24} />
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {course.level}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                    <p className="text-slate-600 text-sm mb-8 line-clamp-2 leading-relaxed flex-grow">{course.description}</p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {course.lessons?.length || 0} Lessons
                      </span>
                      <button 
                        onClick={() => setSelectedCourse(course)}
                        className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-2 group-hover:translate-x-1 transition-transform"
                      >
                        Start Course <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCourse && (
            <div className="space-y-8">
              <button 
                onClick={() => setSelectedCourse(null)}
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-black uppercase tracking-widest text-[10px] transition-all mb-8 bg-white border border-slate-200 px-6 py-3 rounded-xl w-fit group shadow-sm"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Courses
              </button>

              <div className="bg-white rounded-[2rem] border border-slate-200 p-8 md:p-12 shadow-sm mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {selectedCourse.level}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedCourse.lessons?.length || 0} Lessons
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-4">{selectedCourse.title}</h2>
                  <p className="text-slate-600 text-lg leading-relaxed max-w-3xl">{selectedCourse.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                {selectedCourse.lessons?.map((lesson) => (
                  <div key={lesson.id} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row gap-8 hover:border-blue-200 transition-colors">
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-2xl">
                      {lesson.order}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-slate-900 mb-4">{lesson.title}</h3>
                      <div className="prose prose-slate max-w-none mb-8 text-slate-600 leading-relaxed">
                        {lesson.content}
                      </div>
                      {lesson.videoUrl && (
                        <a 
                          href={lesson.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                        >
                          <PlayCircle size={20} className="text-blue-400" /> Watch Video Lesson
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Surveys & Polls Tab Content */}
      {activeTab === 'surveys' && (
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Surveys & Polls</h2>
              <p className="text-slate-600">Your opinion matters. Participate in community feedback and decision making.</p>
            </div>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setSurveyTab('surveys')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${surveyTab === 'surveys' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Surveys
              </button>
              <button 
                onClick={() => setSurveyTab('polls')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${surveyTab === 'polls' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Polls
              </button>
            </div>
          </div>

          {surveyTab === 'surveys' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {surveys?.map((survey) => (
                <div key={survey.id} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all group flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ClipboardList size={28} />
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">{survey.title}</h3>
                  <p className="text-slate-600 text-sm mb-8 line-clamp-3 leading-relaxed flex-grow">{survey.description}</p>
                  
                  <div className="space-y-4 pt-6 border-t border-slate-100 mt-auto">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Calendar size={16} /> {safeFormat(survey.createdAt, 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1"><Users size={16} /> {survey._count?.responses || 0} Responses</span>
                    </div>

                    <button 
                      onClick={async () => {
                        try {
                          const data = await api.get(`/surveys/${survey.id}`);
                          setCurrentSurvey(data);
                          setShowTakeSurvey(true);
                          setAnswers({});
                        } catch (err) {
                          console.error(err);
                          toast.error('Failed to load survey details');
                        }
                      }}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      Take Survey <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {surveys.length === 0 && (
                <div className="col-span-full py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ClipboardList size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Surveys</h3>
                  <p className="text-slate-600">There are no surveys requiring your feedback at this time.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {polls?.map((poll) => (
                <div key={poll.id} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-slate-900">{poll.question}</h3>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        Active
                      </span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{poll._count?.votes || 0} Votes</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {(poll.options || []).map((opt) => {
                      const percentage = (poll._count?.votes || 0) > 0 ? ((opt._count?.votes || 0) / poll._count.votes) * 100 : 0;
                      return (
                        <div key={opt.id} className="space-y-2">
                          <button 
                            onClick={async () => {
                              try {
                                await api.post(`/surveys/polls/${poll.id}/vote`, { optionId: opt.id });
                                // Refresh data
                                const pollsData = await api.get('/surveys/polls');
                                setPolls(Array.isArray(pollsData) ? pollsData.filter((p: any) => p.status === 'ACTIVE') : []);
                              } catch (err: any) {
                                console.error('Error voting:', err);
                                toast.error('Failed to submit vote');
                              }
                            }}
                            className="w-full flex justify-between items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group border border-slate-100 hover:border-slate-300"
                          >
                            <span className="font-bold text-slate-700 group-hover:text-slate-900">{opt.text}</span>
                            <span className="text-sm font-bold text-slate-500">{Math.round(percentage)}%</span>
                          </button>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center pt-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      Live Results
                    </div>
                    <button className="text-slate-400 hover:text-slate-900 transition-colors">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {polls.length === 0 && (
                <div className="col-span-full py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Vote size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Polls</h3>
                  <p className="text-slate-600">There are no active polls at the moment. Check back later!</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Take Survey Modal */}
      {showTakeSurvey && currentSurvey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 md:p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative"
          >
            <button 
              onClick={() => setShowTakeSurvey(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentSurvey.title}</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">{currentSurvey.description}</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              try {
                const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
                  questionId,
                  value,
                }));
                await api.post('/surveys/responses', {
                  surveyId: currentSurvey?.id,
                  answers: formattedAnswers,
                });
                setShowTakeSurvey(false);
                // Refresh data
                const surveysData = await api.get('/surveys');
                setSurveys(Array.isArray(surveysData) ? surveysData.filter((s: any) => s.status === 'ACTIVE') : []);
                toast.success('Survey submitted successfully');
              } catch (err: any) {
                console.error('Error submitting survey:', err);
                toast.error('Failed to submit survey');
              } finally {
                setSubmitting(false);
              }
            }} className="space-y-8">
              {(currentSurvey.questions || []).map((q: any, index: number) => (
                <div key={q.id} className="space-y-4">
                  <label className="block text-lg font-bold text-slate-900">
                    {index + 1}. {q.text}
                  </label>
                  
                  {q.type === 'TEXT' && (
                    <textarea 
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-32 resize-none"
                      required
                    />
                  )}

                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="grid grid-cols-1 gap-3">
                      {(q.options || []).map((opt: string, oIndex: number) => (
                        <label key={oIndex} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${answers[q.id] === opt ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                          <input 
                            type="radio"
                            name={`question-${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                            className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                            required
                          />
                          <span className="font-bold">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'RATING' && (
                    <div className="flex justify-between gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="flex flex-col items-center gap-2 cursor-pointer flex-1">
                          <input 
                            type="radio"
                            name={`question-${q.id}`}
                            value={rating}
                            checked={answers[q.id] === rating.toString()}
                            onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                            className="sr-only"
                            required
                          />
                          <div className={`w-full aspect-square rounded-xl flex items-center justify-center text-xl font-bold transition-all ${answers[q.id] === rating.toString() ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                            {rating}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-4 pt-8 border-t border-slate-200">
                <button 
                  type="button"
                  onClick={() => setShowTakeSurvey(false)}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Help & Grievances Tab Content */}
      {activeTab === 'grievances' && (
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Help & Grievances</h2>
              <p className="text-slate-600">Report issues, seek assistance, or provide feedback directly to our team.</p>
            </div>
            <button 
              onClick={() => setShowNewGrievanceModal(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={18} />
              Submit New Grievance
            </button>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <History size={20} className="text-emerald-600" />
              Your Submission History
            </h3>

            {grievances.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Grievances Found</h3>
                <p className="text-slate-600">You haven't submitted any grievances or help requests yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {(grievances || [])?.map((g) => (
                  <motion.div 
                    key={g.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedGrievance(g)}
                    className="bg-white rounded-2xl border border-slate-200 p-8 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <GrievanceStatusBadge status={g.status} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                          {g.category.name}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={16} />
                        {safeFormat(g.createdAt, 'MMM d, yyyy')}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">{g.title}</h4>
                    <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">{g.description}</p>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <MessageCircle size={16} />
                        {g.responses?.length || 0} Responses
                      </div>
                      <div className="text-emerald-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Details <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* New Grievance Modal */}
      {showNewGrievanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 md:p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative"
          >
            <button 
              onClick={() => setShowNewGrievanceModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Submit Grievance</h2>
            <p className="text-slate-600 mb-8 leading-relaxed">Provide detailed information about your concern. We will review it promptly.</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              try {
                await api.post('/grievances', newGrievance);
                setShowNewGrievanceModal(false);
                setNewGrievance({ title: '', description: '', categoryId: '', priority: 'MEDIUM' });
                // Refresh data
                const gData = await api.get('/grievances');
                setGrievances(Array.isArray(gData) ? gData : []);
                toast.success('Grievance submitted successfully');
              } catch (err: any) {
                console.error('Error submitting grievance:', err);
                toast.error('Failed to submit grievance');
              } finally {
                setSubmitting(false);
              }
            }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Title</label>
                <input 
                  required
                  type="text" 
                  value={newGrievance.title}
                  onChange={e => setNewGrievance({...newGrievance, title: e.target.value})}
                  placeholder="Brief summary of the issue"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Category</label>
                  <select 
                    required
                    value={newGrievance.categoryId}
                    onChange={e => setNewGrievance({...newGrievance, categoryId: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                  >
                    <option value="">Select Category</option>
                    {(grievanceCategories || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Priority</label>
                  <select 
                    required
                    value={newGrievance.priority}
                    onChange={e => setNewGrievance({...newGrievance, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={newGrievance.description}
                  onChange={e => setNewGrievance({...newGrievance, description: e.target.value})}
                  placeholder="Provide detailed information..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                <button 
                  type="button"
                  onClick={() => setShowNewGrievanceModal(false)}
                  className="px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Grievance Detail Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-slate-200 flex justify-between items-start bg-slate-50">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <GrievanceStatusBadge status={selectedGrievance.status} />
                  <GrievancePriorityBadge priority={selectedGrievance.priority} />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {selectedGrievance.category?.name || 'General'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedGrievance.title}</h2>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <Calendar size={16} />
                  Submitted on {safeFormat(selectedGrievance.createdAt, 'MMM d, yyyy')}
                </div>
              </div>
              <button 
                onClick={() => setSelectedGrievance(null)}
                className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap text-base leading-relaxed">{selectedGrievance.description}</p>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-4 flex items-center gap-2">
                  <MessageCircle size={20} className="text-emerald-600" />
                  Updates & Responses
                </h3>
                
                {(!selectedGrievance.responses || (selectedGrievance.responses || []).filter(r => !r.isInternal).length === 0) ? (
                  <div className="text-center py-12 text-slate-500 italic bg-slate-50 rounded-xl">
                    No public responses yet. Our team is reviewing your concern.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(selectedGrievance.responses || []).filter(r => !r.isInternal).map(response => (
                      <div key={response.id} className={`p-6 rounded-2xl ${response.userId === user?.id ? 'bg-emerald-50 ml-12' : 'bg-slate-50 mr-12'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                              <User size={16} />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{response.user?.displayName || 'Team Member'}</span>
                          </div>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{safeFormat(response.createdAt, 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{response.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-slate-200 bg-slate-50">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!grievanceResponse.trim()) return;
                setSubmitting(true);
                try {
                  await api.post(`/grievances/${selectedGrievance.id}/responses`, {
                    content: grievanceResponse,
                    isInternal: false
                  });
                  setGrievanceResponse('');
                  // Refresh data
                  const updated = await api.get('/grievances');
                  setGrievances(Array.isArray(updated) ? updated : []);
                  setSelectedGrievance(updated.find((g: any) => g.id === selectedGrievance.id) || null);
                  toast.success('Response sent');
                } catch (err: any) {
                  console.error('Error submitting response:', err);
                  toast.error('Failed to send response');
                } finally {
                  setSubmitting(false);
                }
              }} className="space-y-4">
                <textarea 
                  required
                  value={grievanceResponse}
                  onChange={e => setGrievanceResponse(e.target.value)}
                  placeholder="Add a comment or provide more details..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none shadow-sm"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button 
                    type="submit"
                    disabled={submitting || !grievanceResponse.trim()}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Profile Tab Content */}
      {/* Membership Tab */}
      {activeTab === 'membership' && (
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">My Membership</h2>
              <p className="text-slate-600">Manage your official party membership and access exclusive benefits.</p>
            </div>
          </div>

          {user.role === 'MEMBER' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <Award size={24} className="text-emerald-500" />
                    Your Membership
                  </h3>
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Status</p>
                      <p className="text-lg font-bold text-emerald-900">ACTIVE MEMBER</p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Member ID</span>
                        <span className="font-mono font-bold text-slate-800">{profile?.membershipId || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Province</span>
                        <span className="font-bold text-slate-800">{profile?.province || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">District</span>
                        <span className="font-bold text-slate-800">{profile?.district || '---'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => setShowIdCard(true)}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <IdCard size={18} />
                        View Digital ID
                      </button>
                      <button 
                        onClick={() => setIsRenewing(true)}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <Clock size={18} />
                        Renew Membership
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm h-full">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Membership Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { title: 'Voting Rights', desc: 'Participate in internal party elections and policy decisions.' },
                      { title: 'Exclusive Training', desc: 'Access advanced political and leadership training programs.' },
                      { title: 'Event Access', desc: 'Priority registration for party conventions and rallies.' },
                      { title: 'Direct Feedback', desc: 'Direct channel to provide feedback to party leadership.' }
                    ].map((benefit, i) => (
                      <div key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                        <h4 className="font-bold text-slate-900 mb-2">{benefit.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{benefit.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : user.role === 'APPLICANT_MEMBER' ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Clock size={48} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Application Under Review</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">Your membership application is currently being processed by our verification team. We will notify you once your status is updated.</p>
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-amber-600">65%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[65%] rounded-full" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Award size={48} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Join the Movement</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">Become a formal member of the party to unlock voting rights, exclusive training, and direct participation in our mission.</p>
              <button 
                onClick={() => setCurrentView('membership-public')}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-sm"
              >
                Apply for Membership
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Volunteer Tab */}
      {activeTab === 'volunteer' && (
        <motion.div variants={itemVariants} className="space-y-8">
          {volunteer ? (
            volunteer.status === 'APPROVED' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <Heart size={24} className="text-rose-500" />
                      Volunteer Status
                    </h3>
                    <div className="space-y-6">
                      <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                        <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Status</p>
                        <p className="text-lg font-bold text-rose-900">ACTIVE VOLUNTEER</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hours</p>
                          <p className="text-2xl font-bold text-slate-900">{volunteer.totalHours || 0}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Projects</p>
                          <p className="text-2xl font-bold text-slate-900">{volunteer.projectsCount || 0}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setCurrentView('volunteer-enrollment')}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition-all shadow-sm"
                      >
                        Volunteer Portal
                      </button>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm h-full">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Active Assignments</h3>
                    <div className="space-y-4">
                      {volunteer.assignments?.length > 0 ? (
                        volunteer?.assignments?.map((as: any, i: number) => (
                          <div key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-slate-900">{as.title}</h4>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{as.role}</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">In Progress</span>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-slate-500 font-bold text-sm">No active assignments.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Clock size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Volunteer Application Pending</h3>
                <p className="text-slate-500 font-medium mb-8">Thank you for your interest in volunteering! Our team is reviewing your application and will reach out shortly.</p>
              </div>
            )
          ) : (
            <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <Heart size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Volunteer for Change</h3>
              <p className="text-slate-500 font-medium mb-12">Join our team of dedicated volunteers and make a real impact on the ground. Your skills and time can help us build a better future.</p>
              <button 
                onClick={() => setCurrentView('volunteer-enrollment')}
                className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-rose-600 transition-all shadow-xl shadow-slate-200"
              >
                Apply to Volunteer
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Donations Tab */}
      {activeTab === 'donations' && (
        <motion.div variants={itemVariants} className="space-y-8">
          {/* Donation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-rose-600 rounded-2xl p-8 text-white shadow-md">
              <p className="text-xs font-bold text-rose-200 uppercase tracking-wider mb-2">Total Contributions</p>
              <p className="text-4xl font-bold">NPR {(donorProfile?.totalDonated || donations.reduce((acc, d) => acc + d.amount, 0)).toLocaleString()}</p>
              <div className="mt-4 flex items-center gap-2 text-rose-200 text-sm font-bold">
                <Heart size={16} />
                <span>{donations.length} Contributions made</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Donor Level</p>
              <p className="text-4xl font-bold text-slate-900">{donorProfile?.donorLevel || 'Supporter'}</p>
              <p className="mt-4 text-slate-600 text-sm italic">Your support fuels our movement.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Action</p>
                <p className="text-xl font-bold text-slate-900">Support a Campaign</p>
              </div>
              <button 
                onClick={() => setCurrentView('donate')}
                className="mt-6 w-full py-3 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-sm"
              >
                Donate Now
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Donation History */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Activity size={24} className="text-rose-500" />
                Contribution History
              </h3>
              <div className="space-y-4">
                {donations.length > 0 ? (
                  donations?.map((donation, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Heart size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{donation.campaign?.title || 'General Donation'}</h4>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                            {safeFormat(donation.transaction?.date || donation.createdAt || new Date(), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">NPR {(Number(donation.transaction?.amount || donation.amount) || 0).toLocaleString()}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full inline-block mt-1 ${
                          donation.transaction?.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {donation.transaction?.status || 'PENDING'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Heart size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 font-bold text-sm">No contributions yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Megaphone size={24} className="text-emerald-500" />
                Active Campaigns
              </h3>
              <div className="space-y-4">
                {activeCampaigns.length > 0 ? (
                  activeCampaigns?.slice(0, 3).map((campaign, i) => (
                    <div key={i} className="p-6 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900">{campaign.title}</h4>
                          <p className="text-sm text-slate-600 line-clamp-1 mt-1">{campaign.description}</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {(campaign.fundraiserType || '').replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                          <span className="text-slate-500">Progress</span>
                          <span className="text-emerald-600">{Math.round((Number(campaign.currentAmount || 0) / Number(campaign.goalAmount || 1)) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, (Number(campaign.currentAmount || 0) / Number(campaign.goalAmount || 1)) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-900">NPR {(Number(campaign.currentAmount) || 0).toLocaleString()}</span>
                          <span className="text-slate-500">Goal: NPR {(Number(campaign.goalAmount) || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setCurrentView('donate')}
                        className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
                      >
                        Support Campaign
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <Megaphone size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active campaigns.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'profile' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {isEditingProfile && (user.role === 'MEMBER' || user.role === 'APPLICANT_MEMBER') ? (
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
              <MemberProfileSettings 
                profile={profile} 
                onBack={() => setIsEditingProfile(false)} 
                onUpdate={async () => {
                  const profileData = await api.get('/members/me').catch(() => null);
                  setProfile(profileData);
                  setIsEditingProfile(false);
                }} 
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Summary Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                  <div className="relative inline-block mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-50 bg-slate-100 shadow-inner">
                      <img 
                        src={profile?.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 text-white rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{user.displayName}</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mt-1">{user.role.replace('_', ' ')}</p>
                  
                  <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Verification</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {user.isActive ? 'Verified' : 'Unverified'}
                        </span>
                        {!user.isActive && user.role === 'PUBLIC' && (
                          <button 
                            onClick={async () => {
                              try {
                                await api.post('/auth/verify-me', {});
                                toast.success('Identity verified successfully!');
                                window.location.reload();
                              } catch (err) {
                                toast.error('Verification failed');
                              }
                            }}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline uppercase tracking-wider"
                          >
                            Verify Now
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Member Since</span>
                      <span className="text-slate-900 font-bold">{safeFormat(user.createdAt, 'MMM yyyy')}</span>
                    </div>
                  </div>

                  {(user.role === 'MEMBER' || user.role === 'APPLICANT_MEMBER') && (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-sm"
                    >
                      Edit Profile Details
                    </button>
                  )}
                </div>

                {/* Identity Context */}
                <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-md">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-6">Linked Identity</h3>
                  <div className="space-y-6">
                    {user.role === 'MEMBER' && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                          <Shield size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membership</p>
                          <p className="font-bold text-white">Active Party Member</p>
                        </div>
                      </div>
                    )}
                    {volunteer && (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                          <Heart size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volunteer</p>
                          <p className="font-bold text-white">{volunteer.status === 'APPROVED' ? 'Active Volunteer' : 'Volunteer Applicant'}</p>
                        </div>
                      </div>
                    )}
                    {!volunteer && user.role === 'PUBLIC' && (
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-sm text-slate-300 leading-relaxed">
                          You are currently a <span className="text-white font-bold">Registered User</span>. Join as a member or volunteer to unlock more features.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details & Settings */}
              <div className="lg:col-span-2 space-y-8">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <User size={24} className="text-emerald-500" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</p>
                      <p className="text-lg font-bold text-slate-900">{user.displayName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</p>
                      <p className="text-lg font-bold text-slate-900">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</p>
                      <p className="text-lg font-bold text-slate-900">{user.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Type</p>
                      <p className="text-lg font-bold text-slate-900 uppercase">{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Member Specific Details */}
                {profile && (
                  <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <Award size={24} className="text-blue-500" />
                      Membership Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Membership ID</p>
                        <p className="text-lg font-bold text-slate-900">{profile.membershipId || 'Pending'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Province</p>
                        <p className="text-lg font-bold text-slate-900">{profile.province || 'Not specified'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">District</p>
                        <p className="text-lg font-bold text-slate-900">{profile.district || 'Not specified'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Local Level</p>
                        <p className="text-lg font-bold text-slate-900">{profile.localLevel || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Security */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <Shield size={24} className="text-rose-500" />
                    Account Security
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900">Password</p>
                        <p className="text-sm text-slate-600 mt-1">Last changed {safeFormat(user.createdAt, 'MMM d, yyyy')}</p>
                      </div>
                      <button className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm">
                        Change
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-600 mt-1">Add an extra layer of security to your account.</p>
                      </div>
                      <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
      {/* Member ID Card Modal */}
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

      {showIdCard && profile && (
        <MemberCardModal 
          member={profile} 
          onClose={() => setShowIdCard(false)} 
        />
      )}
    </motion.div>
  );
};

export default CentralizedPublicDashboard;
