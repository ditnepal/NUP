import React from 'react';
import { Transaction } from '../../types';
import { RefreshCw, Search } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onRefund: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onRefund }) => {
  if (transactions.length === 0) {
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
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold">{tx.paymentMethod} • {tx.referenceId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">{tx.category}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} NPR {tx.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    tx.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                    tx.status === 'REFUNDED' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  {tx.status === 'COMPLETED' && tx.category === 'DONATION' && tx.donationId && (
                    <button onClick={() => onRefund(tx.donationId!)} className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1 ml-auto">
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
  );
};
