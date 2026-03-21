import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { DollarSign, TrendingUp, Users, PieChart, Plus, FileText } from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { TransactionTable } from './ui/TransactionTable';
import { CampaignCard } from './ui/CampaignCard';
import { FinanceAnalytics, Transaction } from '../types';

export const FinanceAdmin: React.FC = () => {
  const [analytics, setAnalytics] = useState<FinanceAnalytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
        setAnalytics({ ...analytics!, campaigns: data });
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
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance & Fundraising</h1>
          <p className="text-gray-500">Manage party funds, donations, and financial transparency.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus size={20} /> New Campaign
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText size={20} /> Export Report
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg mb-8 w-full md:w-fit overflow-x-auto">
        {(['dashboard', 'transactions', 'campaigns'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all capitalize ${
              activeTab === tab ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading...</div>
      ) : (
        <>
          {activeTab === 'dashboard' && analytics && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Raised" value={`NPR ${analytics.totalRaised.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" trend={{ value: '+12%', positive: true }} />
                <StatCard label="Total Donors" value={analytics.donorCount} icon={Users} color="text-blue-600" bg="bg-blue-50" trend={{ value: '+5%', positive: true }} />
                <StatCard label="Avg. Donation" value={`NPR ${(analytics.totalRaised / (analytics.donorCount || 1)).toFixed(0)}`} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" trend={{ value: '-2%', positive: false }} />
                <StatCard label="Active Campaigns" value={analytics.campaigns.length} icon={PieChart} color="text-amber-600" bg="bg-amber-50" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Donations List - Could be another component */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Recent Donations</h2>
                    <button onClick={() => setActiveTab('transactions')} className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {analytics.recentDonations.map((donation: any) => (
                      <div key={donation.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"><Users size={20} /></div>
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

                {/* Campaign Performance */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Campaign Performance</h2>
                    <button onClick={() => setActiveTab('campaigns')} className="text-xs font-bold text-emerald-600 hover:underline">Manage</button>
                  </div>
                  <div className="p-6 space-y-6">
                    {analytics.campaigns.map((campaign) => (
                      <div key={campaign.id}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-bold text-gray-900">{campaign.title}</span>
                          <span className="text-gray-500">NPR {campaign.currentAmount.toLocaleString()} / {campaign.goalAmount.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <TransactionTable transactions={transactions} onRefund={handleRefund} />
          )}

          {activeTab === 'campaigns' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {analytics?.campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
