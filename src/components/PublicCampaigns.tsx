import React, { useState, useEffect } from 'react';
import { Megaphone, Target, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';

interface PublicCampaignsViewProps {
  onBack?: () => void;
}

export const PublicCampaignsView: React.FC<PublicCampaignsViewProps> = ({ onBack }) => {
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
    <div className="space-y-12">
      {/* Header Section */}
      <div className="bg-slate-950 text-white rounded-[3rem] p-12 md:p-20 relative overflow-hidden mx-4 md:mx-0">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,#3b82f6_0%,transparent_50%)]"></div>
        </div>
        <div className="relative z-10 max-w-4xl">
          {onBack && (
            <button 
              onClick={onBack}
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Return to Portal
            </button>
          )}
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-10">
            <Megaphone size={14} />
            Strategic Initiatives
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
            Active <br />
            <span className="text-blue-500">Campaigns.</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-tight tracking-tight max-w-2xl">
            Join our ongoing efforts to drive meaningful change. 
            From grassroots organizing to national policy advocacy, your participation matters.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-96 bg-slate-100 rounded-[3rem] animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Megaphone size={48} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">No Active Campaigns</h3>
          <p className="text-slate-500 max-w-md mx-auto font-medium">
            There are currently no active public campaigns. 
            Please check back later or subscribe to our newsletter for the latest updates on our initiatives.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns?.map((campaign) => (
            <div key={campaign.id} className="group bg-white border border-slate-100 rounded-[3rem] p-10 hover:shadow-2xl transition-all flex flex-col shadow-sm">
              <div className="flex items-start justify-between mb-10">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-blue-100">
                  <Target size={32} />
                </div>
                <span className="text-[10px] font-black px-4 py-1.5 bg-slate-100 text-slate-500 rounded-xl uppercase tracking-widest">
                  {campaign.type || 'AWARENESS'}
                </span>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                {campaign.title}
              </h3>
              
              <p className="text-slate-500 font-medium mb-10 flex-1 line-clamp-3 leading-relaxed">
                {campaign.description}
              </p>
              
              <div className="space-y-8">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest border-t border-slate-50 pt-8">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Users size={16} />
                    <span>{campaign.participantCount || 0} Joined</span>
                  </div>
                  <div className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                    {campaign.status || 'ACTIVE'}
                  </div>
                </div>
                
                <button className="w-full py-5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20">
                  Join Campaign <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
