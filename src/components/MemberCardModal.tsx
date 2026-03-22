import React from 'react';
import { Member } from '../types';

interface MemberCardModalProps {
  member: Member;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({ member, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-xl">
        <h2 className="text-xl font-bold mb-4">Membership Card</h2>
        <div className="border-2 border-blue-600 rounded-xl p-4 bg-blue-50">
          <p className="font-bold text-blue-900">{member.fullName}</p>
          <p className="text-sm text-blue-700">ID: {member.membershipId}</p>
          <p className="text-sm text-blue-700">Status: {member.status}</p>
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 bg-gray-200 rounded-lg font-medium">Close</button>
      </div>
    </div>
  );
};
