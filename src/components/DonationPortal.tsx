import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Heart, TrendingUp, Users, CheckCircle, Shield, CreditCard, Smartphone, Landmark, ArrowRight, Star } from 'lucide-react';
import { FundraisingCampaign } from '../types';
import { PaymentMethodSelector } from './ui/PaymentMethodSelector';

export const DonationPortal: React.FC = () => {
  const [campaigns, setCampaigns] = useState<FundraisingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<FundraisingCampaign | null>(null);
  const [amount, setAmount] = useState<number>(1000);
  const [donorInfo, setDonorInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    isAnonymous: false,
  });
  const [step, setStep] = useState<'browse' | 'form' | 'payment' | 'success'>('browse');
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await api.get('/finance/campaigns');
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching fundraisers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!selectedMethod) {
      alert('Please select a payment method.');
      return;
    }
    try {
      await api.post('/finance/donations', {
        ...donorInfo,
        amount,
        campaignId: selectedCampaign?.id,
        paymentMethod: selectedMethod.provider,
        referenceId: 'MOCK_' + Math.random().toString(36).substr(2, 9),
      });
      setStep('success');
    } catch (error: any) {
      alert(`Donation failed: ${error.message}`);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Thank You for Your Support!</h1>
        <p className="text-xl text-gray-500 mb-12 leading-relaxed">
          Your contribution of NPR {amount.toLocaleString()} has been received. 
          A receipt has been sent to your email.
        </p>
        <button 
          onClick={() => { setStep('browse'); setDonorInfo({ fullName: '', email: '', phone: '', isAnonymous: false }); }}
          className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
        >
          Back to Fundraisers
        </button>
      </div>
    );
  }

  if (step === 'form' || step === 'payment') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <button 
          onClick={() => setStep('browse')}
          className="mb-8 text-emerald-600 hover:underline flex items-center gap-2 font-bold"
        >
          ← Back to Fundraisers
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
              <h2 className="text-2xl font-bold text-emerald-900 mb-4">Support {selectedCampaign?.title || 'General Fund'}</h2>
              <p className="text-emerald-700 leading-relaxed mb-6">
                Your donation directly funds our grassroots organizing, policy research, and community outreach programs.
              </p>
              <div className="flex items-center gap-4 text-emerald-800 font-bold">
                <Shield size={24} />
                <span>100% Transparent & Audited</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Select Amount</h3>
              <div className="grid grid-cols-3 gap-4">
                {[500, 1000, 5000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-4 rounded-2xl font-bold text-lg transition-all border-2 ${
                      amount === val ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white text-gray-600 border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    NPR {val}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">NPR</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-16 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 outline-none font-bold text-lg"
                  placeholder="Other Amount"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-xl shadow-gray-100">
            {step === 'form' ? (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Donor Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={donorInfo.fullName}
                      onChange={(e) => setDonorInfo({ ...donorInfo, fullName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={donorInfo.email}
                      onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      value={donorInfo.phone}
                      onChange={(e) => setDonorInfo({ ...donorInfo, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                      placeholder="+977 98XXXXXXXX"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={donorInfo.isAnonymous}
                      onChange={(e) => setDonorInfo({ ...donorInfo, isAnonymous: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                      Make my donation anonymous
                    </span>
                  </label>
                </div>
                <button 
                  onClick={() => setStep('payment')}
                  disabled={!donorInfo.fullName || !donorInfo.email}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue to Payment <ArrowRight size={20} />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Select Payment Method</h3>
                <PaymentMethodSelector 
                  module="FUNDRAISER"
                  selectedMethodId={selectedMethod?.id || null}
                  onSelect={setSelectedMethod}
                />
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
                    <span>Total Amount</span>
                    <span>NPR {amount.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleDonate}
                    disabled={!selectedMethod}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Donation <Heart size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <Heart size={14} fill="currentColor" /> Support Our Movement
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
            Fuel the Change You Want <br /> to See in Nepal
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Your contributions power our grassroots campaigns, policy research, and community outreach. 
            Every rupee brings us closer to a more transparent and accountable government.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* General Fund Card */}
          <div className="bg-white rounded-[2.5rem] border border-gray-200 p-10 shadow-sm hover:shadow-2xl transition-all group flex flex-col">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[1.25rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Star size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">General Party Fund</h3>
            <p className="text-gray-500 mb-10 leading-relaxed flex-1">
              Support our daily operations, staff, and long-term strategic planning. This fund allows us to remain independent and focused on our mission.
            </p>
            <button 
              onClick={() => { setSelectedCampaign(null); setStep('form'); }}
              className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              Donate to General Fund <ArrowRight size={20} />
            </button>
          </div>

          {/* Active Campaigns */}
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-[2.5rem] border border-gray-200 p-10 shadow-sm hover:shadow-2xl transition-all group flex flex-col">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-[1.25rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <TrendingUp size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{campaign.title}</h3>
              <p className="text-sm text-blue-600 font-bold uppercase tracking-widest mb-6">Active Fundraiser</p>
              <p className="text-gray-500 mb-8 leading-relaxed line-clamp-3">
                {campaign.description}
              </p>
              
              <div className="mb-10 mt-auto">
                <div className="flex justify-between text-sm font-bold mb-3">
                  <span className="text-gray-900">{Math.round((campaign.currentAmount / campaign.goalAmount) * 100)}% Raised</span>
                  <span className="text-gray-400">Goal: NPR {campaign.goalAmount.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <button 
                onClick={() => { setSelectedCampaign(campaign); setStep('form'); }}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100"
              >
                Support Fundraiser <ArrowRight size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-gray-100 pt-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Secure Payments</h4>
            <p className="text-sm text-gray-500">Industry-standard encryption for all transactions.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Donor Privacy</h4>
            <p className="text-sm text-gray-500">We never share your personal data with third parties.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={24} />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Tax Deductible</h4>
            <p className="text-sm text-gray-500">Receive official receipts for tax purposes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
