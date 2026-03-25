import React from 'react';
import { Member } from '../types';
import { ShieldCheck, UserCheck, CreditCard, RefreshCw, ArrowRightLeft, AlertTriangle, XCircle } from 'lucide-react';

interface MemberTableProps {
  members: Member[];
  onVerify: (id: string, note?: string) => void;
  onApprove: (id: string, note?: string) => void;
  onViewCard: (member: Member) => void;
  onRegenerateCard: (member: Member) => void;
  onReissueCard: (member: Member) => void;
  onRenew: (member: Member) => void;
  onTransfer: (member: Member) => void;
  onSuspend: (member: Member) => void;
  onTerminate: (member: Member) => void;
  onEdit: (member: Member) => void;
  onViewDetails: (member: Member) => void;
  onEscalate?: (id: string, note?: string) => void;
}

export const MemberTable: React.FC<MemberTableProps> = ({ 
  members, onVerify, onApprove, onViewCard, onRegenerateCard, onReissueCard, onRenew, onTransfer, onSuspend, onTerminate, onEdit, onViewDetails, onEscalate 
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
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status & Review</th>
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
                  <div className="text-[10px] text-gray-500 uppercase font-bold">{member.orgUnit?.level}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-mono">{member.citizenshipNumber}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className={`w-fit px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      member.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                      member.status === 'VERIFIED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      member.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border border-green-100' :
                      member.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                      'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {member.status}
                    </span>
                    
                    {member.status === 'VERIFIED' && member.verifiedBy && (
                      <div className="text-[10px] text-gray-500">
                        <span className="font-bold">Verified:</span> {member.verifiedBy.displayName}
                        {member.verifiedAt && <div className="text-[9px] opacity-70">{new Date(member.verifiedAt).toLocaleDateString()}</div>}
                      </div>
                    )}

                    {member.status === 'ACTIVE' && member.approvedBy && (
                      <div className="text-[10px] text-gray-500">
                        <span className="font-bold">Approved:</span> {member.approvedBy.displayName}
                        {member.approvedAt && <div className="text-[9px] opacity-70">{new Date(member.approvedAt).toLocaleDateString()}</div>}
                      </div>
                    )}

                    {member.status === 'REJECTED' && member.reviewNote && (
                      <div className="text-[10px] text-rose-500 italic max-w-[150px] truncate" title={member.reviewNote}>
                        {member.reviewNote}
                      </div>
                    )}

                    {member.isEscalated && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded text-[9px] font-bold uppercase tracking-tighter">
                          Escalated
                        </span>
                        {member.escalatedAt && (
                          <span className="text-[8px] text-purple-400">
                            {new Date(member.escalatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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
