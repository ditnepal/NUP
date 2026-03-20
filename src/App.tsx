import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from './lib/api';
import { Login } from './components/Login';
import { 
  Users, 
  LayoutDashboard, 
  Calendar, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  MessageSquare, 
  Map, 
  UserCheck, 
  LogOut, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Menu, 
  X, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  Printer, 
  Globe, 
  Settings, 
  History, 
  Building2, 
  Flag, 
  Trophy, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Eye, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  PieChart, 
  BarChart3, 
  Activity, 
  FileUp, 
  Briefcase, 
  HeartHandshake,
  Upload,
  MapPin
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart as RePieChart, 
  Pie 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { 
  UserProfile, 
  PartyMember, 
  PartyEvent, 
  Transaction, 
  Grievance, 
  AuditLog, 
  Candidate, 
  Committee, 
  UserRole, 
  PartyDocument, 
  CommitteeLevel, 
  TransactionType, 
  TransactionCategory, 
  GrievanceStatus, 
  GrievancePriority, 
  OperationType,
  Supporter,
  Campaign,
  Booth
} from './types';
import { SupportersView } from './components/SupportersView';
import { CampaignsView } from './components/CampaignsView';
import { BoothsView } from './components/BoothsView';

// --- i18n Initialization ---
const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "members": "Members",
      "committees": "Committees",
      "finance": "Finance",
      "events": "Events",
      "grievances": "Grievances",
      "candidates": "Candidates",
      "audit_logs": "Audit Logs",
      "settings": "Settings",
      "logout": "Logout",
      "login_title": "NUP Nepal OS",
      "login_subtitle": "Political Party Management System",
      "login_button": "Sign in with Google",
      "welcome": "Welcome back",
      "total_members": "Total Members",
      "total_funds": "Total Funds",
      "active_events": "Active Events",
      "open_grievances": "Open Grievances",
      "npr": "NPR",
      "add_member": "Add Member",
      "export_csv": "Export CSV",
      "export_pdf": "Export PDF",
      "search": "Search...",
      "status": "Status",
      "actions": "Actions",
      "name": "Name",
      "role": "Role",
      "level": "Level",
      "date": "Date",
      "amount": "Amount",
      "type": "Type",
      "category": "Category",
      "priority": "Priority",
      "subject": "Subject",
      "description": "Description",
      "location": "Location",
      "constituency": "Constituency",
      "election_year": "Election Year",
      "manifesto": "Manifesto",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "view": "View",
      "print_card": "Print Card",
      "verify": "Verify",
      "audit_action": "Action",
      "audit_user": "User",
      "audit_details": "Details",
      "audit_time": "Time",
      "add_committee": "Add Committee",
      "add_event": "Add Event",
      "add_grievance": "Submit Grievance",
      "add_candidate": "Add Candidate",
      "title": "Title",
      "priority_low": "Low",
      "priority_medium": "Medium",
      "priority_high": "High",
      "status_pending": "Pending",
      "status_in_review": "In Review",
      "status_resolved": "Resolved",
      "status_closed": "Closed",
      "documents": "Documents",
      "add_document": "Upload Document",
      "file_name": "File Name",
      "file_size": "Size",
      "uploaded_at": "Uploaded At",
      "uploaded_by": "Uploaded By",
      "category_policy": "Policy",
      "category_legal": "Legal",
      "category_manifesto": "Manifesto",
      "category_finance": "Finance",
      "category_other": "Other",
      "download": "Download"
    }
  },
  ne: {
    translation: {
      "dashboard": "ड्यासबोर्ड",
      "members": "सदस्यहरू",
      "committees": "समितिहरू",
      "finance": "आर्थिक",
      "events": "कार्यक्रमहरू",
      "grievances": "गुनासोहरू",
      "candidates": "उम्मेदवारहरू",
      "audit_logs": "अडिट लगहरू",
      "settings": "सेटिङहरू",
      "logout": "लगआउट",
      "login_title": "NUP नेपाल OS",
      "login_subtitle": "राजनीतिक दल व्यवस्थापन प्रणाली",
      "login_button": "गुगल मार्फत साइन इन गर्नुहोस्",
      "welcome": "स्वागत छ",
      "total_members": "कुल सदस्य",
      "total_funds": "कुल कोष",
      "active_events": "सक्रिय कार्यक्रम",
      "open_grievances": "खुला गुनासो",
      "npr": "नेपाली रुपैयाँ",
      "add_member": "सदस्य थप्नुहोस्",
      "export_csv": "CSV निर्यात",
      "export_pdf": "PDF निर्यात",
      "search": "खोज्नुहोस्...",
      "status": "अवस्था",
      "actions": "कार्यहरू",
      "name": "नाम",
      "role": "भूमिका",
      "level": "तह",
      "date": "मिति",
      "amount": "रकम",
      "type": "प्रकार",
      "category": "वर्ग",
      "priority": "प्राथमिकता",
      "subject": "विषय",
      "description": "विवरण",
      "location": "स्थान",
      "constituency": "निर्वाचन क्षेत्र",
      "election_year": "निर्वाचन वर्ष",
      "manifesto": "घोषणापत्र",
      "save": "बचत गर्नुहोस्",
      "cancel": "रद्द गर्नुहोस्",
      "delete": "हटाउनुहोस्",
      "edit": "सम्पादन गर्नुहोस्",
      "view": "हेर्नुहोस्",
      "print_card": "कार्ड प्रिन्ट गर्नुहोस्",
      "verify": "प्रमाणित गर्नुहोस्",
      "audit_action": "कार्य",
      "audit_user": "प्रयोगकर्ता",
      "audit_details": "विवरण",
      "audit_time": "समय",
      "add_committee": "समिति थप्नुहोस्",
      "add_event": "कार्यक्रम थप्नुहोस्",
      "add_grievance": "गुनासो बुझाउनुहोस्",
      "add_candidate": "उम्मेदवार थप्नुहोस्",
      "title": "शीर्षक",
      "priority_low": "न्यून",
      "priority_medium": "मध्यम",
      "priority_high": "उच्च",
      "status_pending": "बाँकी",
      "status_in_review": "समीक्षामा",
      "status_resolved": "समाधान गरिएको",
      "status_closed": "बन्द",
      "documents": "कागजातहरू",
      "add_document": "कागजात अपलोड गर्नुहोस्",
      "file_name": "फाइलको नाम",
      "file_size": "साइज",
      "uploaded_at": "अपलोड गरिएको समय",
      "uploaded_by": "अपलोड गर्ने",
      "category_policy": "नीति",
      "category_legal": "कानूनी",
      "category_manifesto": "घोषणापत्र",
      "category_finance": "आर्थिक",
      "category_other": "अन्य",
      "download": "डाउनलोड"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

// --- Utility Functions ---
const logAudit = async (action: string, details: string) => {
  try {
    await api.post('/auditlogs', {
      action,
      details,
    });
  } catch (error) {
    console.error("Audit logging failed:", error);
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0
  }).format(amount);
};

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "", 
  disabled = false,
  icon: Icon,
  type = 'button'
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline',
  className?: string,
  disabled?: boolean,
  icon?: any,
  type?: 'button' | 'submit' | 'reset'
}) => {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-200',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    outline: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      type={type}
      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-bottom border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Main Views ---

const CommitteesView = ({ committees }: { committees: Committee[] }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddCommittee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCommittee: Partial<Committee> = {
      name: formData.get('name') as string,
      level: formData.get('level') as CommitteeLevel,
      province: formData.get('province') as string,
      district: formData.get('district') as string,
    };

    try {
      await api.post('/committees', newCommittee);
      logAudit('COMMITTEE_CREATE', `Created committee: ${newCommittee.name}`);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding committee:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{t('committees')}</h2>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>{t('add_committee')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {committees.map((committee) => (
          <Card key={committee.id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{committee.name}</h3>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase mt-2 inline-block">
                  {committee.level}
                </span>
                <p className="text-sm text-slate-500 mt-2">{committee.district || 'Central'}, {committee.province || ''}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                <Building2 size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('add_committee')}>
        <form onSubmit={handleAddCommittee} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Committee Name</label>
            <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Level</label>
            <select name="level" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="central">Central</option>
              <option value="province">Province</option>
              <option value="district">District</option>
              <option value="municipality">Municipality</option>
              <option value="ward">Ward</option>
              <option value="wing">Wing/Cell</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const EventsView = ({ events }: { events: PartyEvent[] }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEvent: Partial<PartyEvent> = {
      title: formData.get('title') as string,
      location: formData.get('location') as string,
      type: formData.get('type') as any,
      date: new Date(formData.get('date') as string).toISOString(),
      description: formData.get('description') as string,
    };

    try {
      await api.post('/events', newEvent);
      logAudit('EVENT_CREATE', `Created event: ${newEvent.title}`);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{t('events')}</h2>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>{t('add_event')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex flex-col items-center justify-center font-bold">
                <span className="text-xs">{event.date?.toDate ? format(event.date.toDate(), 'MMM') : ''}</span>
                <span className="text-lg leading-none">{event.date?.toDate ? format(event.date.toDate(), 'dd') : ''}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{event.title}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <Map size={14} /> {event.location}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                    {event.type}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('add_event')}>
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Event Title</label>
            <input name="title" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Date</label>
              <input name="date" type="datetime-local" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Type</label>
              <select name="type" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <option value="rally">Rally</option>
                <option value="meeting">Meeting</option>
                <option value="fundraiser">Fundraiser</option>
                <option value="press-conference">Press Conference</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Location</label>
            <input name="location" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const GrievancesView = ({ grievances, user }: { grievances: Grievance[], user: any }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddGrievance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newGrievance: Partial<Grievance> = {
      subject: formData.get('subject') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as GrievancePriority,
      status: 'pending',
      submittedBy: user?.displayName || 'Anonymous',
      date: new Date().toISOString(),
    };

    try {
      await api.post('/grievances', newGrievance);
      logAudit('GRIEVANCE_SUBMIT', `Submitted grievance: ${newGrievance.subject}`);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting grievance:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{t('grievances')}</h2>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>{t('add_grievance')}</Button>
      </div>
      <div className="space-y-4">
        {grievances.map((g) => (
          <Card key={g.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    g.priority === 'high' ? 'bg-rose-100 text-rose-700' : 
                    g.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {t(`priority_${g.priority}`)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {g.date?.toDate ? format(g.date.toDate(), 'MMM dd, yyyy') : ''}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{g.subject}</h3>
                <p className="text-slate-600 mt-2 line-clamp-2">{g.description}</p>
                <p className="text-xs text-slate-400 mt-4">Submitted by: {g.submittedBy}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  g.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 
                  g.status === 'pending' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'
                }`}>
                  {t(`status_${g.status}`)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('add_grievance')}>
        <form onSubmit={handleAddGrievance} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Subject</label>
            <input name="subject" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Priority</label>
            <select name="priority" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea name="description" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl h-32" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const CandidatesView = ({ candidates }: { candidates: Candidate[] }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCandidate: Partial<Candidate> = {
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      constituency: formData.get('constituency') as string,
      electionYear: parseInt(formData.get('electionYear') as string),
      status: 'active',
    };

    try {
      await api.post('/candidates', newCandidate);
      logAudit('CANDIDATE_ADD', `Added candidate: ${newCandidate.name}`);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding candidate:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{t('candidates')}</h2>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>{t('add_candidate')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((c) => (
          <Card key={c.id} className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {c.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{c.name}</h3>
                <p className="text-sm text-slate-500">{c.position}</p>
              </div>
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{t('constituency')}</span>
                <span className="font-medium text-slate-800">{c.constituency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{t('election_year')}</span>
                <span className="font-medium text-slate-800">{c.electionYear}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">{t('status')}</span>
                <span className={`font-bold uppercase text-[10px] ${
                  c.status === 'won' ? 'text-emerald-600' : 
                  c.status === 'lost' ? 'text-rose-600' : 'text-blue-600'
                }`}>
                  {c.status}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('add_candidate')}>
        <form onSubmit={handleAddCandidate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Candidate Name</label>
            <input name="name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Position</label>
              <input name="position" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Election Year</label>
              <input name="electionYear" type="number" defaultValue={2084} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Constituency</label>
            <input name="constituency" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const DashboardView = ({ profile, members, transactions, events, grievances, booths, campaigns, supporters }: any) => {
  const { t } = useTranslation();
  
  const totalFunds = transactions.reduce((acc: number, t: Transaction) => 
    t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  const role = profile?.role || 'member';

  const chartData = useMemo(() => {
    return [
      { name: 'Jan', members: 400, funds: 2400 },
      { name: 'Feb', members: 520, funds: 3200 },
      { name: 'Mar', members: 680, funds: 4100 },
      { name: 'Apr', members: 850, funds: 5800 },
      { name: 'May', members: 1100, funds: 7200 },
    ];
  }, []);

  // Role-specific stats
  let stats = [];
  
  if (role === 'admin' || role === 'staff') {
    stats = [
      { label: t('total_members'), value: members.length, icon: Users, color: 'emerald', trend: '+12%' },
      { label: t('total_funds'), value: formatCurrency(totalFunds), icon: Wallet, color: 'blue', trend: '+5.4%' },
      { label: 'Active Campaigns', value: campaigns.filter((c: any) => c.phase === 'active').length, icon: Flag, color: 'purple', trend: 'Ongoing' },
      { label: t('open_grievances'), value: grievances.filter((g: any) => g.status !== 'closed').length, icon: MessageSquare, color: 'rose', trend: '-2' },
    ];
  } else if (role === 'finance_officer') {
    const income = transactions.filter((t: any) => t.type === 'income').reduce((acc: number, t: any) => acc + t.amount, 0);
    const expense = transactions.filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0);
    stats = [
      { label: 'Net Balance', value: formatCurrency(totalFunds), icon: Wallet, color: 'blue', trend: 'Current' },
      { label: 'Total Income', value: formatCurrency(income), icon: TrendingUp, color: 'emerald', trend: 'YTD' },
      { label: 'Total Expenses', value: formatCurrency(expense), icon: TrendingDown, color: 'rose', trend: 'YTD' },
      { label: 'Transactions', value: transactions.length, icon: CreditCard, color: 'amber', trend: 'Total' },
    ];
  } else if (role === 'booth_coordinator') {
    const readyBooths = booths.filter((b: any) => b.status === 'ready').length;
    const criticalBooths = booths.filter((b: any) => b.status === 'critical').length;
    stats = [
      { label: 'Total Booths', value: booths.length, icon: MapPin, color: 'blue', trend: 'Assigned' },
      { label: 'Ready Booths', value: readyBooths, icon: CheckCircle2, color: 'emerald', trend: 'Good' },
      { label: 'Critical Booths', value: criticalBooths, icon: AlertCircle, color: 'rose', trend: 'Needs Action' },
      { label: 'Supporters', value: supporters.length, icon: HeartHandshake, color: 'purple', trend: 'Identified' },
    ];
  } else if (role === 'field_coordinator') {
    const strongSupporters = supporters.filter((s: any) => s.supportLevel === 'strong').length;
    stats = [
      { label: 'Active Campaigns', value: campaigns.filter((c: any) => c.phase === 'active').length, icon: Flag, color: 'purple', trend: 'Ongoing' },
      { label: 'Total Supporters', value: supporters.length, icon: Users, color: 'blue', trend: 'Identified' },
      { label: 'Strong Supporters', value: strongSupporters, icon: HeartHandshake, color: 'emerald', trend: 'Committed' },
      { label: 'Upcoming Events', value: events.length, icon: Calendar, color: 'amber', trend: 'Planned' },
    ];
  } else {
    // Regular member
    stats = [
      { label: 'My Grievances', value: grievances.length, icon: MessageSquare, color: 'blue', trend: 'Submitted' },
      { label: 'Upcoming Events', value: events.length, icon: Calendar, color: 'emerald', trend: 'Join' },
    ];
  }

  return (
    <div className="space-y-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Welcome back, {profile?.displayName || 'User'}</h2>
        <p className="text-slate-500">Here is your {role.replace('_', ' ')} overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`p-6 hover:shadow-lg transition-shadow border-l-4 border-l-${stat.color}-500`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <h4 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h4>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-xs font-bold text-${stat.color}-600 bg-${stat.color}-50 px-2 py-0.5 rounded-full`}>{stat.trend}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {(role === 'admin' || role === 'staff' || role === 'finance_officer') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(role === 'admin' || role === 'staff') && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-500" />
                  Membership Growth
                </h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="members" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {(role === 'admin' || role === 'staff' || role === 'finance_officer') && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 size={20} className="text-blue-500" />
                  Financial Overview
                </h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="funds" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {role === 'booth_coordinator' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin size={20} className="text-blue-500" />
              Recent Booth Updates
            </h3>
          </div>
          <div className="space-y-4">
            {booths.slice(0, 5).map((booth: any) => (
              <div key={booth.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800">{booth.name}</p>
                  <p className="text-sm text-slate-500">Ward {booth.ward}, {booth.localLevel}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${booth.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                    booth.status === 'needs_attention' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}
                >
                  {booth.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {booths.length === 0 && <p className="text-slate-500 text-center py-4">No booths assigned yet.</p>}
          </div>
        </Card>
      )}
      
      {role === 'field_coordinator' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Flag size={20} className="text-purple-500" />
              Active Campaigns
            </h3>
          </div>
          <div className="space-y-4">
            {campaigns.filter((c: any) => c.phase === 'active').slice(0, 5).map((campaign: any) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800">{campaign.title}</p>
                  <p className="text-sm text-slate-500">{campaign.targetLocalLevel || campaign.targetDistrict || 'National'}</p>
                </div>
                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                  Active
                </span>
              </div>
            ))}
            {campaigns.filter((c: any) => c.phase === 'active').length === 0 && <p className="text-slate-500 text-center py-4">No active campaigns.</p>}
          </div>
        </Card>
      )}
    </div>
  );
};

const MembersView = ({ members }: { members: PartyMember[] }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<CommitteeLevel | 'all'>('all');

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.fullName.toLowerCase().includes(search.toLowerCase()) ||
                          m.district.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filterLevel === 'all' || m.committeeLevel === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMember: Partial<PartyMember> = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      province: formData.get('province') as string,
      district: formData.get('district') as string,
      localLevel: formData.get('localLevel') as string,
      ward: parseInt(formData.get('ward') as string),
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      qrCode: Math.random().toString(36).substring(2, 15)
    };

    try {
      await api.post('/members', newMember);
      logAudit('MEMBER_CREATE', `Added member: ${newMember.fullName}`);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const exportCSV = () => {
    const csv = Papa.unparse(members);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "nup_members.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printIDCard = (member: PartyMember) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85, 55] // ID card size
    });

    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, 85, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("NAGARIK UNMUKTI PARTY", 42.5, 8, { align: 'center' });
    doc.setFontSize(6);
    doc.text("MEMBERSHIP CARD", 42.5, 12, { align: 'center' });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(member.fullName, 10, 25);
    
    doc.setFontSize(8);
    doc.text(`ID: ${member.qrCode?.substring(0, 8).toUpperCase()}`, 10, 32);
    doc.text(`District: ${member.district}`, 10, 38);
    doc.text(`Joined: ${member.joiningDate}`, 10, 44);

    // QR Code placeholder (in real app, use canvas to image)
    doc.rect(60, 20, 20, 20);
    doc.setFontSize(5);
    doc.text("Scan to Verify", 70, 43, { align: 'center' });

    doc.save(`${member.fullName}_ID_Card.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">{t('members')}</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportCSV} icon={Download}>{t('export_csv')}</Button>
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>{t('add_member')}</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={t('search')}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as any)}
          className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm min-w-[200px]"
        >
          <option value="all">All Levels</option>
          <option value="central">Central</option>
          <option value="province">Province</option>
          <option value="district">District</option>
          <option value="municipality">Municipality</option>
          <option value="ward">Ward</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">{t('name')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Region</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">{t('level')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">{t('status')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{member.fullName}</p>
                        <p className="text-xs text-slate-400">{member.phone || member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-700">{member.district}</p>
                    <p className="text-xs text-slate-400">{member.province}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                      {member.committeeLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => printIDCard(member)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title={t('print_card')}>
                        <Printer size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors" title={t('delete')}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('add_member')}>
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input name="fullName" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Phone</label>
              <input name="phone" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Province</label>
              <select name="province" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                {[1,2,3,4,5,6,7].map(p => <option key={p} value={p}>Province {p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Committee Level</label>
              <select name="committeeLevel" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                <option value="central">Central</option>
                <option value="province">Province</option>
                <option value="district">District</option>
                <option value="municipality">Municipality</option>
                <option value="ward">Ward</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">District</label>
              <input name="district" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const DocumentsView = ({ documents }: { documents: PartyDocument[] }) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchTerm, categoryFilter]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const file = (e.currentTarget.elements.namedItem('file') as HTMLInputElement).files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Assuming the API handles file upload and document creation
      await api.post('/documents/upload', formData);

      await logAudit('DOCUMENT_UPLOAD', `Uploaded document: ${formData.get('title')}`);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('documents')}</h2>
          <p className="text-slate-500">Manage and store party-related files</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">{t('add_document')}</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">{t('title')}</label>
              <input name="title" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">{t('category')}</label>
              <select name="category" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                <option value="policy">{t('category_policy')}</option>
                <option value="legal">{t('category_legal')}</option>
                <option value="manifesto">{t('category_manifesto')}</option>
                <option value="finance">{t('category_finance')}</option>
                <option value="other">{t('category_other')}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">{t('description')}</label>
              <textarea name="description" rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">File</label>
              <div className="relative group">
                <input 
                  type="file" 
                  name="file" 
                  required 
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="w-full px-4 py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 group-hover:border-emerald-500 transition-colors">
                  <Upload className="text-slate-400 group-hover:text-emerald-500" size={24} />
                  <p className="text-sm text-slate-500">Click or drag to upload</p>
                  <p className="text-[10px] text-slate-400">PDF, DOCX, Images (Max 10MB)</p>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? 'Uploading...' : t('add_document')}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={t('search')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="policy">{t('category_policy')}</option>
              <option value="legal">{t('category_legal')}</option>
              <option value="manifesto">{t('category_manifesto')}</option>
              <option value="finance">{t('category_finance')}</option>
              <option value="other">{t('category_other')}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="p-4 flex items-start gap-4 hover:border-emerald-200 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <FileText size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{doc.title}</h4>
                  <p className="text-xs text-slate-500 mb-2 truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                      {doc.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatSize(doc.size)}
                    </span>
                  </div>
                </div>
                <a 
                  href={doc.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                  title={t('download')}
                >
                  <Download size={18} />
                </a>
              </Card>
            ))}
          </div>
          
          {filteredDocs.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <FileText className="mx-auto text-slate-300 mb-2" size={48} />
              <p className="text-slate-500">No documents found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FinanceView = ({ transactions, user }: { transactions: Transaction[], user: any }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTx: Partial<Transaction> = {
      type: formData.get('type') as TransactionType,
      category: formData.get('category') as TransactionCategory,
      amount: parseFloat(formData.get('amount') as string),
      description: formData.get('description') as string,
      date: new Date().toISOString(),
      recordedBy: user?.id || 'system'
    };

    try {
      await api.post('/transactions', newTx);
      logAudit('FINANCE_TX', `Recorded ${newTx.type}: ${newTx.amount} NPR`);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error recording transaction:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{t('finance')}</h2>
        <Button onClick={() => setIsModalOpen(true)} icon={Plus}>Record Transaction</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-emerald-50 border-emerald-100">
          <p className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Total Income</p>
          <h3 className="text-3xl font-black text-emerald-800 mt-2">
            {formatCurrency(transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0))}
          </h3>
        </Card>
        <Card className="p-6 bg-rose-50 border-rose-100">
          <p className="text-sm font-bold text-rose-700 uppercase tracking-wider">Total Expenses</p>
          <h3 className="text-3xl font-black text-rose-800 mt-2">
            {formatCurrency(transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0))}
          </h3>
        </Card>
        <Card className="p-6 bg-blue-50 border-blue-100">
          <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Net Balance</p>
          <h3 className="text-3xl font-black text-blue-800 mt-2">
            {formatCurrency(transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0))}
          </h3>
        </Card>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-4 text-sm font-semibold text-slate-600">{t('date')}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-600">{t('category')}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-600">{t('description')}</th>
                <th className="px-4 py-4 text-sm font-semibold text-slate-600 text-right">{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {tx.date?.toDate ? format(tx.date.toDate(), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{tx.description}</td>
                  <td className={`px-4 py-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Transaction">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Type</label>
              <select name="type" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Category</label>
              <select name="category" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                <option value="fee">Membership Fee</option>
                <option value="donation">Donation</option>
                <option value="campaign">Campaign Expense</option>
                <option value="administrative">Administrative</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Amount (NPR)</label>
              <input name="amount" type="number" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea name="description" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 h-24" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const { t, i18n: i18nInstance } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Data State
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [documents, setDocuments] = useState<PartyDocument[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.get('/auth/me');
          setUser(userData);
          setProfile(userData); // Use the same object for now to minimize refactoring
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
        }
      }
      setIsAuthReady(true);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!user || !profile) return;

    const isStaffOrAdmin = profile.role === 'ADMIN' || profile.role === 'STAFF';
    const isAdmin = profile.role === 'ADMIN';
    const isFinanceOfficer = profile.role === 'FINANCE_OFFICER';
    const isFieldCoordinator = profile.role === 'FIELD_COORDINATOR';
    const isBoothCoordinator = profile.role === 'BOOTH_COORDINATOR';

    const fetchData = async () => {
      try {
        if (isStaffOrAdmin || isFieldCoordinator) {
          const membersData = await api.get('/members');
          setMembers(membersData);
        }

        if (isStaffOrAdmin || isFieldCoordinator || isBoothCoordinator) {
          const supportersData = await api.get('/supporters');
          setSupporters(supportersData);
        }

        if (isStaffOrAdmin || isFinanceOfficer) {
          setTransactions(await api.get('/transactions'));
        }
        
        setEvents(await api.get('/events'));
        setGrievances(await api.get('/grievances'));
        
        if (isAdmin) {
          setAuditLogs(await api.get('/auditlogs'));
        }
        
        setCommittees(await api.get('/committees'));
        setCandidates(await api.get('/candidates'));
        setDocuments(await api.get('/documents'));
        setCampaigns(await api.get('/campaigns'));
        setBooths(await api.get('/booths'));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [user, profile]);

  const handleLogout = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  const toggleLanguage = () => {
    const nextLng = i18nInstance.language === 'en' ? 'ne' : 'en';
    i18nInstance.changeLanguage(nextLng);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(u) => { setUser(u); setProfile(u); }} t={t} />;
  }

  const role = profile?.role || 'member';

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'members', label: t('members'), icon: Users, allowedRoles: ['admin', 'staff', 'field_coordinator'] },
    { id: 'supporters', label: 'Supporters', icon: HeartHandshake, allowedRoles: ['admin', 'staff', 'field_coordinator', 'booth_coordinator'] },
    { id: 'campaigns', label: 'Campaigns', icon: Flag, allowedRoles: ['admin', 'staff', 'field_coordinator'] },
    { id: 'booths', label: 'Booths', icon: MapPin, allowedRoles: ['admin', 'staff', 'booth_coordinator'] },
    { id: 'committees', label: t('committees'), icon: Building2, allowedRoles: ['admin', 'staff'] },
    { id: 'finance', label: t('finance'), icon: CreditCard, allowedRoles: ['admin', 'finance_officer'] },
    { id: 'events', label: t('events'), icon: Calendar },
    { id: 'grievances', label: t('grievances'), icon: MessageSquare },
    { id: 'candidates', label: t('candidates'), icon: Trophy, allowedRoles: ['admin', 'staff'] },
    { id: 'documents', label: t('documents'), icon: FileText, allowedRoles: ['admin', 'staff', 'finance_officer', 'field_coordinator', 'booth_coordinator'] },
    { id: 'audit', label: t('audit_logs'), icon: History, allowedRoles: ['admin'] },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed inset-y-0 left-0 z-40 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">N</div>
              <span className="font-black text-white tracking-tight">NUP OS</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            {isSidebarOpen ? <ChevronRight size={20} className="rotate-180" /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.allowedRoles && !item.allowedRoles.includes(role)) return null;
            if ((item as any).adminOnly && role !== 'admin') return null;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <Globe size={20} />
            {isSidebarOpen && <span className="font-medium">{i18nInstance.language === 'en' ? 'नेपाली' : 'English'}</span>}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-rose-900/20 hover:text-rose-400 transition-colors text-slate-400"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">{t('logout')}</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]'}`}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{t('welcome')}, {profile?.displayName}</h2>
            <p className="text-sm text-slate-500">{profile?.partyRole || profile?.role} • Nagarik Unmukti Party Nepal</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                {user.photoURL ? <img src={user.photoURL} alt="Profile" /> : <Users size={20} className="text-slate-400" />}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardView profile={profile} members={members} transactions={transactions} events={events} grievances={grievances} booths={booths} campaigns={campaigns} supporters={supporters} />}
              {activeTab === 'members' && <MembersView members={members} />}
              {activeTab === 'supporters' && <SupportersView supporters={supporters} />}
              {activeTab === 'campaigns' && <CampaignsView campaigns={campaigns} />}
              {activeTab === 'booths' && <BoothsView booths={booths} />}
              {activeTab === 'finance' && <FinanceView transactions={transactions} user={user} />}
              {activeTab === 'committees' && <CommitteesView committees={committees} />}
              {activeTab === 'events' && <EventsView events={events} />}
              {activeTab === 'grievances' && <GrievancesView grievances={grievances} user={user} />}
              {activeTab === 'candidates' && <CandidatesView candidates={candidates} />}
              {activeTab === 'documents' && <DocumentsView documents={documents} />}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800">{t('audit_logs')}</h2>
                  <Card className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="px-4 py-4 text-sm font-semibold text-slate-600">{t('audit_time')}</th>
                            <th className="px-4 py-4 text-sm font-semibold text-slate-600">{t('audit_user')}</th>
                            <th className="px-4 py-4 text-sm font-semibold text-slate-600">{t('audit_action')}</th>
                            <th className="px-4 py-4 text-sm font-semibold text-slate-600">{t('audit_details')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-4 text-xs text-slate-500">
                                {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'MMM dd, HH:mm:ss') : 'N/A'}
                              </td>
                              <td className="px-4 py-4 text-sm font-bold text-slate-700">{log.performedBy}</td>
                              <td className="px-4 py-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm text-slate-600">{log.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
