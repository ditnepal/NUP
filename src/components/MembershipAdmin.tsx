import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Member, UserProfile } from '../types';
import { MemberTable } from './MemberTable';
import { MemberEditModal } from './MemberEditModal';
import { MemberDetailModal } from './MemberDetailModal';
import { MemberCardModal } from './MemberCardModal';
import { ConfirmationModal } from './ConfirmationModal';
import { Users, UserPlus, RefreshCw, CreditCard, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

interface MembershipAdminProps {
  user: UserProfile | null;
}

export const MembershipAdmin: React.FC<MembershipAdminProps> = ({ user }) => {
  const { can } = usePermissions(user);
  
  const availableTabs = [
    { id: 'overview', permission: { module: 'MEMBERSHIP', action: 'VIEW' } },
    { id: 'intake', permission: { module: 'MEMBERSHIP', action: 'APPROVE' } },
    { id: 'members', permission: { module: 'MEMBERSHIP', action: 'VIEW' } },
    { id: 'renewals', permission: { module: 'MEMBERSHIP', action: 'UPDATE' } },
  ].filter(tab => can(tab.permission.module as any, tab.permission.action as any));

  const [activeTab, setActiveTab] = useState<'overview' | 'intake' | 'members' | 'renewals'>(
    (availableTabs[0]?.id as any) || 'overview'
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [escalationFilter, setEscalationFilter] = useState<'ALL' | 'ESCALATED' | 'LOCAL'>('ALL');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<{ type: string; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchMetrics();
    } else if (activeTab === 'intake' || activeTab === 'members') {
      fetchMembers();
    } else if (activeTab === 'renewals') {
      fetchRenewals();
    }
  }, [activeTab, filter, unitFilter]);

  const fetchUnits = async () => {
    try {
      const data = await api.get('/hierarchy');
      setUnits(data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.get('/members/dashboard/metrics');
      setMetrics(data);
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      setError(error.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentFilter = activeTab === 'intake' ? 'PENDING' : filter === 'PENDING' ? 'ACTIVE' : filter;
      let url = `/members?status=${currentFilter}`;
      if (unitFilter) {
        url += `&unitId=${unitFilter}`;
      }
      if (escalationFilter === 'ESCALATED') {
        url += `&isEscalated=true`;
      } else if (escalationFilter === 'LOCAL') {
        url += `&isEscalated=false`;
      }
      const data = await api.get(url);
      setMembers(data);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      setError(error.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const fetchRenewals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/renewals');
      setRenewals(data);
    } catch (error: any) {
      console.error('Error fetching renewals:', error);
      setError(error.message || 'Failed to fetch renewals');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRenewal = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await api.post(`/renewals/${id}/process`, { action });
      await fetchRenewals();
    } catch (error: any) {
      alert(`Failed to process renewal: ${error.message}`);
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

  const handleVerify = async (id: string, note?: string) => {
    try {
      await api.post(`/members/${id}/verify`, { note });
      await fetchMembers();
    } catch (error) {
      console.error('Error verifying member:', error);
    }
  };

  const handleApprove = async (id: string, note?: string) => {
    try {
      await api.post(`/members/${id}/approve`, { note });
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

  const handleEscalate = async (id: string, note?: string) => {
    try {
      await api.post(`/members/${id}/escalate`, { note });
      await fetchMembers();
    } catch (error) {
      console.error('Error escalating member:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Membership Management</h1>
          <p className="text-gray-500">Manage member intake, records, and renewals.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Users, permission: { module: 'MEMBERSHIP', action: 'VIEW' } },
            { id: 'intake', label: 'Applications', icon: UserPlus, permission: { module: 'MEMBERSHIP', action: 'APPROVE' } },
            { id: 'members', label: 'Active Members', icon: ShieldAlert, permission: { module: 'MEMBERSHIP', action: 'VIEW' } },
            { id: 'renewals', label: 'Renewals', icon: RefreshCw, permission: { module: 'MEMBERSHIP', action: 'UPDATE' } },
          ].filter(tab => can(tab.permission.module as any, tab.permission.action as any)).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'members') setFilter('ACTIVE');
                }}
                className={`flex items-center px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {(activeTab === 'intake' || activeTab === 'members') && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">Unit:</span>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Accessible Units</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.level})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Pending Applications</h3>
                <UserPlus className="text-blue-500 w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalPending}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Active Members</h3>
                <Users className="text-emerald-500 w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalActive}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Pending Renewals</h3>
                <RefreshCw className="text-amber-500 w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.pendingRenewals}</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Inactive/Suspended</h3>
                <ShieldAlert className="text-red-500 w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalInactive}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-blue-800 font-medium">Membership Collections</h3>
                <CreditCard className="text-blue-500 w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-blue-900">Rs. {metrics.membershipCollections.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-2">Total fees collected from new members</p>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-emerald-800 font-medium">Renewal Collections</h3>
                <RefreshCw className="text-emerald-500 w-6 h-6" />
              </div>
              <p className="text-3xl font-bold text-emerald-900">Rs. {metrics.renewalCollections.toLocaleString()}</p>
              <p className="text-sm text-emerald-600 mt-2">Total fees collected from renewals</p>
            </div>
          </div>
        </div>
      )}

      {/* Intake Tab */}
      {activeTab === 'intake' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Applications</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading applications...</div>
          ) : (
            <MemberTable 
              members={members} 
              user={user}
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
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Member Directory</h2>
            <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
              {['ACTIVE', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'TERMINATED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'
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
              user={user}
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
        </div>
      )}

      {/* Renewals Tab */}
      {activeTab === 'renewals' && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Renewal Requests</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading renewals...</div>
          ) : renewals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No renewal requests</h3>
              <p className="text-gray-500">There are currently no pending renewal requests.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {renewals.map((renewal) => (
                    <tr key={renewal.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{renewal.member.fullName}</div>
                        <div className="text-sm text-gray-500">{renewal.member.membershipId || 'No ID'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(renewal.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renewal.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          renewal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          (renewal.status === 'APPROVED' || renewal.status === 'COMPLETED') ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {renewal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {renewal.status === 'PENDING' && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleProcessRenewal(renewal.id, 'APPROVE')}
                              className="text-emerald-600 hover:text-emerald-900 flex items-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </button>
                            <button
                              onClick={() => handleProcessRenewal(renewal.id, 'REJECT')}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showDetailModal && selectedMember && (
        <MemberDetailModal 
          member={selectedMember} 
          user={user}
          onClose={() => setShowDetailModal(false)}
          onVerify={handleVerify}
          onApprove={handleApprove}
          onReject={handleReject}
          onEscalate={handleEscalate}
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
          message={`Are you sure you want to ${confirmationAction?.type?.toLowerCase()} ${selectedMember.fullName}?`}
          showReasonInput={confirmationAction?.type !== 'RENEW'}
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
