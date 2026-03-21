import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DollarSign, TrendingUp, Users, PieChart, Plus, Search, Filter, CheckCircle, Clock, AlertCircle, ArrowUpRight, ArrowDownRight, RefreshCw, FileText } from 'lucide-react';

export const FinanceAdmin: React.FC = () => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'campaigns'>('dashboard');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const data = await api.get('/finance/analytics');
        setAnalytics(data);
      } else if (activeTab === 'transactions') {
        const data = await api.get('/finance/transactions');
        setTransactions(data);
      } else {
        const data = await api.get('/finance/campaigns');
        setAnalytics({ ...analytics, campaigns: data });
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (donationId: string) => {
    const reason = prompt('Reason for refund:');
    if (!reason) return;
    try {
      await api.post(`/finance/donations/${donationId}/refund`, { reason });
      alert('Refund processed successfully');
      fetchData();
    } catch (error: any) {
      alert(`Refund failed: ${error.message}`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance & Fundraising</h1>
          <p className="text-gray-500">Manage party funds, donations, and financial transparency.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus size={20} />
            New Campaign
          </button>
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText size={20} />
            Export Report
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg mb-8 w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'dashboard' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'transactions' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'campaigns' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Campaigns
        </button>
      </div>

      {activeTab === 'dashboard' && analytics && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign size={24} />
                </div>
                <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                  <ArrowUpRight size={14} /> +12%
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500">Total Raised</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">NPR {analytics.totalRaised.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users size={24} />
                </div>
                <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                  <ArrowUpRight size={14} /> +5%
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500">Total Donors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.donorCount}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
                <span className="text-red-600 text-xs font-bold flex items-center gap-1">
                  <ArrowDownRight size={14} /> -2%
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500">Avg. Donation</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">NPR {(analytics.totalRaised / (analytics.donorCount || 1)).toFixed(0)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <PieChart size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.campaigns.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Recent Donations</h2>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {analytics.recentDonations.map((donation: any) => (
                  <div key={donation.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{donation.donor.fullName}</p>
                        <p className="text-xs text-gray-500">{donation.campaign?.title || 'General Fund'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">+ NPR {donation.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">{new Date(donation.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">Campaign Performance</h2>
                <button 
                  onClick={() => setActiveTab('campaigns')}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  Manage
                </button>
              </div>
              <div className="p-6 space-y-6">
                {analytics.campaigns.map((campaign: any) => (
                  <div key={campaign.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-bold text-gray-900">{campaign.title}</span>
                      <span className="text-gray-500">
                        NPR {campaign.currentAmount.toLocaleString()} / {campaign.goalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-500" 
                        style={{ width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">{tx.paymentMethod} • {tx.referenceId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'} NPR {tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        tx.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                        tx.status === 'REFUNDED' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {tx.donation && tx.status === 'COMPLETED' && (
                        <button 
                          onClick={() => handleRefund(tx.donation.id)}
                          className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1 ml-auto"
                        >
                          <RefreshCw size={14} /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {analytics?.campaigns.map((campaign: any) => (
            <div key={campaign.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  campaign.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                }`}>
                  {campaign.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{campaign.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-6">{campaign.description}</p>
              
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-emerald-600">{Math.round((campaign.currentAmount / campaign.goalAmount) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase">
                  <span>NPR {campaign.currentAmount.toLocaleString()} Raised</span>
                  <span>Goal: NPR {campaign.goalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users size={14} />
                  {campaign._count.donations} Donors
                </div>
                <button className="text-emerald-600 font-bold text-sm hover:underline">
                  Edit Campaign
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
