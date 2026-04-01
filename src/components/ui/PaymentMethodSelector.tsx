import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Smartphone, Landmark, CreditCard, Loader2, Info } from 'lucide-react';

interface PaymentIntegration {
  id: string;
  provider: string;
  displayName: string;
  region: string;
  mode: 'TEST' | 'LIVE';
  sortOrder: number;
  supportedModules: string[];
  instructions: string | null;
  isManual: boolean;
}

interface PaymentMethodSelectorProps {
  module: 'MEMBERSHIP' | 'RENEWALS' | 'FUNDRAISER';
  selectedMethodId: string | null;
  onSelect: (method: PaymentIntegration) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ module, selectedMethodId, onSelect }) => {
  const [methods, setMethods] = useState<PaymentIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const data = await api.get(`/finance/integrations/public?module=${module}`);
        setMethods(data);
      } catch (err: any) {
        setError('Failed to load payment methods.');
      } finally {
        setLoading(false);
      }
    };
    fetchMethods();
  }, [module]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
        {error}
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="p-8 bg-gray-50 border border-gray-100 rounded-[2rem] text-center">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Landmark size={32} />
        </div>
        <p className="text-gray-900 font-bold mb-1">No Payment Methods Available</p>
        <p className="text-gray-500 text-sm">Please contact support or try again later.</p>
      </div>
    );
  }

  const getIcon = (provider: string) => {
    const p = provider.toUpperCase();
    if (['KHALTI', 'ESEWA', 'MORU', 'IME_PAY', 'QR_PAYMENT'].includes(p)) return <Smartphone size={24} />;
    if (['BANK_TRANSFER', 'CASH_RECORD', 'MANUAL'].includes(p)) return <Landmark size={24} />;
    return <CreditCard size={24} />;
  };

  return (
    <div className="space-y-4">
      {methods?.map((method) => (
        <div key={method.id} className="space-y-3">
          <button 
            type="button"
            onClick={() => onSelect(method)}
            className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all group relative overflow-hidden ${
              selectedMethodId === method.id 
                ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-50' 
                : 'border-gray-100 hover:border-emerald-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border transition-colors ${
                selectedMethodId === method.id 
                  ? 'bg-white text-emerald-600 border-emerald-100' 
                  : 'bg-gray-50 text-gray-400 border-gray-100 group-hover:text-emerald-600'
              }`}>
                {getIcon(method.provider)}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`font-bold text-lg ${selectedMethodId === method.id ? 'text-emerald-900' : 'text-gray-900'}`}>
                    {method.displayName}
                  </p>
                  {method.mode === 'TEST' && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-black rounded uppercase tracking-tighter">
                      Test Mode
                    </span>
                  )}
                </div>
                <p className={`text-xs font-medium ${selectedMethodId === method.id ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {method.isManual ? 'Manual Verification Required' : 'Automated Processing'}
                </p>
              </div>
            </div>
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
              selectedMethodId === method.id ? 'border-emerald-500 bg-emerald-500 scale-110' : 'border-gray-200'
            }`}>
              {selectedMethodId === method.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
            </div>
          </button>
          
          {selectedMethodId === method.id && method.instructions && (
            <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4 animate-in fade-in slide-in-from-top-2">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">Payment Instructions</p>
                <div className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">
                  {method.instructions}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
