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
  Lock,
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
  History,
  Layers,
  ArrowLeft,
  PlayCircle,
  Vote,
  ClipboardList,
  Send,
  X,
  Plus,
  PlusCircle,
  ShieldCheck,
  MessageCircle,
  MessageSquareText,
  IdCard,
  AlertCircle,
  Info,
  LayoutDashboard,
  HandCoins,
  Smartphone,
  UserCircle,
  Loader2,
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

  // Volunteer reporting state
  const [isReporting, setIsReporting] = useState(false);
  const [reportingAssignment, setReportingAssignment] = useState<any>(null);
  const [reportData, setReportData] = useState({ content: '', hoursSpent: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchVolunteerStatus = async () => {
    try {
      const data = await api.get('/volunteers/me');
      setVolunteer(data);
      return data;
    } catch (error) {
      console.error('Error fetching volunteer status:', error);
      return null;
    }
  };

  const getProgress = () => {
    if (profile?.status === 'APPROVED' || profile?.status === 'ACTIVE') return 100;
    if (profile?.status === 'VERIFIED') return 75;
    if (profile?.status === 'PENDING') return 40;
    if (profile?.status === 'REJECTED') return 0;
    return 20; // Default for just started
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
        promises.push(fetchVolunteerStatus());
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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingAssignment) return;
    
    setSubmittingReport(true);
    try {
      await api.post('/volunteers/report', {
        assignmentId: reportingAssignment.id,
        content: reportData.content,
        hoursSpent: parseFloat(reportData.hoursSpent) || 0
      });
      toast.success('Activity report submitted successfully!');
      setIsReporting(false);
      setReportData({ content: '', hoursSpent: '' });
      setReportingAssignment(null);
      // Refresh volunteer data to update stats and assignment status
      await fetchVolunteerStatus();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
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

  const getBackState = () => {
    if (selectedCourse) return { label: 'BACK TO COURSES', action: () => setSelectedCourse(null) };
    if (selectedProgram) return { label: 'BACK TO PROGRAMS', action: () => setSelectedProgram(null) };
    if (isEditingProfile) return { label: 'BACK TO PROFILE', action: () => setIsEditingProfile(false) };
    if (activeTab !== 'overview') return { label: 'BACK TO DASHBOARD', action: () => setActiveTab('overview') };
    return { label: 'EXIT TO PORTAL', action: () => setCurrentView('public') };
  };

  const backState = getBackState();

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
            onClick={backState.action}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:text-slate-900 transition-all group shadow-sm"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">{backState.label}</span>
          </button>
          
          <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />
          
          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <button 
              onClick={() => {
                setActiveTab('overview');
                setSelectedProgram(null);
                setSelectedCourse(null);
                setIsEditingProfile(false);
              }}
              className={`text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === 'overview' ? 'text-slate-900' : 'hover:text-emerald-600'}`}
            >
              <LayoutDashboard size={14} />
              DASHBOARD
            </button>
            
            {activeTab !== 'overview' && (
              <>
                <ChevronRight size={12} className="text-slate-300" />
                <button 
                  onClick={() => {
                    setSelectedProgram(null);
                    setSelectedCourse(null);
                    setIsEditingProfile(false);
                  }}
                  className={`text-xs font-black uppercase tracking-widest transition-all ${(!selectedProgram && !isEditingProfile) ? 'text-slate-900' : 'hover:text-emerald-600'}`}
                >
                  {activeTab.toUpperCase()}
                </button>
              </>
            )}

            {selectedProgram && (
              <>
                <ChevronRight size={12} className="text-slate-300" />
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className={`text-xs font-black uppercase tracking-widest transition-all ${!selectedCourse ? 'text-slate-900' : 'hover:text-emerald-600'} truncate max-w-[120px]`}
                >
                  {selectedProgram.name.toUpperCase()}
                </button>
              </>
            )}

            {selectedCourse && (
              <>
                <ChevronRight size={12} className="text-slate-300" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-900 truncate max-w-[120px]">
                  {selectedCourse.title.toUpperCase()}
                </span>
              </>
            )}

            {isEditingProfile && (
              <>
                <ChevronRight size={12} className="text-slate-300" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-900">
                  EDIT PROFILE
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{user.displayName}</p>
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

      {/* Hero Section - Operations Style */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 p-1 shadow-inner overflow-hidden shrink-0 hidden sm:block">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {user.displayName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${user.role === 'MEMBER' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              {user.orgUnitName ? `${user.orgUnitName} • ` : ''}ID: #{user.id.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 min-w-[300px]">
          {/* Dynamic Status Card */}
          <div className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Status</span>
              {user.role === 'MEMBER' ? (
                <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 size={16} /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 text-xs font-bold">
                  <AlertCircle size={16} /> {profile?.status || 'Pending'}
                </span>
              )}
            </div>
             <div className="w-1/2 max-w-[100px]">
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: user.role === 'MEMBER' ? '100%' : `${getProgress()}%` }}
                    className={`h-full rounded-full ${user.role === 'MEMBER' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                </div>
                <p className="text-[10px] text-right mt-1 font-medium text-slate-500">{getProgress()}%</p>
             </div>
          </div>

          {/* Primary Action Button */}
          {user.role === 'PUBLIC' && (
            <button 
              onClick={() => setActiveTab('membership')}
              className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Apply Now
              <ArrowRight size={14} />
            </button>
          )}
          {user.role === 'APPLICANT_MEMBER' && (
            <button 
              onClick={() => setActiveTab('membership')}
              className="px-6 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Track Status
              <ArrowRight size={14} />
            </button>
          )}
          {user.role === 'MEMBER' && (
            <button 
              onClick={() => setActiveTab('volunteer')}
              className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              Find Projects
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Actions Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { id: 'membership', label: 'Membership', icon: UserPlus, color: 'bg-emerald-500 text-white', hover: 'hover:bg-emerald-600', show: true },
              { id: 'grievances', label: 'Help Desk', icon: ShieldAlert, color: 'bg-rose-50 text-rose-600', hover: 'hover:bg-rose-100', show: true },
              { id: 'donations', label: 'Donate', icon: Heart, color: 'bg-pink-50 text-pink-600', hover: 'hover:bg-pink-100', show: true },
              { id: 'volunteer', label: 'Volunteer', icon: Zap, color: 'bg-amber-50 text-amber-600', hover: 'hover:bg-amber-100', show: true }
            ].filter(a => a.show).map((action) => (
              <button
                key={action.id}
                onClick={() => setActiveTab(action.id as any)}
                className={`group p-3 rounded-xl border border-slate-200 shadow-sm transition-all text-left flex items-center gap-3 ${action.color} ${action.hover}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/20`}>
                  <action.icon size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">{action.label}</h3>
                </div>
              </button>
            ))}
          </motion.div>

      {/* Dashboard Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Status & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Membership Status Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Award size={14} className="text-emerald-600" />
                MEMBERSHIP STATUS
              </h3>
              <button 
                onClick={() => setActiveTab('membership')}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                Manage <ArrowRight size={10} />
              </button>
            </div>
            <div className="p-3">
              {user.role === 'MEMBER' ? (
                <div className="flex flex-col md:flex-row gap-3 items-center">
                  <div className="w-full md:w-auto flex justify-center">
                    <div className="scale-[0.65] origin-center md:origin-left -my-4">
                      {profile && <MemberIdCard member={profile} />}
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Joined</p>
                        <p className="text-sm font-bold text-slate-900">
                          {profile?.joinedDate || profile?.createdAt 
                            ? safeFormat(profile.joinedDate || profile.createdAt, 'MMM yyyy') 
                            : 'Pending record'}
                        </p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Expiry</p>
                        <p className="text-sm font-bold text-slate-900">{profile?.expiryDate ? safeFormat(profile.expiryDate, 'dd MMM yyyy') : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setActiveTab('membership')}
                        className="flex-1 py-1.5 bg-slate-100 text-slate-700 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download size={10} /> ID Card
                      </button>
                      <button 
                        onClick={() => { setActiveTab('membership'); setIsRenewing(true); }}
                        className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 border border-emerald-200"
                      >
                        <Clock size={10} /> Renew
                      </button>
                    </div>
                  </div>
                </div>
              ) : user.role === 'APPLICANT_MEMBER' ? (
                <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm uppercase tracking-tight">Application Pending</p>
                      <p className="text-[11px] text-amber-700 font-black uppercase tracking-widest">Est. 3-5 business days</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('membership')}
                    className="px-2.5 py-1 bg-white text-amber-600 rounded-md font-bold text-[10px] uppercase tracking-widest border border-amber-200 hover:bg-amber-50 transition-all"
                  >
                    Track
                  </button>
                </div>
              ) : (
                <div className="p-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                    <UserPlus size={14} className="text-slate-400" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mb-0.5 uppercase tracking-tight">Join the Movement</h4>
                  <p className="text-slate-500 text-[11px] mb-2 max-w-[200px] mx-auto uppercase font-bold tracking-tight opacity-70">Become an official member to unlock voting rights and exclusive party benefits.</p>
                  <button 
                    onClick={() => setActiveTab('membership')}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    Start Application
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Volunteer Hub Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Zap size={14} className="text-indigo-600" />
                VOLUNTEER HUB
              </h3>
              <button 
                onClick={() => setActiveTab('volunteer')}
                className="text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1"
              >
                Portal <ArrowRight size={10} />
              </button>
            </div>
            <div className="p-3">
              {volunteer && (volunteer.status === 'APPROVED' || volunteer.status === 'ACTIVE') ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 flex justify-between items-center">
                      <p className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Hours</p>
                      <p className="text-sm font-bold text-indigo-900">{volunteer.totalHours || 0}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Projects</p>
                      <p className="text-sm font-bold text-slate-900">{volunteer.assignments?.length || 0}</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-white flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Task</p>
                      <p className="text-sm font-medium leading-tight text-slate-300">New community projects available in your district.</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('volunteer')}
                      className="mt-2 w-full py-1 bg-indigo-500 text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all"
                    >
                      View Tasks
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                    <Zap size={14} className="text-slate-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">Serve your Community</h4>
                  <p className="text-slate-500 text-[11px] mb-2 max-w-[200px] mx-auto">Join our volunteer network to make a direct impact on the ground.</p>
                  <button 
                    onClick={() => setActiveTab('volunteer')}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all"
                  >
                    Apply to Volunteer
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Grievances Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-rose-600" />
                GRIEVANCES & SUPPORT
              </h3>
              <button 
                onClick={() => setActiveTab('grievances')}
                className="text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-rose-600 transition-colors flex items-center gap-1"
              >
                History <ArrowRight size={10} />
              </button>
            </div>
            <div className="p-3">
              {grievances.length > 0 ? (
                <div className="space-y-1.5">
                  {(grievances || []).slice(0, 2).map((g, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-sm transition-all group/item cursor-pointer" onClick={() => setActiveTab('grievances')}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                          <ShieldAlert size={12} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{g.title}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <GrievanceStatusBadge status={g.status} />
                            <span className="text-[11px] font-medium text-slate-500">{safeFormat(g.createdAt, 'MMM d')}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={12} className="text-slate-300 group-hover/item:text-rose-500 transition-colors shrink-0" />
                    </div>
                  ))}
                  <button 
                    onClick={() => { setActiveTab('grievances'); setShowNewGrievanceModal(true); }}
                    className="w-full py-1.5 bg-rose-50 text-rose-700 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5 border border-rose-200 mt-1"
                  >
                    <Plus size={10} /> Submit New Request
                  </button>
                </div>
              ) : (
                <div className="p-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                    <ShieldAlert size={14} className="text-slate-400" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-0.5">Need Assistance?</h4>
                  <p className="text-slate-500 text-[11px] mb-2 max-w-[200px] mx-auto">Our support team is here to help you with any issues or grievances.</p>
                  <button 
                    onClick={() => { setActiveTab('grievances'); setShowNewGrievanceModal(true); }}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-md font-bold text-xs uppercase tracking-widest hover:bg-rose-700 transition-all"
                  >
                    Submit Grievance
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Profile & Engagement */}
        <div className="space-y-6">
          {/* Profile Summary Widget */}
          <motion.div variants={itemVariants} className="bg-slate-900 rounded-xl p-3.5 text-white shadow-sm relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-2xl" />
            
            <div className="flex flex-col items-center text-center space-y-2 relative z-10">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden shadow-sm bg-slate-800">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <CheckCircle2 size={8} className="text-white" />
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-black tracking-tight uppercase">{user.displayName}</h4>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">{user.role.replace('_', ' ')}</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 w-full">
                <div className="p-1.5 bg-white/5 rounded border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">ID TAG</p>
                  <p className="text-[11px] font-black tracking-tight">#{user.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="p-1.5 bg-white/5 rounded border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">STATUS</p>
                  <p className="text-[11px] font-black text-emerald-400 tracking-tight uppercase">VERIFIED</p>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab('profile')}
                className="w-full py-1.5 bg-white text-slate-900 rounded font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Settings size={10} /> MANAGE PROFILE
              </button>
            </div>
          </motion.div>

          {/* Training Programs Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                <GraduationCap size={12} className="text-blue-600" />
                TRAINING & SKILLS
              </h3>
              <button 
                onClick={() => setActiveTab('training')}
                className="text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                CATALOG <ArrowRight size={10} />
              </button>
            </div>
            <div className="p-2.5 space-y-1.5">
              {programs.length > 0 ? (
                (programs || []).slice(0, 2).map((p, i) => (
                  <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:shadow-sm transition-all cursor-pointer" onClick={() => setActiveTab('training')}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-blue-500 shadow-sm shrink-0 border border-slate-100">
                        <BookOpen size={10} />
                      </div>
                      <div className="min-w-0">
                <p className="font-black text-slate-900 text-[11px] truncate max-w-[140px] uppercase tracking-tight">{p.name}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{p.category}</p>
                      </div>
                    </div>
                    <ChevronRight size={10} className="text-slate-300 group-hover/item:text-blue-500 transition-colors shrink-0" />
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-[10px] italic text-center py-1.5 font-medium uppercase tracking-tight">No new programs available.</p>
              )}
              <button 
                onClick={() => setActiveTab('training')}
                className="w-full py-1.5 bg-blue-50 text-blue-700 rounded font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 border border-blue-100 mt-1 shadow-sm"
              >
                EXPLORE TRAINING <ArrowUpRight size={10} />
              </button>
            </div>
          </motion.div>

          {/* Surveys & Polls Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                <ListTodo size={14} className="text-indigo-600" />
                SURVEYS & POLLS
              </h3>
              <button 
                onClick={() => setActiveTab('surveys')}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-1"
              >
                PARTICIPATE <ArrowRight size={10} />
              </button>
            </div>
            <div className="p-2.5 space-y-1.5">
              {surveys.length > 0 || polls.length > 0 ? (
                <>
                  {(surveys || []).slice(0, 1).map((s, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between group/item hover:bg-white hover:shadow-sm transition-all cursor-pointer" onClick={() => setActiveTab('surveys')}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-indigo-500 shadow-sm shrink-0 border border-slate-100">
                          <ClipboardList size={10} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 text-[11px] truncate max-w-[140px] uppercase tracking-tight">{s.title}</p>
                          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest truncate">ACTIVE SURVEY</p>
                        </div>
                      </div>
                      <ChevronRight size={10} className="text-slate-300 group-hover/item:text-indigo-500 transition-colors shrink-0" />
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-slate-500 text-[10px] italic text-center py-1.5 font-medium uppercase tracking-tight">No active surveys found.</p>
              )}
              <button 
                onClick={() => setActiveTab('surveys')}
                className="w-full py-1.5 bg-indigo-50 text-indigo-700 rounded font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5 border border-indigo-200 mt-1 shadow-sm"
              >
                <Vote size={10} /> JOIN DISCUSSION
              </button>
            </div>
          </motion.div>

          {/* Donor Impact Widget */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                <Heart size={14} className="text-emerald-600" />
                DONOR IMPACT
              </h3>
              <button 
                onClick={() => setActiveTab('donations')}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                HISTORY <ArrowRight size={10} />
              </button>
            </div>
            <div className="p-2.5">
              {donations.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">TOTAL CONTRIBUTION</p>
                      <p className="text-sm font-black text-emerald-900">₹{(donations || []).reduce((acc, d) => acc + d.amount, 0).toLocaleString()}</p>
                    </div>
                    <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-emerald-500 shadow-sm shrink-0 border border-emerald-100">
                      <TrendingUp size={12} />
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('donations')}
                    className="w-full py-1.5 bg-slate-900 text-white rounded font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    MAKE A DONATION <ArrowRight size={10} />
                  </button>
                </div>
              ) : (
                <div className="p-2.5 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-sm border border-slate-100">
                    <Heart size={12} className="text-slate-400" />
                  </div>
                  <h4 className="text-[11px] font-black text-slate-900 mb-0.5 uppercase tracking-tight">SUPPORT THE CAUSE</h4>
                  <p className="text-slate-500 text-[10px] mb-2 max-w-[180px] mx-auto font-medium leading-tight">Your contributions fuel our community initiatives and outreach programs.</p>
                  <button 
                    onClick={() => setActiveTab('donations')}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-sm"
                  >
                    DONATE NOW
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Activity & News Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
              <Activity size={16} className="text-emerald-600" />
              ACTIVITY FEED
            </h3>
            <button 
              onClick={() => setActiveTab('notices')}
              className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-600 transition-colors flex items-center gap-1"
            >
              NOTICES <ArrowRight size={10} />
            </button>
          </div>
          <div className="p-2.5">
            {summary?.actionQueue && summary.actionQueue.length > 0 ? (
              <div className="space-y-1.5">
                {(summary?.actionQueue || []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center text-slate-400 shadow-sm group-hover:text-emerald-600 transition-colors shrink-0 border border-slate-100">
                        {item.type === 'GRIEVANCE' ? <ShieldAlert size={12} className="text-rose-500" /> : 
                         item.type === 'MEMBERSHIP' ? <Award size={12} className="text-emerald-500" /> : 
                         item.type === 'DONATION' ? <Heart size={12} className="text-pink-500" /> :
                         item.type === 'SURVEY' ? <ListTodo size={12} className="text-blue-500" /> :
                         item.type === 'CAMPAIGN' ? <Megaphone size={12} className="text-indigo-500" /> :
                         <FileText size={12} className="text-slate-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-[11px] truncate uppercase tracking-tight">{item.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.type}</span>
                          <div className="w-0.5 h-0.5 bg-slate-300 rounded-full" />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                            item.status === 'COMPLETED' || item.status === 'APPROVED' || item.status === 'ACTIVE' ? 'text-emerald-600' : 
                            item.status === 'PENDING' || item.status === 'VERIFIED' ? 'text-amber-600' : 
                            'text-slate-500'
                          }`}>{item.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{safeFormat(item.date || item.createdAt, 'MMM d')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-sm border border-slate-100">
                  <ListTodo size={14} className="text-slate-300" />
                </div>
                <h4 className="text-[11px] font-black text-slate-900 mb-0.5 uppercase tracking-tight">NO ACTIVITY YET</h4>
                <p className="text-slate-500 text-[10px] max-w-[200px] mx-auto font-medium uppercase tracking-tight">Start your journey by exploring the quick actions above!</p>
              </div>
            )}
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                <Megaphone size={16} className="text-emerald-600" />
                LATEST NEWS
              </h3>
            </div>
            <div className="p-2.5 space-y-2">
              {news?.slice(0, 3).map((item, i) => (
                <div key={i} className="group cursor-pointer flex gap-2.5 items-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden shrink-0 shadow-sm border border-slate-100">
                    <img 
                      src={item.featuredImage || `https://picsum.photos/seed/${item.title}/200/200`} 
                      alt="News" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="font-black text-slate-900 text-[11px] group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight uppercase tracking-tight">{item.title}</h4>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{safeFormat(item.publishedAt || item.createdAt, 'MMM d, yyyy')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                <Calendar size={16} className="text-blue-600" />
                EVENTS
              </h3>
              <button 
                onClick={() => setActiveTab('events')}
                className="text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                VIEW ALL <ArrowRight size={10} />
              </button>
            </div>
            <div className="p-2 space-y-1">
              {events?.slice(0, 3).map((event: any, i) => {
                const date = event.eventDate || event.startDate;
                return (
                  <div key={i} className="p-1.5 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('events')}>
                    <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-md flex flex-col items-center justify-center text-center shrink-0 group-hover:scale-105 transition-transform border border-blue-100">
                      <span className="text-[11px] font-black uppercase leading-none">{safeFormat(date, 'MMM')}</span>
                      <span className="text-sm font-black leading-none mt-0.5">{safeFormat(date, 'd')}</span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 truncate text-[12px] uppercase tracking-tight">{event.title}</h4>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest truncate">{event.location}</p>
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
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">IMPORTANT NOTICES</h2>
              <p className="text-slate-500 text-[11px] mt-0.5 uppercase font-bold tracking-wider">Stay updated with official communications and alerts</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <Bell size={12} />
                <span className="text-[10px] font-black uppercase tracking-widest">{notices.length} ACTIVE NOTICES</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notices.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <Bell size={24} className="text-slate-300" />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1 uppercase tracking-widest">NO ACTIVE NOTICES</h3>
                <p className="text-slate-500 text-[11px] uppercase font-bold tracking-tight">You're all caught up! Check back later for updates.</p>
              </div>
            ) : (
              notices?.map((notice, i) => (
                <motion.div 
                  key={notice.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col border-l-4 border-l-slate-300 hover:border-l-emerald-500"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 border ${notice.isPinned ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        <Bell size={14} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">OFFICIAL NOTICE</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{safeFormat(notice.publishAt || notice.createdAt, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    {notice.isPinned && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded uppercase tracking-widest border border-amber-100">PINNED</span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-black text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight uppercase tracking-tight">{notice.title}</h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed mb-4 line-clamp-3 flex-grow font-medium">{notice.content}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                         {safeFormat(notice.publishAt || notice.createdAt, 'h:mm a')}
                      </span>
                    </div>
                    {notice.externalUrl && (
                      <a 
                        href={notice.externalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-3 py-1.5 bg-slate-900 text-white rounded font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        VIEW DETAILS <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}          {/* Events Tab Content */}
      {activeTab === 'events' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">MY EVENTS</h2>
              <p className="text-slate-500 text-[11px] mt-0.5 uppercase font-bold tracking-wider">Upcoming rallies, meetings, and community engagements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {events.length === 0 ? (
              <div className="lg:col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <Calendar size={24} />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1 uppercase tracking-widest">NO UPCOMING EVENTS</h3>
                <p className="text-slate-500 text-[11px] uppercase font-bold tracking-tight">You're all caught up! Check back later for new events.</p>
              </div>
            ) : (
              events?.map((event, i) => (
                <motion.div 
                  key={event.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col border-l-4 border-l-slate-300 hover:border-l-blue-500"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-md flex flex-col items-center justify-center text-center shrink-0 group-hover:scale-105 transition-transform border border-blue-100">
                        <span className="text-[9px] font-black uppercase leading-none">{safeFormat(event.eventDate, 'MMM')}</span>
                        <span className="text-xs font-black leading-none mt-0.5">{safeFormat(event.eventDate, 'd')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">EVENT DATE</span>
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{safeFormat(event.eventDate, 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                      event.audience === 'MEMBERS' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {event.audience}
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1 leading-tight uppercase tracking-tight">{event.title}</h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed mb-4 line-clamp-2 flex-grow font-medium">{event.summary || event.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {event.startAt} {event.endAt ? `- ${event.endAt}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin size={12} />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                        {event.location}
                      </span>
                    </div>
                    {event.attachmentUrl && (
                      <a 
                        href={event.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="ml-auto px-3 py-1.5 bg-slate-900 text-white rounded font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        VIEW DETAILS <ExternalLink size={12} />
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
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">MY TRAINING</h2>
              <p className="text-slate-500 text-xs mt-0.5 uppercase font-bold tracking-wider">Access official party training materials and educational resources</p>
            </div>
          </div>

          {!selectedProgram && !selectedCourse && (
            <>
              <div className="flex flex-col md:flex-row gap-2.5 mb-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type="text"
                    placeholder="Search programs or resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white text-xs font-medium"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {['All', ...new Set(programs?.map(p => p.category) || [])].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                        filterCategory === cat 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(programs || []).filter(p => {
                  const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                       p.description?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
                  return matchesSearch && matchesCategory;
                }).map((program) => (
                  <div key={program.id} className={`bg-white rounded-xl border ${program.isPinned ? 'border-emerald-200 shadow-sm' : 'border-slate-200'} p-4 shadow-sm hover:shadow-md transition-all group flex flex-col border-l-4 border-l-slate-300 hover:border-l-emerald-500`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
                        <BookOpen size={16} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {program.isPinned && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-black uppercase tracking-widest border border-emerald-100">
                            <Pin size={8} className="fill-emerald-700" /> PINNED
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-black uppercase tracking-widest border border-blue-100">
                          <Users size={8} className="text-blue-700" /> {program.audience}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-black text-slate-900 mb-1.5 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight uppercase tracking-tight">{program.name}</h3>
                    <p className="text-slate-500 text-[11px] mb-4 line-clamp-3 flex-grow leading-relaxed font-medium">{program.description}</p>
                    
                    <div className="space-y-2.5 pt-3 border-t border-slate-100 mt-auto">
                      <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {safeFormat(program.createdAt, 'MMM d, yyyy')}</span>
                        <span className="px-2 py-0.5 bg-slate-50 rounded text-slate-500 border border-slate-100">{program.category}</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {program.courses && program.courses.length > 0 && (
                          <button 
                            onClick={() => setSelectedProgram(program)}
                            className="flex items-center justify-between p-2.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all group/link border border-emerald-100"
                          >
                            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Layers size={14} /> VIEW {program.courses.length} COURSES</span>
                            <ChevronRight size={14} className="opacity-0 group-hover/link:opacity-100 transition-all" />
                          </button>
                        )}
                        {program.externalUrl && (
                          <a 
                            href={program.externalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all group/link border border-slate-200"
                          >
                            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><ExternalLink size={14} /> OPEN RESOURCE</span>
                            <ChevronRight size={14} className="opacity-0 group-hover/link:opacity-100 transition-all" />
                          </a>
                        )}
                        {program.attachmentUrl && (
                          <a 
                            href={program.attachmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all group/link border border-slate-200"
                          >
                            <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Paperclip size={14} /> DOWNLOAD MATERIAL</span>
                            <ChevronRight size={14} className="opacity-0 group-hover/link:opacity-100 transition-all" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {programs.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                      <GraduationCap size={24} />
                    </div>
                    <h3 className="text-[11px] font-black text-slate-900 mb-1 uppercase tracking-widest">NO TRAINING PROGRAMS AVAILABLE</h3>
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-tight">We are currently developing new training materials. Please check back soon.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {selectedProgram && !selectedCourse && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative z-10">
                  <h2 className="text-base font-black text-slate-900 mb-1.5 uppercase tracking-tight">{selectedProgram.name}</h2>
                  <p className="text-slate-600 text-xs leading-relaxed max-w-4xl font-medium">{selectedProgram.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedProgram.courses?.map((course) => (
                  <div key={course.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all group flex flex-col border-l-4 border-l-slate-300 hover:border-l-blue-500">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-100">
                        <Layers size={16} />
                      </div>
                      <span className="px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest border border-slate-100">
                        {course.level}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors leading-tight uppercase tracking-tight">{course.title}</h3>
                    <p className="text-slate-500 text-[11px] mb-4 line-clamp-2 leading-relaxed flex-grow font-medium">{course.description}</p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {course.lessons?.length || 0} LESSONS
                      </span>
                      <button 
                        onClick={() => setSelectedCourse(course)}
                        className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1.5 group-hover:translate-x-1 transition-all"
                      >
                        START COURSE <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCourse && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">
                      {selectedCourse.level}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedCourse.lessons?.length || 0} LESSONS
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mb-1.5 uppercase tracking-tight">{selectedCourse.title}</h2>
                  <p className="text-slate-600 text-xs leading-relaxed max-w-4xl font-medium">{selectedCourse.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedCourse.lessons?.map((lesson) => (
                  <div key={lesson.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row gap-5 hover:border-blue-200 transition-colors border-l-4 border-l-slate-200 hover:border-l-blue-500">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-base border border-blue-100">
                      {lesson.order}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-tight">{lesson.title}</h3>
                      <div className="prose prose-sm prose-slate max-w-none mb-4 text-slate-600 leading-relaxed text-xs font-medium">
                        {lesson.content}
                      </div>
                      {lesson.videoUrl && (
                        <a 
                          href={lesson.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-900 text-white rounded font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-sm"
                        >
                          <PlayCircle size={14} className="text-blue-400" /> WATCH VIDEO LESSON
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
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">SURVEYS & POLLS</h2>
              <p className="text-slate-500 text-xs mt-0.5 uppercase font-bold tracking-wider">Community feedback and decision making hub</p>
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setSurveyTab('surveys')}
                className={`px-3 py-1 rounded font-black text-xs uppercase tracking-widest transition-all ${surveyTab === 'surveys' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
              >
                SURVEYS
              </button>
              <button 
                onClick={() => setSurveyTab('polls')}
                className={`px-3 py-1 rounded font-black text-xs uppercase tracking-widest transition-all ${surveyTab === 'polls' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
              >
                POLLS
              </button>
            </div>
          </div>

          {surveyTab === 'surveys' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {surveys?.map((survey) => (
                <div key={survey.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all group flex flex-col border-l-4 border-l-slate-300 hover:border-l-emerald-500">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
                      <ClipboardList size={16} />
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[11px] font-black uppercase tracking-widest border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  
                  <h3 className="text-sm font-black text-slate-900 mb-1.5 group-hover:text-emerald-600 transition-colors line-clamp-1 leading-tight uppercase tracking-tight">{survey.title}</h3>
                  <p className="text-slate-500 text-[11px] mb-4 line-clamp-2 leading-relaxed flex-grow font-medium">{survey.description}</p>
                  
                  <div className="space-y-2.5 pt-3 border-t border-slate-100 mt-auto">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Calendar size={12} /> {safeFormat(survey.createdAt, 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1.5"><Users size={12} /> {survey._count?.responses || 0} RESPONSES</span>
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
                      className="w-full py-2 bg-slate-900 text-white rounded font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      TAKE SURVEY <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {surveys.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                    <ClipboardList size={24} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1 uppercase tracking-widest">NO ACTIVE SURVEYS</h3>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-tight">There are no surveys requiring your feedback at this time.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {polls?.map((poll) => (
                <div key={poll.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4 border-l-4 border-l-slate-300 hover:border-l-blue-500 transition-all">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight max-w-[80%]">{poll.question}</h3>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[11px] font-black uppercase tracking-widest border border-blue-200">
                        ACTIVE
                      </span>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{poll._count?.votes || 0} VOTES</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {(poll.options || []).map((opt) => {
                      const percentage = (poll._count?.votes || 0) > 0 ? ((opt._count?.votes || 0) / poll._count.votes) * 100 : 0;
                      return (
                        <div key={opt.id} className="space-y-1.5">
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
                            className="w-full flex justify-between items-center p-2.5 rounded bg-slate-50 hover:bg-white transition-all group border border-slate-100 hover:border-slate-300 hover:shadow-sm"
                          >
                            <span className="font-black text-[11px] text-slate-700 group-hover:text-slate-900 uppercase tracking-tight">{opt.text}</span>
                            <span className="text-sm font-black text-slate-500">{Math.round(percentage)}%</span>
                          </button>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
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
                  <div className="flex justify-between items-center pt-3 text-[11px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      LIVE RESULTS
                    </div>
                    <button className="text-slate-400 hover:text-slate-900 transition-colors">
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {polls.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                    <Vote size={24} />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 mb-1 uppercase tracking-widest">NO ACTIVE POLLS</h3>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-tight">There are no active polls at the moment. Check back later!</p>
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
            className="bg-white rounded-xl p-4 md:p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl relative border border-slate-200"
          >
            <button 
              onClick={() => setShowTakeSurvey(false)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
            >
              <X size={16} />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">{currentSurvey.title}</h2>
              <p className="text-slate-500 text-xs font-medium leading-relaxed mt-0.5">{currentSurvey.description}</p>
            </div>
            
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
            }} className="space-y-4">
              {(currentSurvey.questions || []).map((q: any, index: number) => (
                <div key={q.id} className="space-y-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <label className="block text-[11px] font-black text-slate-900 uppercase tracking-tight">
                    {index + 1}. {q.text}
                  </label>
                  
                  {q.type === 'TEXT' && (
                    <textarea 
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                      className="w-full p-2 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none h-16 resize-none text-[11px] font-medium"
                      placeholder="Type your response here..."
                      required
                    />
                  )}

                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="grid grid-cols-1 gap-1">
                      {(q.options || []).map((opt: string, oIndex: number) => (
                        <label key={oIndex} className={`flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-pointer transition-all ${answers[q.id] === opt ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-slate-200 hover:bg-white hover:border-slate-300'}`}>
                          <input 
                            type="radio"
                            name={`question-${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                            className="w-3 h-3 text-emerald-600 focus:ring-emerald-500"
                            required
                          />
                          <span className="font-bold text-[11px]">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'RATING' && (
                    <div className="flex justify-between gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="flex flex-col items-center gap-1 cursor-pointer flex-1">
                          <input 
                            type="radio"
                            name={`question-${q.id}`}
                            value={rating}
                            checked={answers[q.id] === rating.toString()}
                            onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                            className="sr-only"
                            required
                          />
                          <div className={`w-full aspect-square rounded-md flex items-center justify-center text-[11px] font-black transition-all ${answers[q.id] === rating.toString() ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>
                            {rating}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowTakeSurvey(false)}
                  className="px-3 py-1.5 rounded-md font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-md font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm"
                >
                  {submitting ? 'SUBMITTING...' : 'SUBMIT RESPONSE'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Help & Grievances Tab Content */}
      {activeTab === 'grievances' && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">GRIEVANCE CENTER</h2>
              <p className="text-slate-500 text-xs mt-0.5 uppercase font-bold tracking-wider">Report issues, seek assistance, or provide feedback</p>
            </div>
            <button 
              onClick={() => setShowNewGrievanceModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <PlusCircle size={14} />
              SUBMIT NEW GRIEVANCE
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-1 space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-900 mb-3 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" /> RESOLUTION STATS
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">TOTAL</span>
                    <span className="text-xl font-black text-slate-900 leading-none">{grievances.length}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">RESOLVED</span>
                    <span className="text-xl font-black text-emerald-700 leading-none">
                      {grievances.filter(g => g.status === 'RESOLVED').length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-900 text-white rounded-xl p-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-all" />
                <div className="relative z-10">
                  <h3 className="text-[11px] font-black uppercase tracking-widest mb-2">NEED URGENT HELP?</h3>
                  <p className="text-emerald-100 text-xs leading-relaxed mb-3 font-medium">Our dedicated support team is available 24/7 for critical party matters.</p>
                  <button className="w-full py-2 bg-white text-emerald-900 rounded font-black text-[11px] uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-sm">
                    CONTACT SUPPORT
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 ml-1">
                <History size={14} className="text-emerald-600" /> SUBMISSION HISTORY
              </h3>

              {grievances.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 mb-1 uppercase tracking-widest">NO GRIEVANCES FOUND</h3>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-tight">You haven't submitted any grievances or help requests yet.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {(grievances || [])?.map((g) => (
                    <motion.div 
                      key={g.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedGrievance(g)}
                      className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group border-l-4 border-l-slate-300 hover:border-l-emerald-500"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <GrievanceStatusBadge status={g.status} />
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            {g.category.name}
                          </span>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={12} />
                          {safeFormat(g.createdAt, 'MMM d, yyyy')}
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors leading-tight uppercase tracking-tight">{g.title}</h4>
                      <p className="text-slate-500 text-[11px] line-clamp-1 leading-relaxed font-medium">{g.description}</p>
                      
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <MessageCircle size={12} />
                          {g.responses?.length || 0} RESPONSES
                        </div>
                        <div className="text-emerald-600 font-black text-[11px] uppercase tracking-widest flex items-center gap-1.5 group-hover:translate-x-1 transition-all">
                          VIEW DETAILS <ChevronRight size={12} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* New Grievance Modal */}
      {showNewGrievanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl relative border border-slate-200"
          >
            <button 
              onClick={() => setShowNewGrievanceModal(false)}
              className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
            >
              <X size={16} />
            </button>

            <div className="mb-4">
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">SUBMIT GRIEVANCE</h2>
              <p className="text-slate-500 text-[11px] font-medium leading-relaxed mt-0.5">Provide detailed information about your concern. We will review it promptly.</p>
            </div>
            
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
            }} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ISSUE TITLE</label>
                <input 
                  required
                  type="text" 
                  value={newGrievance.title}
                  onChange={e => setNewGrievance({...newGrievance, title: e.target.value})}
                  placeholder="Brief summary of the issue"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CATEGORY</label>
                  <select 
                    required
                    value={newGrievance.categoryId}
                    onChange={e => setNewGrievance({...newGrievance, categoryId: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none appearance-none text-xs font-medium"
                  >
                    <option value="">Select Category</option>
                    {(grievanceCategories || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PRIORITY LEVEL</label>
                  <select 
                    required
                    value={newGrievance.priority}
                    onChange={e => setNewGrievance({...newGrievance, priority: e.target.value})}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none appearance-none text-xs font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">DETAILED DESCRIPTION</label>
                <textarea 
                  required
                  rows={4}
                  value={newGrievance.description}
                  onChange={e => setNewGrievance({...newGrievance, description: e.target.value})}
                  placeholder="Provide detailed information..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none resize-none text-xs font-medium"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowNewGrievanceModal(false)}
                  className="px-3 py-1.5 rounded-md font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-md font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm"
                >
                  {submitting ? 'SUBMITTING...' : 'SUBMIT GRIEVANCE'}
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
            className="bg-white rounded-xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
          >
            <div className="p-3.5 border-b border-slate-200 flex justify-between items-start bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <GrievanceStatusBadge status={selectedGrievance.status} />
                  <GrievancePriorityBadge priority={selectedGrievance.priority} />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                    {selectedGrievance.category?.name || 'General'}
                  </span>
                </div>
                <h2 className="text-[14px] font-black text-slate-900 leading-tight uppercase tracking-tight">{selectedGrievance.title}</h2>
                <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <Calendar size={9} />
                  SUBMITTED ON {safeFormat(selectedGrievance.createdAt, 'MMM d, yyyy')}
                </div>
              </div>
              <button 
                onClick={() => setSelectedGrievance(null)}
                className="p-1 text-slate-400 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-slate-700 whitespace-pre-wrap text-xs leading-relaxed font-medium">{selectedGrievance.description}</p>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-[10px] font-black text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5 uppercase tracking-widest">
                  <MessageCircle size={12} className="text-emerald-600" />
                  UPDATES & RESPONSES
                </h3>
                
                {(!selectedGrievance.responses || (selectedGrievance.responses || []).filter(r => !r.isInternal).length === 0) ? (
                  <div className="text-center py-6 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                    No public responses yet. Our team is reviewing your concern.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(selectedGrievance.responses || []).filter(r => !r.isInternal).map(response => (
                      <div key={response.id} className={`p-2.5 rounded-lg border ${response.userId === user?.id ? 'bg-emerald-50 border-emerald-100 ml-6' : 'bg-slate-50 border-slate-100 mr-6'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-200">
                              <User size={8} />
                            </div>
                            <span className="text-[10px] font-black text-slate-900 uppercase">{response.user?.displayName || 'Team Member'}</span>
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{safeFormat(response.createdAt, 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed font-medium">{response.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 border-t border-slate-200 bg-slate-50">
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
              }} className="space-y-2">
                <textarea 
                  required
                  value={grievanceResponse}
                  onChange={e => setGrievanceResponse(e.target.value)}
                  placeholder="Add a comment or provide more details..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none resize-none shadow-sm text-[11px] font-medium h-16"
                />
                <div className="flex justify-end">
                  <button 
                    type="submit"
                    disabled={submitting || !grievanceResponse.trim()}
                    className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {submitting ? 'SENDING...' : 'SEND RESPONSE'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Membership Tab */}
      {activeTab === 'membership' && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">MY MEMBERSHIP</h2>
              <p className="text-slate-500 text-xs mt-0.5 uppercase font-bold tracking-wider">Manage your official party membership and access exclusive benefits</p>
            </div>
          </div>

          {user.role === 'MEMBER' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                  <h3 className="text-[11px] font-black text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-widest">
                    <Award size={14} className="text-emerald-500" />
                    YOUR MEMBERSHIP
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">STATUS</p>
                      <p className="text-[13px] font-black text-emerald-900 uppercase">ACTIVE MEMBER</p>
                    </div>
                    <div className="space-y-2 px-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MEMBER ID</span>
                        <span className="font-mono font-black text-slate-800 text-[11px]">{profile?.membershipId || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PROVINCE</span>
                        <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{profile?.province || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DISTRICT</span>
                        <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{profile?.district || '---'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <button 
                        onClick={() => setShowIdCard(true)}
                        className="w-full py-2 bg-slate-900 text-white rounded font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <IdCard size={14} />
                        VIEW DIGITAL ID
                      </button>
                      <button 
                        onClick={() => setIsRenewing(true)}
                        className="w-full py-2 bg-emerald-600 text-white rounded font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <Clock size={14} />
                        RENEW MEMBERSHIP
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-[11px] font-black text-slate-900 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-500" /> MEMBERSHIP BENEFITS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { title: 'Voting Rights', desc: 'Participate in internal party elections and policy decisions.', icon: Vote },
                      { title: 'Exclusive Training', desc: 'Access advanced political and leadership training programs.', icon: GraduationCap },
                      { title: 'Event Access', desc: 'Priority registration for party conventions and rallies.', icon: Calendar },
                      { title: 'Direct Feedback', desc: 'Direct channel to provide feedback to party leadership.', icon: MessageSquareText }
                    ].map((benefit, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-white hover:border-slate-300 transition-all group">
                        <div className="flex items-center gap-2 mb-1.5">
                          <benefit.icon size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          <h4 className="font-black text-slate-900 text-[12px] uppercase tracking-tight">{benefit.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{benefit.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {renewals.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <h3 className="text-[11px] font-black text-slate-900 mb-3 uppercase tracking-widest flex items-center gap-2">
                      <History size={14} className="text-amber-500" /> RENEWAL HISTORY
                    </h3>
                    <div className="space-y-2">
                      {renewals.map((renewal, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                              {new Date(renewal.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {renewal.paymentMethod || 'MANUAL'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              renewal.status === 'COMPLETED' || renewal.status === 'APPROVED' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                              renewal.status === 'PENDING' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                              'text-rose-600 bg-rose-50 border-rose-100'
                            }`}>
                              {renewal.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : user.role === 'APPLICANT_MEMBER' ? (
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm max-w-md mx-auto border-t-4 border-t-amber-500">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <Clock size={24} />
                </div>
                <h3 className="text-[15px] font-black text-slate-900 mb-1.5 uppercase tracking-tight">APPLICATION UNDER REVIEW</h3>
                <p className="text-slate-500 text-[11px] leading-relaxed font-medium uppercase tracking-tight">Your membership application is currently being processed by our verification team. We will notify you once your status is updated.</p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2.5">
                  <span className="text-slate-500">VERIFICATION PROGRESS</span>
                  <span className="text-amber-600">{getProgress()}%</span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgress()}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.3)]" 
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-1.5 mt-4">
                  <div className={`text-[8px] font-black text-center py-1 rounded-md tracking-tighter ${profile?.status === 'PENDING' || profile?.status === 'VERIFIED' || profile?.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}>
                    SUBMITTED
                  </div>
                  <div className={`text-[8px] font-black text-center py-1 rounded-md tracking-tighter ${profile?.status === 'VERIFIED' || profile?.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}>
                    VERIFIED
                  </div>
                  <div className={`text-[8px] font-black text-center py-1 rounded-md tracking-tighter ${profile?.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50 border border-emerald-100' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}>
                    APPROVED
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tracking Code</span>
                  <span className="text-[11px] font-mono font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{profile?.trackingCode}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</span>
                  <span className="text-[11px] font-black text-slate-900">{profile?.paymentMethod || 'NOT SELECTED'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Status</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${profile?.transactions?.[0]?.status === 'COMPLETED' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                    {(profile?.transactions?.[0]?.status || 'PENDING').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                  If you have already paid via a manual method, please ensure you have uploaded the receipt or contacted your local unit coordinator for verification.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center max-w-md mx-auto border-t-4 border-t-emerald-500">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
                <Award size={28} />
              </div>
              <h3 className="text-[17px] font-black text-slate-900 mb-2 uppercase tracking-tight">JOIN THE MOVEMENT</h3>
              <p className="text-slate-500 text-[12px] mb-8 leading-relaxed font-medium uppercase tracking-tight">Become a formal member of the party to unlock voting rights, exclusive training, and direct participation in our mission.</p>
              <button 
                onClick={() => setCurrentView('membership-public')}
                className="px-8 py-3 bg-slate-900 text-white rounded-lg font-black text-[12px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md flex items-center justify-center gap-2 mx-auto"
              >
                APPLY FOR MEMBERSHIP <ArrowRight size={14} />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Volunteer Tab Content */}
      {activeTab === 'volunteer' && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">VOLUNTEER HUB</h2>
              <p className="text-slate-500 text-xs mt-0.5 uppercase font-bold tracking-wider">Manage your volunteer activities and track your impact</p>
            </div>
          </div>

          {volunteer ? (
            (volunteer.status === 'APPROVED' || volunteer.status === 'ACTIVE') ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
                    <h3 className="text-[11px] font-black text-slate-900 mb-3 flex items-center gap-2 uppercase tracking-widest">
                      <Heart size={14} className="text-rose-500" />
                      VOLUNTEER STATUS
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">STATUS</p>
                        <p className="text-[13px] font-black text-rose-900 uppercase">ACTIVE VOLUNTEER</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">HOURS</p>
                          <p className="text-lg font-black text-slate-900 leading-none">{volunteer.totalHours || 0}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PROJECTS</p>
                          <p className="text-lg font-black text-slate-900 leading-none">{volunteer.projectsCount || 0}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setCurrentView('volunteer-enrollment')}
                        className="w-full py-2 bg-slate-900 text-white rounded font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <ShieldCheck size={14} />
                        UPDATE PROFILE
                      </button>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm h-full">
                    <h3 className="text-[11px] font-black text-slate-900 mb-3 uppercase tracking-widest flex items-center gap-2">
                      <History size={14} className="text-slate-400" /> ACTIVE ASSIGNMENTS
                    </h3>
                    <div className="space-y-2">
                      {volunteer.assignments?.length > 0 ? (
                        volunteer?.assignments?.map((as: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center group hover:bg-white hover:border-slate-300 hover:shadow-md transition-all">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-slate-900 text-[12px] uppercase tracking-tight">{as.taskName}</h4>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                  as.status === 'COMPLETED' 
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                                }`}>
                                  {as.status === 'COMPLETED' ? 'COMPLETED' : 'IN PROGRESS'}
                                </span>
                              </div>
                              {as.campaign && (
                                <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mt-0.5">
                                  Campaign: {as.campaign.title || as.campaign.name}
                                </p>
                              )}
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{as.description || 'No description provided'}</p>
                            </div>
                            {as.status !== 'COMPLETED' && (
                              <button 
                                onClick={() => {
                                  setReportingAssignment(as);
                                  setIsReporting(true);
                                }}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-900 rounded font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                              >
                                REPORT ACTIVITY
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <Heart size={24} className="mx-auto text-slate-300 mb-2 opacity-50" />
                          <p className="text-slate-500 font-black text-xs uppercase tracking-widest">No active assignments found</p>
                          <button 
                            onClick={() => setCurrentView('volunteer-enrollment')}
                            className="mt-3 text-[11px] font-black text-emerald-600 hover:text-emerald-700 underline uppercase tracking-widest"
                          >
                            BROWSE OPPORTUNITIES
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {volunteer.recognitions && volunteer.recognitions.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm border-t-4 border-t-amber-400">
                      <h3 className="text-[11px] font-black text-slate-900 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <Award size={14} className="text-amber-500" /> AWARDS & RECOGNITION
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {volunteer.recognitions.map((r: any, i: number) => (
                          <div key={i} className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Award size={12} className="text-amber-600" />
                              <span className="text-[11px] font-black text-slate-900 uppercase">{r.title}</span>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-tight">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : volunteer.status === 'PENDING' ? (
              <div className="bg-white rounded-xl p-10 border border-slate-200 shadow-sm text-center max-w-md mx-auto border-t-4 border-t-blue-500">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                  <Clock size={24} />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1.5 uppercase tracking-tight">APPLICATION PENDING</h3>
                <p className="text-slate-500 text-xs mb-0 leading-relaxed font-medium uppercase tracking-tight">Thank you for your interest! Our team is reviewing your application and will reach out shortly via email or phone.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-10 border border-slate-200 shadow-sm text-center max-w-md mx-auto border-t-4 border-t-slate-500">
                <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-xs font-black text-slate-900 mb-1.5 uppercase tracking-tight">VOLUNTEER STATUS: {volunteer.status}</h3>
                <p className="text-slate-500 text-xs mb-6 leading-relaxed font-medium uppercase tracking-tight">Your volunteer status is currently {volunteer.status.toLowerCase()}. If you believe this is an error or would like to reactivate, please contact us.</p>
                <button 
                  onClick={() => setCurrentView('volunteer-enrollment')}
                  className="px-6 py-2 bg-slate-900 text-white rounded font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md"
                >
                  RE-APPLY TO VOLUNTEER
                </button>
              </div>
            )
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm text-center max-w-md mx-auto border-t-4 border-t-rose-500">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-100">
                <Heart size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">VOLUNTEER FOR CHANGE</h3>
              <p className="text-slate-500 text-xs mb-8 leading-relaxed font-medium uppercase tracking-tight">Join our team of dedicated volunteers and make a real impact on the ground. Your skills and time can help us build a better future.</p>
              <button 
                onClick={() => setCurrentView('volunteer-enrollment')}
                className="px-8 py-3 bg-slate-900 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md flex items-center justify-center gap-2 mx-auto"
              >
                APPLY TO VOLUNTEER <ArrowRight size={14} />
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Report Activity Modal */}
      {isReporting && reportingAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
          >
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">REPORT ACTIVITY</h2>
                <p className="text-slate-500 mt-0.5 text-[9px] font-bold uppercase tracking-wider">{reportingAssignment.taskName}</p>
              </div>
              <button 
                onClick={() => setIsReporting(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleReportSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">HOURS SPENT</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    required
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="E.G. 2.5"
                    value={reportData.hoursSpent}
                    onChange={e => setReportData({...reportData, hoursSpent: e.target.value})}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-[12px] font-black uppercase tracking-tight"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ACTIVITY DESCRIPTION</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="DESCRIBE WHAT YOU ACCOMPLISHED DURING THIS SESSION..."
                  value={reportData.content}
                  onChange={e => setReportData({...reportData, content: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none text-[12px] font-black uppercase tracking-tight leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsReporting(false)}
                  className="flex-1 px-4 py-3 text-slate-500 font-black hover:bg-slate-100 rounded-xl transition-colors text-[10px] uppercase tracking-widest border border-transparent hover:border-slate-200"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  disabled={submittingReport}
                  className="flex-[2] bg-slate-900 text-white py-3 rounded-xl font-black hover:bg-rose-600 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                >
                  {submittingReport ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                  SUBMIT REPORT
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Donations Tab Content */}
      {activeTab === 'donations' && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">DONATIONS & IMPACT</h2>
              <p className="text-slate-500 text-xs mt-0.5 uppercase font-bold tracking-wider">Track your contributions and support active campaigns</p>
            </div>
          </div>

          {/* Donation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-rose-600 rounded-xl p-4 text-white shadow-md border border-rose-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/20 transition-all" />
              <p className="text-[11px] font-black text-rose-200 uppercase tracking-widest mb-1 relative z-10">TOTAL CONTRIBUTIONS</p>
              <p className="text-2xl font-black tracking-tight relative z-10">NPR {(donorProfile?.totalDonated || donations.reduce((acc, d) => acc + d.amount, 0)).toLocaleString()}</p>
              <div className="mt-2 flex items-center gap-2 text-rose-100 text-xs font-black uppercase tracking-widest relative z-10">
                <Heart size={14} />
                <span>{donations.length} TRANSACTIONS</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">DONOR LEVEL</p>
              <p className="text-xl font-black text-slate-900 tracking-tight uppercase">{donorProfile?.donorLevel || 'SUPPORTER'}</p>
              <p className="mt-1 text-slate-500 text-xs font-black uppercase tracking-widest">Your support fuels our movement</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">QUICK ACTION</p>
                <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">SUPPORT A CAMPAIGN</p>
              </div>
              <button 
                onClick={() => setCurrentView('donate')}
                className="mt-3 w-full py-2 bg-slate-900 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                DONATE NOW <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Donation History */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Activity size={16} className="text-rose-500" />
                CONTRIBUTION HISTORY
              </h3>
              <div className="space-y-2">
                {donations.length > 0 ? (
                  donations?.map((donation, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center hover:bg-white hover:shadow-md transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-rose-100">
                          <Heart size={16} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">{donation.campaign?.title || 'GENERAL DONATION'}</h4>
                          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            {safeFormat(donation.transaction?.date || donation.createdAt || new Date(), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 text-xs uppercase tracking-tight">NPR {(Number(donation.transaction?.amount || donation.amount) || 0).toLocaleString()}</p>
                        <p className={`text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded inline-block mt-1 border ${
                          donation.transaction?.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {donation.transaction?.status || 'PENDING'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Heart size={24} className="mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="text-slate-500 font-black text-xs uppercase tracking-widest">No contributions recorded yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Campaigns */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <h3 className="text-[11px] font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Megaphone size={16} className="text-emerald-500" />
                ACTIVE CAMPAIGNS
              </h3>
              <div className="space-y-3">
                {activeCampaigns.length > 0 ? (
                  activeCampaigns?.slice(0, 3).map((campaign, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3 group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">{campaign.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-1 leading-relaxed font-medium uppercase tracking-tight">{campaign.description}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-black rounded uppercase tracking-widest border border-emerald-100 shrink-0 ml-2">
                          {(campaign.fundraiserType || '').replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                          <span className="text-slate-400">FUNDING PROGRESS</span>
                          <span className="text-emerald-600">{Math.round((Number(campaign.currentAmount || 0) / Number(campaign.goalAmount || 1)) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (Number(campaign.currentAmount || 0) / Number(campaign.goalAmount || 1)) * 100)}%` }}
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                          <span className="text-slate-900">NPR {(Number(campaign.currentAmount) || 0).toLocaleString()}</span>
                          <span className="text-slate-400">GOAL: NPR {(Number(campaign.goalAmount) || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setCurrentView('donate')}
                        className="w-full py-2 bg-emerald-600 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        SUPPORT CAMPAIGN <ArrowRight size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Megaphone size={24} className="mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="text-slate-500 font-black text-xs uppercase tracking-widest">No active campaigns at this time</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'profile' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">USER PROFILE & SETTINGS</h2>
              <p className="text-slate-500 text-xs mt-0.5 uppercase font-bold tracking-wider">Manage your personal information and account security</p>
            </div>
          </div>

          {isEditingProfile && (user.role === 'MEMBER' || user.role === 'APPLICANT_MEMBER') ? (
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">EDIT PROFILE DETAILS</h2>
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded font-black hover:bg-slate-200 transition-all text-[11px] uppercase tracking-widest border border-slate-200"
                >
                  CANCEL
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Profile Summary Card */}
              <div className="lg:col-span-1 space-y-3">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
                  <div className="relative inline-block mb-3.5">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-50 bg-slate-100 shadow-inner mx-auto">
                      <img 
                        src={profile?.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 text-white rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={12} />
                    </div>
                  </div>
                  <h2 className="text-[15px] font-black text-slate-900 uppercase tracking-tight">{user.displayName}</h2>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs mt-0.5">{user.role.replace('_', ' ')}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-black uppercase tracking-widest text-xs">VERIFICATION</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-widest border ${
                          user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {user.isActive ? 'VERIFIED' : 'UNVERIFIED'}
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
                            className="text-xs font-black text-emerald-600 hover:text-emerald-700 underline uppercase tracking-widest"
                          >
                            VERIFY NOW
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-black uppercase tracking-widest text-xs">MEMBER SINCE</span>
                      <span className="text-slate-900 font-black text-xs uppercase tracking-tight">{safeFormat(user.createdAt, 'MMM yyyy')}</span>
                    </div>
                  </div>

                  {(user.role === 'MEMBER' || user.role === 'APPLICANT_MEMBER') && (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full mt-4 py-2 bg-slate-900 text-white rounded font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Settings size={14} />
                      EDIT PROFILE DETAILS
                    </button>
                  )}
                </div>

                {/* Identity Context */}
                <div className="bg-slate-900 rounded-xl p-4 text-white shadow-md border border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3">LINKED IDENTITY</h3>
                  <div className="space-y-3">
                    {user.role === 'MEMBER' && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-md flex items-center justify-center border border-emerald-500/30">
                          <Shield size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">MEMBERSHIP</p>
                          <p className="font-black text-white text-[12px] uppercase tracking-tight">ACTIVE PARTY MEMBER</p>
                        </div>
                      </div>
                    )}
                    {volunteer && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-md flex items-center justify-center border border-blue-500/30">
                          <Heart size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">VOLUNTEER</p>
                          <p className="font-black text-white text-[12px] uppercase tracking-tight">{(volunteer.status === 'APPROVED' || volunteer.status === 'ACTIVE') ? 'ACTIVE VOLUNTEER' : 'VOLUNTEER APPLICANT'}</p>
                        </div>
                      </div>
                    )}
                    {!volunteer && user.role === 'PUBLIC' && (
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-xs text-slate-300 leading-relaxed font-medium uppercase tracking-tight">
                          You are currently a <span className="text-white font-black">REGISTERED USER</span>. Join as a member or volunteer to unlock more features.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details & Settings */}
              <div className="lg:col-span-2 space-y-3">
                {/* Personal Information */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-900 mb-3.5 flex items-center gap-1.5 uppercase tracking-widest">
                    <User size={14} className="text-emerald-500" />
                    PERSONAL INFORMATION
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">FULL NAME</p>
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{user.displayName}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">EMAIL ADDRESS</p>
                      <p className="text-[12px] font-black text-slate-900">{user.email}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">PHONE NUMBER</p>
                      <p className="text-[12px] font-black text-slate-900">{user.phoneNumber || 'NOT PROVIDED'}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ACCOUNT TYPE</p>
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Member Specific Details */}
                {profile && (
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-black text-slate-900 mb-3.5 flex items-center gap-1.5 uppercase tracking-widest">
                      <Award size={14} className="text-blue-500" />
                      MEMBERSHIP DETAILS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">MEMBERSHIP ID</p>
                        <p className="text-[12px] font-mono font-black text-slate-900 uppercase tracking-tight">{profile.membershipId || 'PENDING'}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">PROVINCE</p>
                        <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{profile.province || 'NOT SPECIFIED'}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">DISTRICT</p>
                        <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{profile.district || 'NOT SPECIFIED'}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">LOCAL LEVEL</p>
                        <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{profile.localLevel || 'NOT SPECIFIED'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Security */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5 uppercase tracking-widest">
                    <Shield size={14} className="text-rose-500" />
                    ACCOUNT SECURITY
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 group hover:bg-white hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-white rounded-md border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-rose-500 transition-colors">
                          <Lock size={14} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">PASSWORD</p>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">LAST CHANGED {safeFormat(user.createdAt, 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      <button className="text-xs font-black text-slate-900 hover:text-emerald-600 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">CHANGE</button>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 group hover:bg-white hover:shadow-sm transition-all">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-white rounded-md border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                          <Smartphone size={14} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">TWO-FACTOR AUTH</p>
                          <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">ENABLED</p>
                        </div>
                      </div>
                      <button className="text-xs font-black text-slate-900 hover:text-emerald-600 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">MANAGE</button>
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Request Renewal</h3>
              <button onClick={() => setIsRenewing(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              Submit a request to renew your membership. An administrator will review your request and extend your membership expiry date.
            </p>

            <form onSubmit={handleRenewalSubmit}>
              <div className="mb-5">
                <PaymentMethodSelector 
                  module="RENEWALS"
                  selectedMethodId={selectedMethod?.id || null}
                  onSelect={setSelectedMethod}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Additional Note (Optional)
                </label>
                <textarea
                  value={renewalNote}
                  onChange={(e) => setRenewalNote(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none h-20 text-sm"
                  placeholder="Any message for the admin..."
                />
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRenewing(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-xs hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedMethod}
                  className="px-6 py-2 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
