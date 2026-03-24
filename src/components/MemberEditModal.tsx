import React, { useState } from 'react';
import { Member } from '../types';

interface MemberEditModalProps {
  member: Member;
  onClose: () => void;
  onSave: (id: string, data: any) => void;
}

export const MemberEditModal: React.FC<MemberEditModalProps> = ({ member, onClose, onSave }) => {
  const [fullName, setFullName] = useState(member.fullName || '');
  const [citizenshipNumber, setCitizenshipNumber] = useState(member.citizenshipNumber || '');
  const [paymentMethod, setPaymentMethod] = useState(member.paymentMethod || '');
  const [status, setStatus] = useState(member.status || 'PENDING');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(member.id, { fullName, citizenshipNumber, paymentMethod, status });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black text-slate-800 mb-6">Edit Member</h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Citizenship Number</label>
            <input type="text" value={citizenshipNumber} onChange={(e) => setCitizenshipNumber(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
            <input type="text" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Member['status'])} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all">
              <option value="PENDING">PENDING</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="TERMINATED">TERMINATED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">Cancel</button>
          <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">Save Changes</button>
        </div>
      </form>
    </div>
  );
};
