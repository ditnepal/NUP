import React, { useState, useEffect } from 'react';
import { Megaphone, Target, Users, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export const PublicCampaignsView = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        // In a real implementation, this would fetch from a public endpoint
        // For now, we simulate fetching public campaigns
        const response = await api.get('/public/campaigns').catch(() => []);
        setCampaigns(response);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <Megaphone size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Active Campaigns</h2>
          <p className="text-slate-500">Join our ongoing initiatives to drive change in Nepal.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Megaphone size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">No Active Campaigns</h3>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            There are currently no active public campaigns. Please check back later or subscribe to our newsletter for updates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{campaign.title}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-widest">
                    {campaign.type || 'AWARENESS'}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3">
                {campaign.description}
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-500 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span>{campaign.participantCount || 0} Joined</span>
                  </div>
                  <div className="font-medium text-blue-600">
                    {campaign.status || 'ACTIVE'}
                  </div>
                </div>
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-100">
                  Join Campaign <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
