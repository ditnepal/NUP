import React from 'react';
import { Campaign } from '../../types';
import { TrendingUp, Users } from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
        <TrendingUp size={24} />
      </div>
      <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
        campaign.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
      }`}>
        {campaign.status}
      </span>
    </div>
    <h3 className="text-lg font-bold text-gray-900 mb-2">{campaign.title}</h3>
    <p className="text-sm text-gray-500 line-clamp-2 mb-6">{campaign.description}</p>
    
    <div className="mb-6">
      <div className="flex justify-between text-xs font-bold mb-2">
        <span className="text-gray-500">Progress</span>
        <span className="text-emerald-600">{Math.round((campaign.currentAmount / campaign.goalAmount) * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500" 
          style={{ width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-bold uppercase">
        <span>NPR {campaign.currentAmount.toLocaleString()} Raised</span>
        <span>Goal: NPR {campaign.goalAmount.toLocaleString()}</span>
      </div>
    </div>

    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Users size={14} />
        {campaign.donationsCount} Donors
      </div>
      <button className="text-emerald-600 font-bold text-sm hover:underline">
        Edit Campaign
      </button>
    </div>
  </div>
);
