import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Member } from '../types';
import { MemberTable } from './MemberTable';

export const MembershipAdmin: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
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

  const handleRenew = async (id: string) => {
    try {
      await api.post(`/members/${id}/renew`, {});
      fetchMembers();
    } catch (error) {
      console.error('Error renewing member:', error);
    }
  };

  const handleTransfer = async (id: string) => {
    const newOrgUnitId = prompt('Enter new OrgUnit ID:');
    if (!newOrgUnitId) return;
    try {
      await api.post(`/members/${id}/transfer`, { newOrgUnitId });
      fetchMembers();
    } catch (error) {
      console.error('Error transferring member:', error);
    }
  };

  const handleSuspend = async (id: string) => {
    const reason = prompt('Enter reason for suspension:');
    if (!reason) return;
    try {
      await api.post(`/members/${id}/suspend`, { reason });
      fetchMembers();
    } catch (error) {
      console.error('Error suspending member:', error);
    }
  };

  const handleTerminate = async (id: string) => {
    const reason = prompt('Enter reason for termination:');
    if (!reason) return;
    try {
      await api.post(`/members/${id}/terminate`, { reason });
      fetchMembers();
    } catch (error) {
      console.error('Error terminating member:', error);
    }
  };

  const handleViewCard = (id: string) => {
    console.log('View card for:', id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Workflow</h1>
          <p className="text-gray-500">Verify and approve new membership applications.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['PENDING', 'VERIFIED', 'ACTIVE', 'SUSPENDED', 'TERMINATED'].map((status) => (
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

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading members...</div>
      ) : (
        <MemberTable 
          members={members} 
          onVerify={handleVerify} 
          onApprove={handleApprove} 
          onViewCard={handleViewCard} 
          onRenew={handleRenew}
          onTransfer={handleTransfer}
          onSuspend={handleSuspend}
          onTerminate={handleTerminate}
        />
      )}
    </div>
  );
};
