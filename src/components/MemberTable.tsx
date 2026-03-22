import React from 'react';
import { Member } from '../types';
import { ShieldCheck, UserCheck, CreditCard, RefreshCw, ArrowRightLeft, AlertTriangle, XCircle } from 'lucide-react';

interface MemberTableProps {
  members: Member[];
  onVerify: (id: string) => void;
  onApprove: (id: string) => void;
  onViewCard: (member: Member) => void;
  onRegenerateCard: (member: Member) => void;
  onReissueCard: (member: Member) => void;
  onRenew: (member: Member) => void;
  onTransfer: (member: Member) => void;
  onSuspend: (member: Member) => void;
  onTerminate: (member: Member) => void;
  onEdit: (member: Member) => void;
  onViewDetails: (member: Member) => void;
}

export const MemberTable: React.FC<MemberTableProps> = ({ 
  members, onVerify, onApprove, onViewCard, onRegenerateCard, onReissueCard, onRenew, onTransfer, onSuspend, onTerminate, onEdit, onViewDetails 
}) => {
  console.log('MemberTable members:', members);
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
                      {(member.fullName || 'M').charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{member.fullName || 'Unknown Member'}</div>
                      <div className="text-xs text-gray-500">{member.email || member.mobile || 'No contact info'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {member.orgUnit?.name || member.orgUnitId}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-mono">{member.citizenshipNumber}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    member.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' :
                    member.status === 'VERIFIED' ? 'bg-blue-50 text-blue-600' :
                    member.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                    member.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { console.log('Details clicked'); onViewDetails(member); }} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="View Details">
                      Details
                    </button>
                    <button onClick={() => { console.log('Edit clicked'); onEdit(member); }} className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Edit">
                      Edit
                    </button>
                    {member.status === 'PENDING' && (
                      <button onClick={() => { console.log('Verify clicked'); onVerify(member.id); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Verify">
                        <ShieldCheck size={20} />
                      </button>
                    )}
                    {member.status === 'VERIFIED' && (
                      <button onClick={() => { console.log('Approve clicked'); onApprove(member.id); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                        <UserCheck size={20} />
                      </button>
                    )}
                    {member.status === 'ACTIVE' && (
                      <>
                        <button onClick={() => { console.log('View Card clicked'); onViewCard(member); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="View Card">
                          <CreditCard size={20} />
                        </button>
                        <button onClick={() => { console.log('Regenerate Card clicked'); onRegenerateCard(member); }} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Regenerate Card">
                          <RefreshCw size={20} />
                        </button>
                        <button onClick={() => { console.log('Reissue Card clicked'); onReissueCard(member); }} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Reissue Card">
                          <CreditCard size={20} />
                        </button>
                        <button onClick={() => { console.log('Renew clicked'); onRenew(member); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Renew">
                          <RefreshCw size={20} />
                        </button>
                        <button onClick={() => { console.log('Transfer clicked'); onTransfer(member); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Transfer">
                          <ArrowRightLeft size={20} />
                        </button>
                        <button onClick={() => { console.log('Suspend clicked'); onSuspend(member); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Suspend">
                          <AlertTriangle size={20} />
                        </button>
                        <button onClick={() => { console.log('Terminate clicked'); onTerminate(member); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Terminate">
                          <XCircle size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
