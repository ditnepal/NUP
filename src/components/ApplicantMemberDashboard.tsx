import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Clock, CheckCircle, XCircle, FileText, Phone, Hash, Calendar, MapPin, User, ShieldAlert, CreditCard, Info } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ApplicantMemberDashboardProps {
  user: any;
  onLogout: () => void;
}

export const ApplicantMemberDashboard: React.FC<ApplicantMemberDashboardProps> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<any | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        // We fetch the application linked to this user
        const response = await api.get('/public/my-application');
        setApplication(response);
      } catch (err: any) {
        console.error('Error fetching application:', err);
        // If it's a 404, we just set application to null
        if (err.status === 404) {
          setApplication(null);
          setError(null);
        } else {
          setError(err.message || 'Failed to load your application details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'VERIFIED':
        return <Clock className="text-amber-500" size={32} />;
      case 'ACTIVE':
        return <CheckCircle className="text-emerald-500" size={32} />;
      case 'REJECTED':
      case 'TERMINATED':
      case 'SUSPENDED':
        return <XCircle className="text-rose-500" size={32} />;
      default:
        return <Clock className="text-slate-400" size={32} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'VERIFIED':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED':
      case 'TERMINATED':
      case 'SUSPENDED':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-rose-50 border border-rose-100 rounded-3xl text-center">
        <ShieldAlert className="text-rose-500 mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Error Loading Dashboard</h2>
        <p className="text-rose-700 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all">Retry</button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white border border-slate-100 rounded-3xl shadow-xl text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText size={40} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">No Active Application</h2>
        <p className="text-slate-600 mb-8">We couldn't find a membership application linked to your account. You can start a new application or contact support if you believe this is an error.</p>
        <button onClick={onLogout} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
          Logout & Sign In Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
              alt="Avatar"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{application.fullName}</h1>
            <p className="text-slate-500 font-medium">Applicant Member Portal</p>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2">
          <div className={`px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest border ${getStatusColor(application.status)} flex items-center gap-2`}>
            {getStatusIcon(application.status)}
            {application.status === 'ACTIVE' ? 'APPROVED / ACTIVE' : application.status}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Status</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Status Message Card */}
          <div className={`p-6 rounded-3xl border-2 ${
            application.status === 'PENDING' ? 'bg-amber-50 border-amber-100' :
            application.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100' :
            'bg-rose-50 border-rose-100'
          }`}>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Info size={20} />
              Important Notice
            </h3>
            <p className="font-medium">
              {application.status === 'PENDING' && "Your application is currently under review. Our administrative team is verifying your documents and payment. Please check back here for updates."}
              {application.status === 'ACTIVE' && "Congratulations! Your application has been approved. You are now an active member of the party. Your role will be upgraded shortly."}
              {application.status === 'REJECTED' && `Your application has been rejected. Reason: ${application.rejectionReason || 'Not specified'}.`}
            </p>
            {application.decisionNotes && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-10">
                <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-60">Decision Notes</p>
                <p className="font-bold">{application.decisionNotes}</p>
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
              <User size={24} className="text-emerald-600" />
              Submitted Profile Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <DetailItem label="Full Name" value={application.fullName} icon={<User size={14} />} />
              <DetailItem label="Tracking Code" value={application.trackingCode} icon={<Hash size={14} />} isMono />
              <DetailItem label="Mobile Number" value={application.mobile} icon={<Phone size={14} />} />
              <DetailItem label="Email Address" value={user.email} icon={<Info size={14} />} />
              <DetailItem label="Citizenship No." value={application.citizenshipNumber} icon={<FileText size={14} />} />
              <DetailItem label="Submission Date" value={format(new Date(application.createdAt), 'MMMM d, yyyy')} icon={<Calendar size={14} />} />
              <DetailItem label="Address" value={`${application.province}, ${application.district}, ${application.localLevel}, Ward ${application.ward}`} icon={<MapPin size={14} />} />
              <DetailItem label="Organization Unit" value={application.orgUnit?.name} icon={<Hash size={14} />} />
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Status */}
        <div className="space-y-8">
          {/* Payment Status */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-blue-600" />
              Payment Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Method</span>
                <span className="font-bold text-slate-700 uppercase">{application.paymentMethod || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm">Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  application.paymentStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {application.paymentStatus || 'PENDING'}
                </span>
              </div>
              {application.paymentStatus !== 'COMPLETED' && (
                <p className="text-xs text-slate-400 italic">
                  Your payment is being verified. This usually takes 24-48 hours.
                </p>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity size={20} className="text-emerald-400" />
              Next Steps
            </h3>
            <ul className="space-y-4">
              <StepItem 
                done={true} 
                text="Application Submitted" 
              />
              <StepItem 
                done={application.paymentStatus === 'COMPLETED'} 
                text="Payment Verification" 
              />
              <StepItem 
                done={application.status === 'VERIFIED' || application.status === 'ACTIVE'} 
                text="Document Verification" 
              />
              <StepItem 
                done={application.status === 'ACTIVE'} 
                text="Final Approval & ID Issue" 
              />
            </ul>
          </div>

          <button 
            onClick={onLogout}
            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            Logout from Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon, isMono = false }: { label: string, value: string, icon: React.ReactNode, isMono?: boolean }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
      {icon}
      {label}
    </p>
    <p className={`font-bold text-slate-700 ${isMono ? 'font-mono' : ''}`}>{value || 'N/A'}</p>
  </div>
);

const StepItem = ({ done, text }: { done: boolean, text: string }) => (
  <li className="flex items-center gap-3">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
      done ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
    }`}>
      {done ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-current" />}
    </div>
    <span className={`text-sm font-medium ${done ? 'text-white' : 'text-slate-500'}`}>{text}</span>
  </li>
);

const Activity = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const LogOut = ({ size }: { size: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
