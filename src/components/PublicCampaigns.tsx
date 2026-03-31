import React, { useState, useEffect } from 'react';
import { Megaphone, Target, Users, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export const PublicCampaignsView = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await api.get('/finance/campaigns').catch(() => []);
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100">
            <Megaphone size={12} />
            Initiatives
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
            Active Campaigns
          </h1>
          <p className="text-slate-500 text-lg">
            Join our ongoing efforts to drive meaningful change. 
            From grassroots organizing to national policy advocacy, your participation matters.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Megaphone size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">No Active Campaigns</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            There are currently no active public campaigns. 
            Please check back later or subscribe to our newsletter for the latest updates on our initiatives.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="group bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target size={28} />
                </div>
                <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-widest">
                  {campaign.type || 'AWARENESS'}
                </span>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3 group-hover:text-blue-600 transition-colors">
                {campaign.title}
              </h3>
              
              <p className="text-slate-500 text-sm mb-8 flex-1 line-clamp-3 leading-relaxed">
                {campaign.description}
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest border-t border-slate-50 pt-6">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users size={14} />
                    <span>{campaign.participantCount || 0} Joined</span>
                  </div>
                  <div className="text-blue-600">
                    {campaign.status || 'ACTIVE'}
                  </div>
                </div>
                
                <button className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                  Join Campaign <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
