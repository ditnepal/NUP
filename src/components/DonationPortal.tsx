import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Heart, TrendingUp, Users, CheckCircle, Shield, CreditCard, Smartphone, Landmark, ArrowRight, Star, Info, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { FundraisingCampaign } from '../types';
import { PaymentMethodSelector } from './ui/PaymentMethodSelector';
import { toast } from 'sonner';

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

  const [donationResult, setDonationResult] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const purchaseOrderId = params.get('purchase_order_id') || params.get('moru_purchase_order_id');
    const method = params.get('method');
    
    if (paymentStatus === 'returned' && purchaseOrderId && method) {
      const amount = params.get('amount');
      
      // We returned from a payment provider. 
      // Call the backend to capture the return parameters
      const captureReturn = async () => {
        try {
          const result = await api.get(`/finance/donations/return/${method.toLowerCase()}?${params.toString()}`);
          setDonationResult(result);
        } catch (error) {
          console.error('Error capturing payment return:', error);
          setDonationResult({ status: 'PENDING', message: 'Return captured locally, but server update failed.' });
        }
      };

      captureReturn();
      
      const parsedAmount = amount ? parseFloat(amount) : NaN;
      if (!isNaN(parsedAmount)) {
        setAmount(parsedAmount);
      }
      setStep('success');
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleDonate = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. If it's a manual method, use the manual flow
      if (selectedMethod.isManual) {
        const result = await api.post('/finance/donations', {
          ...donorInfo,
          amount,
          campaignId: selectedCampaign?.id,
          paymentMethod: selectedMethod.provider,
          referenceId: 'MANUAL_' + Math.random().toString(36).substr(2, 9),
        });
        setDonationResult(result);
        setStep('success');
        return;
      }

      // 2. For Khalti/eSewa, initiate payment
      const returnUrl = `${window.location.origin}${window.location.pathname}?payment_status=returned&amount=${amount}&method=${selectedMethod.provider}`;
      
      const initiation = await api.post('/finance/donations/initiate', {
        ...donorInfo,
        amount,
        campaignId: selectedCampaign?.id,
        paymentMethod: selectedMethod.provider,
        returnUrl,
      });

      // 3. Create the pending donation record in our DB BEFORE redirecting
      // This ensures we have a record of the attempt
      await api.post('/finance/donations', {
        ...donorInfo,
        amount,
        campaignId: selectedCampaign?.id,
        paymentMethod: selectedMethod.provider,
        referenceId: initiation.purchaseOrderId, // Use the same ID
      });

      if (initiation.type === 'REDIRECT') {
        window.location.href = initiation.url;
      } else if (initiation.type === 'FORM') {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = initiation.url;

        Object.entries(initiation.params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else if (initiation.type === 'MANUAL') {
        setDonationResult({ status: 'PENDING', instructions: initiation.instructions });
        setStep('success');
      }
    } catch (error: any) {
      toast.error(`Payment initiation failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') {
    const isPending = donationResult?.status === 'PENDING';
    const isMoru = selectedMethod?.provider === 'MORU' || donationResult?.provider === 'MORU';
    
    return (
      <div className="max-w-3xl mx-auto py-24 text-center px-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 ${
          isPending ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {isPending ? <Info size={48} /> : <CheckCircle size={48} />}
        </div>
        <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">
          {isPending ? 'Verification Pending' : 'Thank You for Your Support!'}
        </h1>
        <div className="text-xl text-gray-500 mb-16 leading-relaxed space-y-6 max-w-2xl mx-auto">
          <p>
            {isPending 
              ? `Your donation of NPR ${amount.toLocaleString()} is currently being processed.`
              : `Your contribution of NPR ${amount.toLocaleString()} has been received. A receipt has been sent to your email.`
            }
          </p>
          {isPending && (
            <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-8 text-sm text-amber-800 text-left shadow-sm">
              <h4 className="font-bold mb-3 flex items-center gap-2 text-base">
                <Shield size={20} /> Honest Accounting Notice
              </h4>
              <p className="mb-6 text-base opacity-90">
                We have recorded your payment attempt. To ensure financial integrity, your donation will remain in <strong>PENDING</strong> status until our finance team verifies the transaction with the provider.
              </p>
              {donationResult?.instructions && (
                <div className="mt-6 pt-6 border-t border-amber-200">
                  <p className="font-bold mb-2 uppercase text-[10px] tracking-widest opacity-60">Next Steps:</p>
                  <p className="whitespace-pre-wrap text-base font-medium">{donationResult.instructions}</p>
                </div>
              )}
              {isMoru && (
                <p className="mt-6 italic opacity-80 text-sm">
                  MORU payments are manually reconciled daily. You will receive a confirmation email once verified.
                </p>
              )}
            </div>
          )}
        </div>
        <button 
          onClick={() => { 
            setStep('browse'); 
            setDonorInfo({ fullName: '', email: '', phone: '', isAnonymous: false }); 
            setDonationResult(null);
            setSelectedMethod(null);
          }}
          className={`px-12 py-6 rounded-2xl font-bold text-xl transition-all shadow-2xl ${
            isPending 
              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-100' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
          }`}
        >
          Back to Fundraisers
        </button>
      </div>
    );
  }

  if (step === 'form' || step === 'payment') {
    return (
      <div className="max-w-6xl mx-auto py-16 px-6">
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => setStep('browse')}
            className="text-emerald-600 hover:text-emerald-700 flex items-center gap-3 font-bold text-lg group"
          >
            <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
            Back to Fundraisers
          </button>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
            <span className={step === 'form' ? 'text-emerald-600' : ''}>Details</span>
            <ChevronRight size={16} />
            <span className={step === 'payment' ? 'text-emerald-600' : ''}>Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          <div className="lg:col-span-2 space-y-10">
            <div className="bg-emerald-50 rounded-[2.5rem] p-10 border border-emerald-100 shadow-sm">
              <h2 className="text-3xl font-black text-emerald-900 mb-6 leading-tight">Support {selectedCampaign?.title || 'General Fund'}</h2>
              <p className="text-emerald-700 text-lg leading-relaxed mb-8 opacity-90">
                Your donation directly funds our grassroots organizing, policy research, and community outreach programs.
              </p>
              <div className="flex items-center gap-4 text-emerald-800 font-bold bg-white/50 p-4 rounded-2xl">
                <Shield size={28} className="text-emerald-600" />
                <span>100% Transparent & Audited</span>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Select Amount</h3>
              <div className="grid grid-cols-3 gap-4">
                {[500, 1000, 5000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`py-5 rounded-2xl font-bold text-xl transition-all border-2 ${
                      amount === val ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-100' : 'bg-white text-gray-600 border-gray-100 hover:border-emerald-200'
                    }`}
                  >
                    NPR {val}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">NPR</span>
                <input 
                  type="number" 
                  value={isNaN(amount) ? '' : amount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAmount(isNaN(val) ? 0 : val);
                  }}
                  className="w-full pl-16 pr-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-emerald-500 outline-none font-bold text-xl transition-all"
                  placeholder="Other Amount"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white rounded-[3rem] border border-gray-200 p-10 shadow-2xl shadow-gray-100">
            {step === 'form' ? (
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Donor Information</h3>
                </div>
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      value={donorInfo.fullName}
                      onChange={(e) => setDonorInfo({ ...donorInfo, fullName: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-emerald-500 outline-none transition-all text-lg"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      value={donorInfo.email}
                      onChange={(e) => setDonorInfo({ ...donorInfo, email: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-emerald-500 outline-none transition-all text-lg"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      value={donorInfo.phone}
                      onChange={(e) => setDonorInfo({ ...donorInfo, phone: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-emerald-500 outline-none transition-all text-lg"
                      placeholder="+977 98XXXXXXXX"
                    />
                  </div>
                  <label className="flex items-center gap-4 cursor-pointer group p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all">
                    <input 
                      type="checkbox" 
                      checked={donorInfo.isAnonymous}
                      onChange={(e) => setDonorInfo({ ...donorInfo, isAnonymous: e.target.checked })}
                      className="w-6 h-6 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-base text-gray-600 group-hover:text-gray-900 transition-colors font-bold">
                      Make my donation anonymous
                    </span>
                  </label>
                </div>
                <button 
                  onClick={() => setStep('payment')}
                  disabled={!donorInfo.fullName || !donorInfo.email}
                  className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-8"
                >
                  Continue to Payment <ArrowRight size={24} />
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Payment Method</h3>
                </div>
                <PaymentMethodSelector 
                  module="FUNDRAISER"
                  selectedMethodId={selectedMethod?.id || null}
                  onSelect={setSelectedMethod}
                />
                <div className="pt-10 border-t border-gray-100 mt-10">
                  <div className="flex justify-between items-center text-2xl font-black text-gray-900 mb-10">
                    <span>Total Amount</span>
                    <span className="text-emerald-600">NPR {amount.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleDonate}
                    disabled={!selectedMethod || isProcessing}
                    className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-100 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : (
                      <>
                        {selectedMethod?.instructions ? 'Complete Donation' : 'Proceed to Payment'} 
                        <Heart size={24} />
                      </>
                    )}
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
    <div className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Heart size={14} fill="currentColor" /> Support Our Movement
          </motion.div>
          <h1 className="text-6xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
            Fuel the Change You Want <br /> to See in Nepal
          </h1>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            Your contributions power our grassroots campaigns, policy research, and community outreach. 
            Every rupee brings us closer to a more transparent and accountable government.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* General Fund Card */}
          <div className="bg-white rounded-[3rem] border border-gray-200 p-12 shadow-sm hover:shadow-2xl transition-all group flex flex-col">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
              <Star size={40} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">General Party Fund</h3>
            <p className="text-gray-500 mb-12 text-lg leading-relaxed flex-1 opacity-80">
              Support our daily operations, staff, and long-term strategic planning. This fund allows us to remain independent and focused on our mission.
            </p>
            <button 
              onClick={() => { setSelectedCampaign(null); setStep('form'); }}
              className="w-full bg-gray-900 text-white py-6 rounded-2xl font-bold text-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              Donate to General Fund <ArrowRight size={24} />
            </button>
          </div>

          {/* Active Campaigns */}
          {campaigns?.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-[3rem] border border-gray-200 p-12 shadow-sm hover:shadow-2xl transition-all group flex flex-col">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                <TrendingUp size={40} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">{campaign.title}</h3>
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-widest">
                  {campaign.fundraiserType?.replace('_', ' ') || 'ACTIVE FUNDRAISER'}
                </span>
                {campaign.beneficiaryType && (
                  <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-widest">
                    {campaign.beneficiaryType} BENEFICIARY
                  </span>
                )}
              </div>
              <p className="text-gray-500 mb-10 text-lg leading-relaxed line-clamp-3 opacity-80">
                {campaign.description}
              </p>
              
              <div className="mb-12 mt-auto bg-slate-50 p-6 rounded-[2rem]">
                <div className="flex justify-between text-sm font-black mb-4">
                  <span className="text-gray-900">{campaign.goalAmount > 0 ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100) : 0}% Raised</span>
                  <span className="text-gray-400">Goal: NPR {campaign.goalAmount.toLocaleString()}</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-700 ease-out" 
                    style={{ width: `${campaign.goalAmount > 0 ? Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>

              <button 
                onClick={() => { setSelectedCampaign(campaign); setStep('form'); }}
                className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald-100"
              >
                Support Fundraiser <ArrowRight size={24} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-16 border-t border-gray-100 pt-20">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
              <Shield size={32} />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Secure Payments</h4>
            <p className="text-gray-500 leading-relaxed">Industry-standard encryption for all transactions.</p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
              <Users size={32} />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Donor Privacy</h4>
            <p className="text-gray-500 leading-relaxed">We never share your personal data with third parties.</p>
          </div>
          <div className="text-center group">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
              <CheckCircle size={32} />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">Tax Deductible</h4>
            <p className="text-gray-500 leading-relaxed">Receive official receipts for tax purposes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
