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
  const [status, setStatus] = useState(member.status || 'PENDING');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(member.id, { fullName, citizenshipNumber, status });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Member</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Citizenship Number</label>
          <input type="text" value={citizenshipNumber} onChange={(e) => setCitizenshipNumber(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Member['status'])} className="w-full border rounded p-2">
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </form>
    </div>
  );
};
