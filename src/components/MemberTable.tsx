import React from 'react';
import { Member } from '../types';
import { ShieldCheck, UserCheck, CreditCard, RefreshCw, ArrowRightLeft, AlertTriangle, XCircle } from 'lucide-react';

interface MemberTableProps {
  members: Member[];
  onVerify: (id: string) => void;
  onApprove: (id: string) => void;
  onViewCard: (id: string) => void;
  onRenew: (id: string) => void;
  onTransfer: (id: string) => void;
  onSuspend: (id: string) => void;
  onTerminate: (id: string) => void;
}

export const MemberTable: React.FC<MemberTableProps> = ({ members, onVerify, onApprove, onViewCard, onRenew, onTransfer, onSuspend, onTerminate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Citizenship</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                      {member.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{member.fullName}</div>
                      <div className="text-xs text-gray-500">{member.email || member.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{member.orgUnitId}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-mono">{member.citizenshipNumber}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    member.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' :
                    member.status === 'VERIFIED' ? 'bg-blue-50 text-blue-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {member.status === 'PENDING' && (
                    <button onClick={() => onVerify(member.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Verify">
                      <ShieldCheck size={20} />
                    </button>
                  )}
                  {member.status === 'VERIFIED' && (
                    <button onClick={() => onApprove(member.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                      <UserCheck size={20} />
                    </button>
                  )}
                  {member.status === 'ACTIVE' && (
                    <>
                      <button onClick={() => onViewCard(member.id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="View Card">
                        <CreditCard size={20} />
                      </button>
                      <button onClick={() => onRenew(member.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Renew">
                        <RefreshCw size={20} />
                      </button>
                      <button onClick={() => onTransfer(member.id)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Transfer">
                        <ArrowRightLeft size={20} />
                      </button>
                      <button onClick={() => onSuspend(member.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Suspend">
                        <AlertTriangle size={20} />
                      </button>
                      <button onClick={() => onTerminate(member.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Terminate">
                        <XCircle size={20} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
