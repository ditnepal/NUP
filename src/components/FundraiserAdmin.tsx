import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Users, Plus, FileText, RefreshCw, DollarSign, PieChart } from 'lucide-react';
import { FundraiserCard } from './ui/FundraiserCard';
import { StatCard } from './ui/StatCard';
import { Fundraiser, FinanceAnalytics } from '../types';

export const FundraiserAdmin: React.FC = () => {
  const [analytics, setAnalytics] = useState<FinanceAnalytics | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'manage'>('overview');
  const [isFundraiserModalOpen, setIsFundraiserModalOpen] = useState(false);
  const [newFundraiser, setNewFundraiser] = useState({
    title: '',
    description: '',
    fundraiserType: 'PARTY_FUND',
    beneficiaryType: 'PARTY',
    candidateId: '',
    goalAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsData, candidateData] = await Promise.all([
        api.get('/finance/analytics'),
        api.get('/candidates')
      ]);
      setAnalytics(analyticsData);
      setCandidates(candidateData);
    } catch (error) {
      console.error('Error fetching fundraiser data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateFundraiser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...newFundraiser,
        candidateId: newFundraiser.fundraiserType === 'CANDIDATE_FUND' && newFundraiser.candidateId 
          ? newFundraiser.candidateId 
          : undefined
      };
      await api.post('/finance/campaigns', payload);
      alert('Fundraiser created successfully');
      setIsFundraiserModalOpen(false);
      setNewFundraiser({
        title: '',
        description: '',
        fundraiserType: 'PARTY_FUND',
        beneficiaryType: 'PARTY',
        candidateId: '',
        goalAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
      fetchData();
    } catch (error: any) {
      alert(`Failed to create fundraiser: ${error.message}`);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fundraiser Management</h1>
          <p className="text-gray-500 mt-1">Manage donation campaigns, track progress, and support candidates or causes.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={fetchData}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => setIsFundraiserModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-bold"
          >
            <Plus size={20} /> New Fundraiser
          </button>
          <button 
            disabled
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
            title="Export functionality coming soon"
          >
            <FileText size={20} /> Export Report (Soon)
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8 w-full md:w-fit overflow-x-auto no-scrollbar shadow-inner border border-gray-200">
        {(['overview', 'manage'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-lg text-sm font-bold transition-all capitalize whitespace-nowrap tracking-wide ${
              activeTab === tab 
                ? 'bg-white text-emerald-600 shadow-md ring-1 ring-black/5' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            {tab === 'manage' ? 'Manage Campaigns' : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-gray-900">Loading Fundraisers</p>
          <p className="text-sm">Please wait while we fetch the latest campaigns...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && analytics && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Raised" value={`NPR ${analytics.totalRaised.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" trend={{ value: '+12%', positive: true }} />
                <StatCard label="Total Donors" value={analytics.donorCount} icon={Users} color="text-blue-600" bg="bg-blue-50" trend={{ value: '+5%', positive: true }} />
                <StatCard label="Avg. Donation" value={`NPR ${(analytics.totalRaised / (analytics.donorCount || 1)).toFixed(0)}`} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" trend={{ value: '-2%', positive: false }} />
                <StatCard label="Active Fundraisers" value={analytics.campaigns.length} icon={PieChart} color="text-amber-600" bg="bg-amber-50" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Donations List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Recent Donations</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {analytics.recentDonations.length > 0 ? (
                      analytics.recentDonations.map((donation: any) => (
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
                      ))
                    ) : (
                      <div className="p-12 text-center text-gray-500">
                        <DollarSign size={40} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No recent donations</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fundraiser Progress Summary */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Fundraiser Progress</h2>
                  </div>
                  <div className="p-6 space-y-6">
                    {analytics.campaigns.length > 0 ? (
                      analytics.campaigns.map((fundraiser) => (
                        <div key={fundraiser.id}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="font-bold text-gray-900">{fundraiser.title}</span>
                            <span className="text-gray-500">NPR {fundraiser.currentAmount.toLocaleString()} / {fundraiser.goalAmount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min((fundraiser.currentAmount / fundraiser.goalAmount) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-gray-500">
                        <TrendingUp size={40} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No active fundraisers</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <button 
                onClick={() => setIsFundraiserModalOpen(true)}
                className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors mb-4">
                  <Plus size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Create New Fundraiser</h3>
                <p className="text-sm text-gray-500 mt-2">Start a new fundraising drive for the party, candidate, or cause.</p>
              </button>
              {analytics?.campaigns.map((fundraiser) => (
                <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
              ))}
            </div>
          )}
        </>
      )}

      {isFundraiserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Create New Fundraiser</h2>
              <button onClick={() => setIsFundraiserModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <form onSubmit={handleCreateFundraiser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Fundraiser Type</label>
                  <select 
                    value={newFundraiser.fundraiserType}
                    onChange={(e) => {
                      const type = e.target.value;
                      let beneficiary = 'PARTY';
                      if (type === 'CANDIDATE_FUND') beneficiary = 'CANDIDATE';
                      if (type === 'CAUSE_FUND') beneficiary = 'PUBLIC';
                      if (type === 'RELIEF_FUND') beneficiary = 'COMMUNITY';
                      if (type === 'PUBLIC_SUPPORT_FUND') beneficiary = 'PUBLIC';
                      setNewFundraiser({ ...newFundraiser, fundraiserType: type, beneficiaryType: beneficiary });
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="PARTY_FUND">Party Fund</option>
                    <option value="CANDIDATE_FUND">Candidate Fund</option>
                    <option value="CAUSE_FUND">Cause/Public Fund</option>
                    <option value="RELIEF_FUND">Relief Fund</option>
                    <option value="PUBLIC_SUPPORT_FUND">Public Support Fund</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Beneficiary</label>
                  <select 
                    disabled
                    value={newFundraiser.beneficiaryType}
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed"
                  >
                    <option value="PARTY">Party</option>
                    <option value="CANDIDATE">Candidate</option>
                    <option value="PUBLIC">Public</option>
                    <option value="COMMUNITY">Community</option>
                  </select>
                </div>
              </div>

              {newFundraiser.fundraiserType === 'CANDIDATE_FUND' && (
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Select Candidate</label>
                  <select 
                    required
                    value={newFundraiser.candidateId}
                    onChange={(e) => setNewFundraiser({ ...newFundraiser, candidateId: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Choose a candidate...</option>
                    {candidates.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - {c.position}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Fundraiser Title</label>
                <input 
                  required
                  value={newFundraiser.title}
                  onChange={(e) => setNewFundraiser({ ...newFundraiser, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                  placeholder="e.g. Party Headquarters Fund"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  value={newFundraiser.description}
                  onChange={(e) => setNewFundraiser({ ...newFundraiser, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24"
                  placeholder="Describe the purpose of this fundraiser..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Goal Amount (NPR)</label>
                  <input
                    required
                    type="number"
                    value={newFundraiser.goalAmount}
                    onChange={(e) => setNewFundraiser({ ...newFundraiser, goalAmount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                  <input
                    required
                    type="date"
                    value={newFundraiser.startDate}
                    onChange={(e) => setNewFundraiser({ ...newFundraiser, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  value={newFundraiser.endDate}
                  onChange={(e) => setNewFundraiser({ ...newFundraiser, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFundraiserModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold"
                >
                  Create Fundraiser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
