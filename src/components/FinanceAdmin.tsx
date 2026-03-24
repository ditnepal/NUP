import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { DollarSign, TrendingUp, Users, PieChart, FileText, Search, RefreshCw, Smartphone, Landmark, Plus, Edit2, Trash2, CheckCircle, XCircle, Globe, Settings } from 'lucide-react';
import { StatCard } from './ui/StatCard';
import { TransactionTable } from './ui/TransactionTable';
import { FinanceAnalytics, Transaction, PaymentIntegration } from '../types';

export const FinanceAdmin: React.FC = () => {
  const [analytics, setAnalytics] = useState<FinanceAnalytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [integrations, setIntegrations] = useState<PaymentIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'integrations'>('overview');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<PaymentIntegration | null>(null);
  const [formData, setFormData] = useState({
    provider: 'KHALTI',
    displayName: '',
    region: 'NEPAL',
    enabled: true,
    mode: 'TEST',
    sortOrder: 0,
    supportedModules: [] as string[],
    instructions: '',
    publicKey: '',
    secretRef: '',
    metadata: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const data = await api.get('/finance/analytics');
        setAnalytics(data);
      } else if (activeTab === 'transactions') {
        const data = await api.get('/finance/transactions');
        setTransactions(data);
      } else if (activeTab === 'integrations') {
        const data = await api.get('/finance/integrations');
        setIntegrations(data);
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab, fetchData]);

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

  const handleVerify = async (id: string) => {
    if (!confirm('Are you sure you want to verify this payment?')) return;
    try {
      await api.post(`/finance/transactions/${id}/verify`, {});
      alert('Payment verified successfully');
      fetchData();
    } catch (error: any) {
      alert(`Verification failed: ${error.message}`);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await api.post(`/finance/transactions/${id}/reject`, { reason });
      alert('Payment rejected');
      fetchData();
    } catch (error: any) {
      alert(`Rejection failed: ${error.message}`);
    }
  };

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingIntegration) {
        await api.patch(`/finance/integrations/${editingIntegration.id}`, formData);
      } else {
        await api.post('/finance/integrations', formData);
      }
      setShowModal(false);
      setEditingIntegration(null);
      fetchData();
    } catch (error: any) {
      alert(`Error saving integration: ${error.message}`);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    try {
      await api.delete(`/finance/integrations/${id}`);
      fetchData();
    } catch (error: any) {
      alert(`Error deleting integration: ${error.message}`);
    }
  };

  const toggleIntegrationStatus = async (integration: PaymentIntegration) => {
    try {
      await api.patch(`/finance/integrations/${integration.id}`, { enabled: !integration.enabled });
      fetchData();
    } catch (error: any) {
      alert(`Error toggling status: ${error.message}`);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.description.toLowerCase().includes(transactionSearch.toLowerCase()) ||
    tx.category.toLowerCase().includes(transactionSearch.toLowerCase()) ||
    tx.referenceId.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  const openModal = (integration?: PaymentIntegration) => {
    if (integration) {
      setEditingIntegration(integration);
      setFormData({
        provider: integration.provider,
        displayName: integration.displayName,
        region: integration.region,
        enabled: integration.enabled,
        mode: integration.mode,
        sortOrder: integration.sortOrder,
        supportedModules: integration.supportedModules,
        instructions: integration.instructions || '',
        publicKey: integration.publicKey || '',
        secretRef: integration.secretRef || '',
        metadata: integration.metadata || '',
      });
    } else {
      setEditingIntegration(null);
      setFormData({
        provider: 'KHALTI',
        displayName: '',
        region: 'NEPAL',
        enabled: true,
        mode: 'TEST',
        sortOrder: 0,
        supportedModules: ['FUNDRAISER'],
        instructions: '',
        publicKey: '',
        secretRef: '',
        metadata: '',
      });
    }
    setShowModal(true);
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financial Oversight</h1>
          <p className="text-gray-500 mt-1">Consolidated view of all party finances, transactions, and payment integrations.</p>
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
            disabled
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
            title="Export functionality coming soon"
          >
            <FileText size={20} /> Export Report (Soon)
          </button>
        </div>
      </div>

      <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8 w-full md:w-fit overflow-x-auto no-scrollbar shadow-inner border border-gray-200">
        {(['overview', 'transactions', 'integrations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 md:flex-none px-8 py-2.5 rounded-lg text-sm font-bold transition-all capitalize whitespace-nowrap tracking-wide ${
              activeTab === tab 
                ? 'bg-white text-emerald-600 shadow-md ring-1 ring-black/5' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-gray-900">Loading Finance Data</p>
          <p className="text-sm">Please wait while we fetch the latest records...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && analytics && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Collections" value={`NPR ${analytics.totalCollections.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" trend={{ value: '+15%', positive: true }} />
                <StatCard label="Membership Fees" value={`NPR ${analytics.membershipCollections.toLocaleString()}`} icon={Users} color="text-blue-600" bg="bg-blue-50" />
                <StatCard label="Renewal Fees" value={`NPR ${analytics.renewalCollections.toLocaleString()}`} icon={RefreshCw} color="text-purple-600" bg="bg-purple-50" />
                <StatCard label="Fundraiser Donations" value={`NPR ${analytics.fundraiserCollections.toLocaleString()}`} icon={TrendingUp} color="text-amber-600" bg="bg-amber-50" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Module-wise Money Breakdown</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-900">Membership Collections</span>
                        <span className="text-sm font-bold text-emerald-600">NPR {analytics.membershipCollections.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${analytics.totalCollections > 0 ? (analytics.membershipCollections / analytics.totalCollections) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-900">Renewal Collections</span>
                        <span className="text-sm font-bold text-emerald-600">NPR {analytics.renewalCollections.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-500" 
                          style={{ width: `${analytics.totalCollections > 0 ? (analytics.renewalCollections / analytics.totalCollections) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-900">Fundraiser Collections</span>
                        <span className="text-sm font-bold text-emerald-600">NPR {analytics.fundraiserCollections.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-500" 
                          style={{ width: `${analytics.totalCollections > 0 ? (analytics.fundraiserCollections / analytics.totalCollections) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Refund Visibility</h3>
                  <div className="flex flex-col items-center justify-center h-full pb-6">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                      <RefreshCw size={32} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">NPR {analytics.refundTotal.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total Refunded ({analytics.refundCount} cases)</p>
                    <button 
                      onClick={() => setActiveTab('transactions')}
                      className="mt-6 text-xs font-bold text-red-600 hover:underline"
                    >
                      Audit Refund Logs
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Financial Controls</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className="flex items-center gap-4 p-4 bg-purple-50 text-purple-700 rounded-2xl hover:bg-purple-100 transition-all hover:scale-[1.02] active:scale-95 text-left group"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Audit Transactions</p>
                      <p className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Review all logs</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => alert('Manual transaction recording coming soon')}
                    className="flex items-center gap-4 p-4 bg-blue-50 text-blue-700 rounded-2xl hover:bg-blue-100 transition-all hover:scale-[1.02] active:scale-95 text-left group"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Record Transaction</p>
                      <p className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Manual entry</p>
                    </div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('integrations')}
                    className="flex items-center gap-4 p-4 bg-amber-50 text-amber-700 rounded-2xl hover:bg-amber-100 transition-all hover:scale-[1.02] active:scale-95 text-left group"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <RefreshCw size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Payment Gateways</p>
                      <p className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Khalti, eSewa, Bank</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions List */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                    <button onClick={() => setActiveTab('transactions')} className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
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
                            <p className="text-[10px] text-gray-400">{donation.paymentMethod || 'N/A'} • {new Date(donation.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-gray-500">
                        <DollarSign size={40} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No recent transactions</p>
                        <p className="text-xs">New transactions will appear here.</p>
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

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={transactionSearch}
                    onChange={(e) => setTransactionSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
              <TransactionTable 
                transactions={filteredTransactions} 
                onRefund={handleRefund} 
                onVerify={handleVerify}
                onReject={handleReject}
              />
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
                <div>
                  <h2 className="text-lg font-bold text-emerald-900 mb-2">Payment Integrations</h2>
                  <p className="text-emerald-700">Manage how the party receives digital payments across all modules (Membership, Renewals, Fundraisers).</p>
                </div>
                <button 
                  onClick={() => openModal()}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                >
                  <Plus size={20} /> Add Integration
                </button>
              </div>

              {integrations.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 shadow-sm">
                  <Settings size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-bold text-gray-900">No integrations configured</p>
                  <p className="text-sm">Click "Add Integration" to set up your first payment gateway.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {integrations.map((integration) => (
                    <div key={integration.id} className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm relative overflow-hidden transition-all hover:shadow-md ${!integration.enabled ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${integration.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {['KHALTI', 'ESEWA', 'IME_PAY', 'QR_PAYMENT', 'CASH_RECORD', 'BANK_TRANSFER'].includes(integration.provider) ? <Smartphone size={24} /> : <Landmark size={24} />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${integration.mode === 'LIVE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {integration.mode}
                          </span>
                          <button 
                            onClick={() => toggleIntegrationStatus(integration)}
                            className={`p-1.5 rounded-lg transition-colors ${integration.enabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}
                            title={integration.enabled ? 'Disable' : 'Enable'}
                          >
                            {integration.enabled ? <CheckCircle size={18} /> : <XCircle size={18} />}
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900">{integration.displayName}</h3>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">{integration.provider} • {integration.region}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {integration.supportedModules.map(module => (
                          <span key={module} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase tracking-tighter">
                            {module}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-6">
                        <button 
                          onClick={() => openModal(integration)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors"
                        >
                          <Edit2 size={16} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteIntegration(integration.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-8">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">{editingIntegration ? 'Edit Integration' : 'Add New Integration'}</h2>
                          <p className="text-gray-500 text-sm">Configure payment gateway settings and availability.</p>
                        </div>
                        <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <XCircle size={24} className="text-gray-400" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveIntegration} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Provider Type</label>
                            <select 
                              value={formData.provider}
                              onChange={(e) => setFormData({...formData, provider: e.target.value})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                            >
                              <option value="KHALTI">Khalti</option>
                              <option value="ESEWA">eSewa</option>
                              <option value="IME_PAY">IME Pay</option>
                              <option value="BANK_TRANSFER">Bank Transfer</option>
                              <option value="QR_PAYMENT">QR Payment</option>
                              <option value="CASH_RECORD">Cash Record</option>
                              <option value="STRIPE">Stripe</option>
                              <option value="PAYPAL">PayPal</option>
                              <option value="RAZORPAY">Razorpay</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Display Name</label>
                            <input 
                              type="text"
                              required
                              placeholder="e.g. Khalti Wallet"
                              value={formData.displayName}
                              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Region</label>
                            <select 
                              value={formData.region}
                              onChange={(e) => setFormData({...formData, region: e.target.value as any})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                            >
                              <option value="NEPAL">Nepal</option>
                              <option value="INDIA">India</option>
                              <option value="INTERNATIONAL">International</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mode</label>
                            <select 
                              value={formData.mode}
                              onChange={(e) => setFormData({...formData, mode: e.target.value as any})}
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900"
                            >
                              <option value="TEST">Test Mode</option>
                              <option value="LIVE">Live Mode</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Supported Modules</label>
                          <div className="flex flex-wrap gap-3">
                            {['MEMBERSHIP', 'RENEWALS', 'FUNDRAISER'].map(module => (
                              <label key={module} className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                  type="checkbox"
                                  checked={formData.supportedModules.includes(module)}
                                  onChange={(e) => {
                                    const newModules = e.target.checked 
                                      ? [...formData.supportedModules, module]
                                      : formData.supportedModules.filter(m => m !== module);
                                    setFormData({...formData, supportedModules: newModules});
                                  }}
                                  className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-600 transition-colors">{module}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Public Key / Merchant ID (Optional)</label>
                          <input 
                            type="text"
                            placeholder="e.g. live_pub_..."
                            value={formData.publicKey}
                            onChange={(e) => setFormData({...formData, publicKey: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Secret Reference (Env Key Name)</label>
                          <input 
                            type="text"
                            placeholder="e.g. KHALTI_SECRET_KEY"
                            value={formData.secretRef}
                            onChange={(e) => setFormData({...formData, secretRef: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
                          />
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Note: This should be the name of the environment variable, not the actual secret.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">User Instructions (Optional)</label>
                          <textarea 
                            rows={3}
                            placeholder="Instructions shown to users during checkout..."
                            value={formData.instructions}
                            onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                          />
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button 
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                          >
                            {editingIntegration ? 'Update Integration' : 'Create Integration'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
