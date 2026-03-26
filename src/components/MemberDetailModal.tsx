import React, { useState } from 'react';
import { Member, UserProfile } from '../types';
import { FileText, Video, User } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

interface MemberDetailModalProps {
  member: Member;
  user: UserProfile | null;
  onClose: () => void;
  onVerify: (id: string, note?: string) => void;
  onApprove: (id: string, note?: string) => void;
  onReject: (id: string, reason?: string) => void;
  onEscalate?: (id: string, note?: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, user, onClose, onVerify, onApprove, onReject, onEscalate }) => {
  const { can } = usePermissions(user);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState<'VERIFY' | 'APPROVE' | 'REJECT' | 'ESCALATE' | null>(null);

  const handleAction = (action: 'VERIFY' | 'APPROVE' | 'REJECT' | 'ESCALATE') => {
    if (showNoteInput !== action) {
      setShowNoteInput(action);
      setNote('');
      return;
    }
    
    if (action === 'VERIFY') onVerify(member.id, note);
    if (action === 'APPROVE') onApprove(member.id, note);
    if (action === 'REJECT') onReject(member.id, note);
    if (action === 'ESCALATE' && onEscalate) onEscalate(member.id, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-black text-slate-800">Applicant Details</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
            member.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
            member.status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' :
            member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
            member.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {member.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
              <p className="font-bold text-slate-800">{member.fullName}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Citizenship Number</p>
              <p className="font-bold text-slate-800 font-mono">{member.citizenshipNumber || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Organization Unit</p>
              <p className="font-bold text-slate-800">{member.orgUnit?.name || 'N/A'} ({member.orgUnit?.level || 'N/A'})</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Information</p>
              <p className="font-bold text-slate-800">{member.email || 'No Email'}</p>
              <p className="text-sm text-slate-600">{member.phone || member.mobile || 'No Phone'}</p>
            </div>
            
            {/* Accountability Info */}
            {(member.verifiedBy || member.approvedBy || member.reviewNote) && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Review Accountability</h3>
                
                {member.verifiedBy && (
                  <div>
                    <p className="text-[9px] font-bold text-blue-300 uppercase">Verified By</p>
                    <p className="text-xs font-bold text-blue-800">{member.verifiedBy.displayName}</p>
                    {member.verifiedAt && <p className="text-[9px] text-blue-500">{new Date(member.verifiedAt).toLocaleString()}</p>}
                  </div>
                )}

                {member.approvedBy && (
                  <div>
                    <p className="text-[9px] font-bold text-blue-300 uppercase">Approved By</p>
                    <p className="text-xs font-bold text-blue-800">{member.approvedBy.displayName}</p>
                    {member.approvedAt && <p className="text-[9px] text-blue-500">{new Date(member.approvedAt).toLocaleString()}</p>}
                  </div>
                )}

                {member.reviewNote && (
                  <div>
                    <p className="text-[9px] font-bold text-blue-300 uppercase">Latest Review Note</p>
                    <p className="text-xs italic text-blue-700">"{member.reviewNote}"</p>
                  </div>
                )}

                {member.isEscalated && (
                  <div className="pt-2 border-t border-blue-100">
                    <p className="text-[9px] font-bold text-purple-400 uppercase">Escalation Status</p>
                    <p className="text-xs font-bold text-purple-800">Escalated to Parent Unit</p>
                    {member.escalatedAt && <p className="text-[9px] text-purple-500">{new Date(member.escalatedAt).toLocaleString()}</p>}
                    {member.escalationNote && <p className="text-xs italic text-purple-700 mt-1">"{member.escalationNote}"</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Verification Documents</h3>
            
            <div className="space-y-3">
              {member.profilePhotoUrl && (
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 transition-colors group">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">Profile Photo</p>
                    <a href={`/${member.profilePhotoUrl}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 font-bold hover:underline">View Image</a>
                  </div>
                </div>
              )}

              {member.identityDocumentUrl && (
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-500 transition-colors group">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">Identity Document</p>
                    <a href={`/${member.identityDocumentUrl}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline">View Document</a>
                  </div>
                </div>
              )}

              {member.videoUrl && (
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-purple-500 transition-colors group">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                    <Video size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">Verification Video</p>
                    <a href={`/${member.videoUrl}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-600 font-bold hover:underline">Watch Video</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showNoteInput && (
          <div className={`mt-8 p-4 rounded-xl border ${
            showNoteInput === 'REJECT' ? 'bg-rose-50 border-rose-100' : 
            showNoteInput === 'ESCALATE' ? 'bg-purple-50 border-purple-100' : 'bg-blue-50 border-blue-100'
          }`}>
            <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${
              showNoteInput === 'REJECT' ? 'text-rose-600' : 
              showNoteInput === 'ESCALATE' ? 'text-purple-600' : 'text-blue-600'
            }`}>
              {showNoteInput === 'REJECT' ? 'Rejection Reason' : 
               showNoteInput === 'ESCALATE' ? 'Escalation Note' : 'Review Note (Optional)'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`w-full p-3 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                showNoteInput === 'REJECT' ? 'border-rose-200 focus:ring-rose-500' : 
                showNoteInput === 'ESCALATE' ? 'border-purple-200 focus:ring-purple-500' : 'border-blue-200 focus:ring-blue-500'
              }`}
              placeholder={showNoteInput === 'REJECT' ? "Explain why this application is being rejected..." : 
                           showNoteInput === 'ESCALATE' ? "Explain why this is being escalated to parent scope..." : "Add a note about this verification/approval..."}
              rows={3}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
          >
            Close
          </button>
          
          {(member.status === 'PENDING' || member.status === 'VERIFIED') && can('MEMBERSHIP', 'APPROVE') && (
            <button 
              onClick={() => handleAction('REJECT')} 
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                showNoteInput === 'REJECT' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50'
              }`}
            >
              {showNoteInput === 'REJECT' ? 'Confirm Rejection' : 'Reject Application'}
            </button>
          )}

          {!member.isEscalated && onEscalate && (member.status === 'PENDING' || member.status === 'VERIFIED' || member.status === 'REJECTED') && can('MEMBERSHIP', 'APPROVE') && (
            <button 
              onClick={() => handleAction('ESCALATE')} 
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                showNoteInput === 'ESCALATE' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50'
              }`}
            >
              {showNoteInput === 'ESCALATE' ? 'Confirm Escalation' : 'Escalate to Parent'}
            </button>
          )}

          {member.status === 'PENDING' && can('MEMBERSHIP', 'APPROVE') && (
            <button 
              onClick={() => handleAction('VERIFY')} 
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                showNoteInput === 'VERIFY' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {showNoteInput === 'VERIFY' ? 'Confirm Verification' : 'Verify Application'}
            </button>
          )}
          
          {member.status === 'VERIFIED' && can('MEMBERSHIP', 'APPROVE') && (
            <button 
              onClick={() => handleAction('APPROVE')} 
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                showNoteInput === 'APPROVE' ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              {showNoteInput === 'APPROVE' ? 'Confirm Approval' : 'Approve Membership'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
