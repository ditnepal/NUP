import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { usePermissions } from '../../hooks/usePermissions';
import { UserProfile } from '../../types';

interface RenewalsManagementProps {
  user: UserProfile | null;
}

export default function RenewalsManagement({ user }: RenewalsManagementProps) {
  const { can } = usePermissions(user);
  const [renewals, setRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRenewal, setSelectedRenewal] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRenewals = async () => {
    try {
      const data = await api.get('/renewals');
      setRenewals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch renewals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRenewals();
  }, []);

  const handleProcess = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedRenewal) return;
    setProcessing(true);
    try {
      await api.post(`/renewals/${selectedRenewal.id}/process`, { action, adminNote });
      toast.success(`Renewal ${action.toLowerCase()}d successfully`);
      setSelectedRenewal(null);
      setAdminNote('');
      await fetchRenewals();
    } catch (err: any) {
      toast.error(err.message || 'Failed to process renewal');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Renewals Management</h1>
          <p className="text-slate-600">Review and process member renewal requests.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-sm font-semibold text-slate-600">Member</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Member ID</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Current Expiry</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Payment Method</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Requested At</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {renewals.map((renewal) => (
                <tr key={renewal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{renewal.member.fullName}</div>
                    <div className="text-sm text-slate-500">{renewal.member.orgUnit?.name || 'No Unit'}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{renewal.member.membershipId || 'N/A'}</td>
                  <td className="p-4 text-sm text-slate-600">
                    {renewal.member.expiryDate ? format(new Date(renewal.member.expiryDate), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-600 uppercase">
                    {renewal.paymentMethod || 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      renewal.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      renewal.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {renewal.status === 'APPROVED' && <CheckCircle size={14} />}
                      {renewal.status === 'REJECTED' && <XCircle size={14} />}
                      {renewal.status === 'PENDING' && <Clock size={14} />}
                      {renewal.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {format(new Date(renewal.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="p-4">
                    {renewal.status === 'PENDING' && can('MEMBERSHIP', 'UPDATE') && (
                      <button
                        onClick={() => setSelectedRenewal(renewal)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {renewals.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No renewal requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRenewal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Review Renewal Request</h3>
              <button onClick={() => setSelectedRenewal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Member Name</label>
                  <div className="text-slate-900 font-medium">{selectedRenewal.member.fullName}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Member ID</label>
                  <div className="text-slate-900 font-medium">{selectedRenewal.member.membershipId || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Expiry</label>
                  <div className="text-slate-900 font-medium">
                    {selectedRenewal.member.expiryDate ? format(new Date(selectedRenewal.member.expiryDate), 'MMM d, yyyy') : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Org Unit</label>
                  <div className="text-slate-900 font-medium">{selectedRenewal.member.orgUnit?.name || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment Method</label>
                  <div className="text-emerald-600 font-black uppercase">{selectedRenewal.paymentMethod || 'N/A'}</div>
                </div>
              </div>

              {selectedRenewal.memberNote && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Member Note</label>
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700 text-sm">
                    {selectedRenewal.memberNote}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Note (Optional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none h-24"
                  placeholder="Reason for approval/rejection..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleProcess('REJECT')}
                disabled={processing}
                className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-all disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleProcess('APPROVE')}
                disabled={processing}
                className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Approve & Extend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
