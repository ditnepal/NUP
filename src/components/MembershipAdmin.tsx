import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { CheckCircle, XCircle, Clock, Search, ShieldCheck, UserCheck, CreditCard } from 'lucide-react';

export const MembershipAdmin: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');

  useEffect(() => {
    fetchMembers();
  }, [filter]);

  const fetchMembers = async () => {
    try {
      const data = await api.get(`/members?status=${filter}`);
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.post(`/members/${id}/verify`, {});
      fetchMembers();
    } catch (error) {
      console.error('Error verifying member:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/members/${id}/approve`, {});
      fetchMembers();
    } catch (error) {
      console.error('Error approving member:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Workflow</h1>
          <p className="text-gray-500">Verify and approve new membership applications.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['PENDING', 'VERIFIED', 'ACTIVE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Citizenship</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking Code</th>
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
                    <div className="text-sm text-gray-900">{member.district}</div>
                    <div className="text-xs text-gray-500">{member.localLevel}, Ward {member.ward}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-mono">{member.citizenshipNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{member.trackingCode}</td>
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
                      <button 
                        onClick={() => handleVerify(member.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Verify (Local Unit)"
                      >
                        <ShieldCheck size={20} />
                      </button>
                    )}
                    {member.status === 'VERIFIED' && (
                      <button 
                        onClick={() => handleApprove(member.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve (Higher Unit)"
                      >
                        <UserCheck size={20} />
                      </button>
                    )}
                    {member.status === 'ACTIVE' && (
                      <button 
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Membership Card"
                      >
                        <CreditCard size={20} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No applications found in this state.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
