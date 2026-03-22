import React from 'react';
import { Member } from '../types';

interface MemberDetailModalProps {
  member: Member;
  onClose: () => void;
  onVerify: (id: string) => void;
  onApprove: (id: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, onClose, onVerify, onApprove }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">Applicant Details</h2>
        <div className="space-y-3">
          <p><span className="font-semibold">Full Name:</span> {member.fullName}</p>
          <p><span className="font-semibold">Citizenship:</span> {member.citizenshipNumber}</p>
          <p><span className="font-semibold">Status:</span> {member.status}</p>
          <p><span className="font-semibold">Email:</span> {member.email || 'N/A'}</p>
          <p><span className="font-semibold">Phone:</span> {member.phone || 'N/A'}</p>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">Close</button>
          {member.status === 'PENDING' && (
            <button onClick={() => { onVerify(member.id); onClose(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Verify</button>
          )}
          {member.status === 'VERIFIED' && (
            <button onClick={() => { onApprove(member.id); onClose(); }} className="px-4 py-2 bg-green-600 text-white rounded-lg">Approve</button>
          )}
        </div>
      </div>
    </div>
  );
};
