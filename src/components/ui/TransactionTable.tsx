import React from 'react';
import { Transaction } from '../../types';
import { RefreshCw, Search, CheckCircle, XCircle, User, RefreshCw as RenewalIcon, Heart, Eye } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onRefund: (id: string) => void;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (tx: Transaction) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onRefund, onVerify, onReject, onViewDetails }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500 shadow-sm">
        <Search size={48} className="mx-auto mb-4 opacity-20" />
        <p className="text-lg font-bold text-gray-900">No transactions found</p>
        <p className="text-sm">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
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
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recorded By</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(transactions || []).map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {tx.category === 'MEMBERSHIP_FEE' && <User size={14} className="text-blue-500" />}
                    {tx.category === 'RENEWAL_FEE' && <RenewalIcon size={14} className="text-purple-500" />}
                    {tx.category === 'DONATION' && <Heart size={14} className="text-rose-500" />}
                    <div className="text-sm font-medium text-gray-900">{tx.description || 'No description'}</div>
                    {tx.reconciliationNote?.includes('Captured') && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase tracking-tighter animate-pulse">
                        Evidence
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">{tx.paymentMethod || 'N/A'} • {tx.referenceId || 'No Ref'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">{tx.category || 'OTHER'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} NPR {(tx.amount || 0).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    tx.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                    tx.status === 'PENDING' ? 'bg-blue-50 text-blue-600' :
                    tx.status === 'REFUNDED' ? 'bg-amber-50 text-amber-600' :
                    tx.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {tx.status || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs text-gray-500">{(tx as any).recordedBy?.displayName || 'System'}</div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-3">
                    <button 
                      onClick={() => onViewDetails(tx)} 
                      className={`${tx.status === 'PENDING' && tx.reconciliationNote?.includes('Captured') ? 'text-amber-600' : 'text-gray-400'} hover:text-gray-600 font-bold text-xs flex items-center gap-1`}
                      title="View Details"
                    >
                      <Eye size={14} /> {tx.status === 'PENDING' && tx.reconciliationNote?.includes('Captured') ? 'Review' : 'Details'}
                    </button>
                    {tx.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => onVerify(tx.id)} 
                          className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1"
                          title="Verify Payment"
                        >
                          <CheckCircle size={14} /> Verify
                        </button>
                        <button 
                          onClick={() => onReject(tx.id)} 
                          className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1"
                          title="Reject Payment"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                    {tx.status === 'COMPLETED' && tx.category === 'DONATION' && tx.donation?.id && (
                      <button onClick={() => onRefund(tx.donation.id)} className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1">
                        <RefreshCw size={14} /> Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
