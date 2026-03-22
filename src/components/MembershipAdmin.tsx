import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Member } from '../types';
import { MemberTable } from './MemberTable';
import { MemberEditModal } from './MemberEditModal';
import { MemberDetailModal } from './MemberDetailModal';
import { MemberCardModal } from './MemberCardModal';
import { ConfirmationModal } from './ConfirmationModal';

export const MembershipAdmin: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [filter]);

  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/members?status=${filter}`);
      setMembers(data);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      setError(error.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
  };

  const handleViewDetails = (member: Member) => {
    setSelectedMember(member);
    setShowDetailModal(true);
  };

  const handleSaveEdit = async (id: string, data: any) => {
    try {
      await api.put(`/members/${id}`, data);
      setEditingMember(null);
      await fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.post(`/members/${id}/verify`, {});
      await fetchMembers();
    } catch (error) {
      console.error('Error verifying member:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/members/${id}/approve`, {});
      await api.post(`/members/${id}/generate-card`, {});
      await fetchMembers();
    } catch (error) {
      console.error('Error approving member:', error);
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      await api.post(`/members/${id}/reject`, { reason });
      await fetchMembers();
    } catch (error) {
      console.error('Error rejecting member:', error);
    }
  };

  const handleRenew = (member: Member) => {
    setSelectedMember(member);
    setConfirmationAction({ type: 'RENEW', id: member.id });
    setShowConfirmationModal(true);
  };

  const handleTransfer = (member: Member) => {
    setSelectedMember(member);
    setConfirmationAction({ type: 'TRANSFER', id: member.id });
    setShowConfirmationModal(true);
  };

  const handleSuspend = (member: Member) => {
    setSelectedMember(member);
    setConfirmationAction({ type: 'SUSPEND', id: member.id });
    setShowConfirmationModal(true);
  };

  const handleTerminate = (member: Member) => {
    setSelectedMember(member);
    setConfirmationAction({ type: 'TERMINATE', id: member.id });
    setShowConfirmationModal(true);
  };

  const handleViewCard = (member: Member) => {
    setSelectedMember(member);
    setShowCardModal(true);
  };

  const handleRegenerateCard = async (member: Member) => {
    try {
      await api.post(`/members/${member.id}/regenerate-card`, {});
      await fetchMembers();
    } catch (error) {
      console.error('Error regenerating card:', error);
    }
  };

  const handleReissueCard = async (member: Member) => {
    try {
      await api.post(`/members/${member.id}/reissue-card`, {});
      await fetchMembers();
    } catch (error) {
      console.error('Error reissuing card:', error);
    }
  };

  const confirmAction = async (reason?: string) => {
    if (!confirmationAction) return;
    const { type, id } = confirmationAction;
    try {
      if (type === 'RENEW') await api.post(`/members/${id}/renew`, {});
      if (type === 'TRANSFER') await api.post(`/members/${id}/transfer`, { newOrgUnitId: reason });
      if (type === 'SUSPEND') await api.post(`/members/${id}/suspend`, { reason });
      if (type === 'TERMINATE') await api.post(`/members/${id}/terminate`, { reason });
      await fetchMembers();
    } catch (error) {
      console.error(`Error performing ${type}:`, error);
    } finally {
      setConfirmationAction(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Workflow</h1>
          <p className="text-gray-500">Verify and approve new membership applications.</p>
        </div>
        <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg gap-1">
          {['PENDING', 'VERIFIED', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'TERMINATED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${
                filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {showDetailModal && selectedMember && (
        <MemberDetailModal 
          member={selectedMember} 
          onClose={() => setShowDetailModal(false)}
          onVerify={handleVerify}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {showCardModal && selectedMember && (
        <MemberCardModal 
          member={selectedMember} 
          onClose={() => setShowCardModal(false)}
        />
      )}

      {showConfirmationModal && selectedMember && (
        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onConfirm={confirmAction}
          title={`${confirmationAction?.type} Member`}
          message={`Are you sure you want to ${confirmationAction?.type.toLowerCase()} ${selectedMember.fullName}?`}
          showReasonInput={confirmationAction?.type !== 'RENEW'}
        />
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading members...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <MemberTable 
          members={members} 
          onVerify={handleVerify} 
          onApprove={handleApprove} 
          onViewCard={handleViewCard} 
          onRegenerateCard={handleRegenerateCard}
          onReissueCard={handleReissueCard}
          onRenew={handleRenew}
          onTransfer={handleTransfer}
          onSuspend={handleSuspend}
          onTerminate={handleTerminate}
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
        />
      )}
      {editingMember && (
        <MemberEditModal 
          member={editingMember} 
          onClose={() => setEditingMember(null)} 
          onSave={handleSaveEdit} 
        />
      )}
    </div>
  );
};
