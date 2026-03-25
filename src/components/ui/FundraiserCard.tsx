import React from 'react';
import { Fundraiser } from '../../types';
import { TrendingUp, Users, User, Heart, Shield } from 'lucide-react';

interface FundraiserCardProps {
  fundraiser: Fundraiser;
}

export const FundraiserCard: React.FC<FundraiserCardProps> = ({ fundraiser }) => {
  const getIcon = () => {
    switch(fundraiser.fundraiserType) {
      case 'CANDIDATE_FUND': return <User size={24} />;
      case 'CAUSE_FUND':
      case 'RELIEF_FUND': return <Heart size={24} />;
      case 'PUBLIC_SUPPORT_FUND': return <Users size={24} />;
      default: return <Shield size={24} />;
    }
  };

  const getTypeLabel = () => {
    switch(fundraiser.fundraiserType) {
      case 'CANDIDATE_FUND': return 'Candidate Fund';
      case 'CAUSE_FUND': return 'Cause Fund';
      case 'RELIEF_FUND': return 'Relief Fund';
      case 'PUBLIC_SUPPORT_FUND': return 'Public Support';
      default: return 'Party Fund';
    }
  };

  const progress = fundraiser.goalAmount > 0 
    ? Math.min(((fundraiser.currentAmount || 0) / fundraiser.goalAmount) * 100, 100) 
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
              fundraiser.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
            }`}>
              {fundraiser.status}
            </span>
            <div className="text-xs font-bold text-gray-400 uppercase mt-1 tracking-wider">
              {getTypeLabel()}
            </div>
          </div>
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{fundraiser.title}</h3>
      
      {fundraiser.fundraiserType === 'CANDIDATE_FUND' && fundraiser.candidateSnapshot && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2">
          <User size={16} className="text-blue-500" />
          <span className="text-xs font-bold text-blue-800">
            {fundraiser.candidateSnapshot.name} • {fundraiser.candidateSnapshot.position}
          </span>
        </div>
      )}

      <p className="text-sm text-gray-500 line-clamp-2 mb-6">{fundraiser.description || 'No description provided.'}</p>
      
      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span className="text-gray-500">Progress</span>
          <span className="text-emerald-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase">
          <span>NPR {(fundraiser.currentAmount || 0).toLocaleString()} Verified</span>
          <span>Goal: {fundraiser.goalAmount > 0 ? `NPR ${fundraiser.goalAmount.toLocaleString()}` : 'No Goal'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-400 font-bold uppercase">
          <Users size={14} className="text-gray-300" />
          {fundraiser._count?.donations ?? fundraiser.donationsCount ?? 0} Donations
        </div>
        <button className="text-emerald-600 font-bold text-xs hover:text-emerald-700 transition-colors uppercase tracking-wider">
          Edit Details
        </button>
      </div>
    </div>
  );
};
