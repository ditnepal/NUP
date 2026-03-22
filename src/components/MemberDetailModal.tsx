import React, { useState } from 'react';
import { Member } from '../types';
import { FileText, Video, User } from 'lucide-react';

interface MemberDetailModalProps {
  member: Member;
  onClose: () => void;
  onVerify: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, onClose, onVerify, onApprove, onReject }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    onReject(member.id, rejectReason);
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Information</p>
              <p className="font-bold text-slate-800">{member.email || 'No Email'}</p>
              <p className="text-sm text-slate-600">{member.phone || member.mobile || 'No Phone'}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Application Mode</p>
              <p className="font-bold text-slate-800">{member.applicationMode}</p>
            </div>
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

              {!member.profilePhotoUrl && !member.identityDocumentUrl && !member.videoUrl && (
                <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
              )}
            </div>
          </div>
        </div>

        {showRejectInput && (
          <div className="mt-8 p-4 bg-rose-50 rounded-xl border border-rose-100">
            <label className="block text-xs font-bold text-rose-600 uppercase tracking-widest mb-2">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 bg-white border border-rose-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Explain why this application is being rejected..."
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
          
          {(member.status === 'PENDING' || member.status === 'VERIFIED') && (
            <button 
              onClick={handleReject} 
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                showRejectInput ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50'
              }`}
            >
              {showRejectInput ? 'Confirm Rejection' : 'Reject Application'}
            </button>
          )}

          {member.status === 'PENDING' && (
            <button 
              onClick={() => { onVerify(member.id); onClose(); }} 
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Verify Application
            </button>
          )}
          
          {member.status === 'VERIFIED' && (
            <button 
              onClick={() => { onApprove(member.id); onClose(); }} 
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              Approve Membership
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
