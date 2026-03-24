import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Smartphone, Landmark, CreditCard, Loader2, Info } from 'lucide-react';

interface PaymentIntegration {
  id: string;
  provider: string;
  displayName: string;
  region: string;
  mode: string;
  sortOrder: number;
  supportedModules: string[];
  instructions: string | null;
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
      <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl text-center">
        <p className="text-amber-800 font-bold mb-2">No Payment Methods Available</p>
        <p className="text-amber-600 text-sm">Please contact support or try again later.</p>
      </div>
    );
  }

  const getIcon = (provider: string) => {
    if (['KHALTI', 'ESEWA', 'IME_PAY', 'QR_PAYMENT'].includes(provider)) return <Smartphone size={24} />;
    if (['BANK_TRANSFER', 'CASH_RECORD'].includes(provider)) return <Landmark size={24} />;
    return <CreditCard size={24} />;
  };

  return (
    <div className="space-y-4">
      {methods.map((method) => (
        <div key={method.id} className="space-y-3">
          <button 
            type="button"
            onClick={() => onSelect(method)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
              selectedMethodId === method.id 
                ? 'border-emerald-500 bg-emerald-50' 
                : 'border-gray-100 hover:border-emerald-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border ${
                selectedMethodId === method.id 
                  ? 'bg-white text-emerald-600 border-emerald-100' 
                  : 'bg-gray-50 text-gray-400 border-gray-100 group-hover:text-emerald-600'
              }`}>
                {getIcon(method.provider)}
              </div>
              <div className="text-left">
                <p className={`font-bold ${selectedMethodId === method.id ? 'text-emerald-900' : 'text-gray-900'}`}>
                  {method.displayName}
                </p>
                <p className={`text-xs ${selectedMethodId === method.id ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {['BANK_TRANSFER', 'CASH_RECORD'].includes(method.provider) ? 'Manual Verification' : 'Instant Verification'}
                </p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selectedMethodId === method.id ? 'border-emerald-500' : 'border-gray-300'
            }`}>
              {selectedMethodId === method.id && <div className="w-3 h-3 rounded-full bg-emerald-500" />}
            </div>
          </button>
          
          {selectedMethodId === method.id && method.instructions && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 animate-in fade-in slide-in-from-top-2">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-blue-800 whitespace-pre-wrap">
                {method.instructions}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
