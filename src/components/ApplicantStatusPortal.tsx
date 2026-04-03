import React, { useState } from 'react';
import { api } from '../lib/api';
import { Search, ChevronLeft, Clock, CheckCircle, XCircle, FileText, Phone, Hash, Calendar, MapPin } from 'lucide-react';
import { safeFormat } from '../lib/date';

interface ApplicantStatusPortalProps {
  onBack: () => void;
  onLoginClick: () => void;
  initialTrackingCode?: string;
  initialMobile?: string;
}

export const ApplicantStatusPortal: React.FC<ApplicantStatusPortalProps> = ({ onBack, onLoginClick, initialTrackingCode = '', initialMobile = '' }) => {
  const [trackingCode, setTrackingCode] = useState(initialTrackingCode);
  const [mobile, setMobile] = useState(initialMobile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<any | null>(null);
  const [password, setPassword] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const handleLookup = async (e?: React.FormEvent, manualTrackingCode?: string, manualMobile?: string) => {
    e?.preventDefault();
    const targetTrackingCode = manualTrackingCode || trackingCode;
    const targetMobile = manualMobile || mobile;

    if (!targetTrackingCode || !targetMobile) return;

    setLoading(true);
    setError(null);
    setStatusData(null);
    setClaimSuccess(false);
    setClaimEmail('');

    try {
      console.log('[DEBUG] Frontend Lookup:', { trackingCode: targetTrackingCode, mobileNumber: targetMobile });
      const response = await fetch('/api/public/membership-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingCode: targetTrackingCode,
          mobileNumber: targetMobile
        })
      });
      
      const data = await response.json();
      console.log('[DEBUG] Frontend Lookup Result:', data);
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Application not found');
      }
      
      setStatusData(data);
      if (data.email) {
        setClaimEmail(data.email);
      }
    } catch (err: any) {
      console.error('Error looking up status:', err);
      setError(err.message || 'Application not found with provided details. Please check your tracking code and mobile number.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // 1. Check URL parameters first
    const params = new URLSearchParams(window.location.search);
    const urlTrackingCode = params.get('trackingCode');
    const urlMobile = params.get('mobile');

    if (urlTrackingCode || urlMobile) {
      if (urlTrackingCode) setTrackingCode(urlTrackingCode);
      if (urlMobile) setMobile(urlMobile);
      handleLookup(undefined, urlTrackingCode || trackingCode, urlMobile || mobile);
      return;
    }

    // 2. If no URL params, check props (from successful submission)
    if (initialTrackingCode && initialMobile) {
      handleLookup(undefined, initialTrackingCode, initialMobile);
    }
  }, [initialTrackingCode, initialMobile]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaiming(true);
    setError(null);

    try {
      await api.post('/public/membership-claim', {
        trackingCode: statusData.trackingCode,
        mobile,
        email: claimEmail,
        password
      });
      setClaimSuccess(true);
      setStatusData({ ...statusData, hasAccount: true });
    } catch (err: any) {
      console.error('Error claiming account:', err);
      setError(err.message || 'Failed to claim account. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const getProgress = (status: string) => {
    if (status === 'ACTIVE') return 100;
    if (status === 'VERIFIED') return 75;
    if (status === 'PENDING') return 40;
    if (status === 'REJECTED') return 0;
    return 20;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'VERIFIED':
        return <Clock className="text-amber-500" size={48} />;
      case 'ACTIVE':
        return <CheckCircle className="text-emerald-500" size={48} />;
      case 'REJECTED':
      case 'TERMINATED':
      case 'SUSPENDED':
        return <XCircle className="text-rose-500" size={48} />;
      default:
        return <Clock className="text-slate-400" size={48} />;
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors text-[10px] font-black uppercase tracking-widest mb-6 group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Return to Portal
                </button>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100 mb-4">
                <Search size={12} />
                Tracking System
              </div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Application Status</h1>
              <p className="text-slate-500">Enter your tracking code and mobile number to check your membership status.</p>
            </div>

            {!statusData ? (
              <form onSubmit={handleLookup} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Hash size={12} />
                      Tracking Code
                    </label>
                    <input
                      type="text"
                      required
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="e.g. NUP-2026-XXXX"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all font-mono text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Phone size={12} />
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 98XXXXXXXX"
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-3">
                    <XCircle size={18} className="shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    'Searching System...'
                  ) : (
                    <>
                      <Search size={16} />
                      Check Status
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center text-center pb-8 border-b border-slate-100">
                  <div className="mb-6 p-6 bg-slate-50 rounded-full">
                    {getStatusIcon(statusData.status)}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                    {statusData.fullName}
                  </h2>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(statusData.status)}`}>
                    {statusData.status === 'ACTIVE' ? 'APPROVED / ACTIVE' : statusData.status}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                    <span className="text-slate-500">VERIFICATION PROGRESS</span>
                    <span className="text-emerald-600">{getProgress(statusData.status)}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      style={{ width: `${getProgress(statusData.status)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className={`text-[9px] font-black text-center py-1.5 rounded-lg border ${statusData.status === 'PENDING' || statusData.status === 'VERIFIED' || statusData.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                      SUBMITTED
                    </div>
                    <div className={`text-[9px] font-black text-center py-1.5 rounded-lg border ${statusData.status === 'VERIFIED' || statusData.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                      VERIFIED
                    </div>
                    <div className={`text-[9px] font-black text-center py-1.5 rounded-lg border ${statusData.status === 'ACTIVE' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                      APPROVED
                    </div>
                  </div>
                </div>

                {statusData.status === 'PENDING' && (
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl text-center animate-in fade-in duration-500">
                    <p className="text-amber-800 font-bold mb-2">
                      Your application is currently under review by our administrative team. 
                    </p>
                    <p className="text-amber-700 text-sm">
                      Please check back here periodically using your tracking code. 
                      Email notifications are currently disabled for security; this portal is the official source for your status.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Hash size={12} />
                      Tracking Code
                    </p>
                    <p className="font-mono font-bold text-slate-700">{statusData.trackingCode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar size={12} />
                      Submission Date
                    </p>
                    <p className="font-bold text-slate-700">
                      {safeFormat(statusData.createdAt, 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText size={12} />
                      Citizenship Number
                    </p>
                    <p className="font-bold text-slate-700">{statusData.citizenshipNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Phone size={12} />
                      Mobile Number
                    </p>
                    <p className="font-bold text-slate-700">{statusData.mobile || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin size={12} />
                      Address
                    </p>
                    <p className="font-bold text-slate-700">
                      {statusData.province}, {statusData.district}, {statusData.localLevel}, Ward {statusData.ward}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText size={12} />
                      Application Mode
                    </p>
                    <p className="font-bold text-slate-700 uppercase">{statusData.applicationMode}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle size={12} />
                      Payment Status
                    </p>
                    <p className={`font-bold ${statusData.latestTransaction?.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {(statusData.latestTransaction?.status || 'PENDING').toUpperCase()}
                    </p>
                  </div>
                  {statusData.membershipId && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle size={12} />
                        Member ID
                      </p>
                      <p className="font-bold text-emerald-600">{statusData.membershipId}</p>
                    </div>
                  )}
                  {statusData.orgUnit && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Hash size={12} />
                        Organization Unit
                      </p>
                      <p className="font-bold text-slate-700">{statusData.orgUnit.name}</p>
                    </div>
                  )}
                </div>

                {statusData.decisionNotes && (
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Decision Notes</p>
                    <p className="text-slate-700 font-medium">{statusData.decisionNotes}</p>
                  </div>
                )}

                {(statusData.status === 'REJECTED' || statusData.status === 'TERMINATED' || statusData.status === 'SUSPENDED') && statusData.rejectionReason && (
                  <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl">
                    <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-2">Reason</p>
                    <p className="text-rose-700 font-medium">{statusData.rejectionReason}</p>
                  </div>
                )}

                {statusData.status === 'ACTIVE' && !statusData.hasAccount && (
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl">
                    <h3 className="text-amber-800 font-bold mb-2">Claim Your Member Account</h3>
                    <p className="text-amber-700 text-sm mb-4">
                      Your membership is active! Set a password for your account {statusData.email ? `(using your registered email: ${statusData.email})` : 'and provide an email address'} to access the member portal.
                    </p>
                    <form onSubmit={handleClaim} className="space-y-4">
                      {!statusData.email && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Email Address</label>
                          <input 
                            type="email" 
                            required 
                            value={claimEmail}
                            onChange={(e) => setClaimEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:border-amber-500 focus:ring-0 transition-all"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Set Password</label>
                        <input 
                          type="password" 
                          required 
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:border-amber-500 focus:ring-0 transition-all"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={claiming}
                        className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 flex items-center justify-center gap-2"
                      >
                        {claiming ? 'Claiming...' : 'Claim Account & Set Password'}
                      </button>
                    </form>
                  </div>
                )}

                {statusData.status === 'ACTIVE' && statusData.hasAccount && (
                  <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center">
                    <p className="text-emerald-800 font-bold mb-4">
                      {claimSuccess ? 'Account claimed successfully!' : 'Your membership is active and your account is ready.'} 
                      You can now log in to access your digital card and member benefits.
                    </p>
                    <button 
                      onClick={onLoginClick}
                      className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                      Login to Portal
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => setStatusData(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Check Another Application
                </button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
