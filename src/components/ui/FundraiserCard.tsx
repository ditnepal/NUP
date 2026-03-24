import React from 'react';
import { Fundraiser } from '../../types';
import { TrendingUp, Users } from 'lucide-react';

interface FundraiserCardProps {
  fundraiser: Fundraiser;
}

export const FundraiserCard: React.FC<FundraiserCardProps> = ({ fundraiser }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
        <TrendingUp size={24} />
      </div>
      <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
        fundraiser.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
      }`}>
        {fundraiser.status}
      </span>
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{fundraiser.title}</h3>
    <p className="text-sm text-gray-500 line-clamp-2 mb-6">{fundraiser.description}</p>
    
    <div className="mb-6">
      <div className="flex justify-between text-xs font-bold mb-2">
        <span className="text-gray-500">Progress</span>
        <span className="text-emerald-600">{Math.round((fundraiser.currentAmount / fundraiser.goalAmount) * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500" 
          style={{ width: `${Math.min((fundraiser.currentAmount / fundraiser.goalAmount) * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase">
        <span>NPR {fundraiser.currentAmount.toLocaleString()} Raised</span>
        <span>Goal: NPR {fundraiser.goalAmount.toLocaleString()}</span>
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <div className="flex items-center gap-1 text-xs text-gray-400 font-bold uppercase">
        <Users size={14} className="text-gray-300" />
        {fundraiser._count?.donations ?? fundraiser.donationsCount ?? 0} Donors
      </div>
      <button className="text-emerald-600 font-bold text-xs hover:text-emerald-700 transition-colors uppercase tracking-wider">
        Edit Details
      </button>
    </div>
  </div>
);
