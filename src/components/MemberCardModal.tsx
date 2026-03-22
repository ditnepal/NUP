import React from 'react';
import { Member } from '../types';
import { Award, Download, Printer, X } from 'lucide-react';
import { format } from 'date-fns';

interface MemberCardModalProps {
  member: Member;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({ member, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-black text-slate-800 uppercase tracking-tight">Digital ID Card</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group mb-8">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Award size={20} />
                  </div>
                  <span className="font-black tracking-tight text-sm">NUP MEMBER</span>
                </div>
                <span className="text-[8px] font-mono bg-white/10 px-2 py-1 rounded uppercase tracking-widest">
                  {member.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl border border-white/30 overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email || member.id}`} alt="Avatar" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-tight">{member.fullName}</p>
                  <p className="text-xs text-slate-400 font-mono">ID: {member.membershipId || 'PENDING'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Issue Date</p>
                  <p className="text-xs font-bold">
                    {member.joinedDate ? format(new Date(member.joinedDate), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Expiry Date</p>
                  <p className="text-xs font-bold">
                    {member.expiryDate ? format(new Date(member.expiryDate), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${member.membershipId || member.id}`} 
                  alt="QR Code" 
                  className="w-24 h-24 bg-white p-2 rounded-xl shadow-inner" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
              <Download size={18} />
              Download
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
              <Printer size={18} />
              Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
