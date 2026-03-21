import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Mail, MessageSquare, Send, Plus, Search, Filter, CheckCircle, Clock, AlertCircle, Users, Layout } from 'lucide-react';

export const CommunicationAdmin: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'segments'>('campaigns');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'campaigns') {
        const data = await api.get('/communication/campaigns');
        setCampaigns(data);
      } else if (activeTab === 'templates') {
        const data = await api.get('/communication/templates');
        setTemplates(data);
      } else {
        const data = await api.get('/communication/segments');
        setSegments(data);
      }
    } catch (error) {
      console.error('Error fetching communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (id: string) => {
    if (!confirm('Are you sure you want to broadcast this campaign now?')) return;
    try {
      await api.post(`/communication/campaigns/${id}/broadcast`, {});
      alert('Broadcast started successfully');
      fetchData();
    } catch (error: any) {
      alert(`Broadcast failed: ${error.message}`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication & Outreach</h1>
          <p className="text-gray-500">Manage broadcast campaigns, templates, and audience segments.</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={20} />
          Create {activeTab.slice(0, -1)}
        </button>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg mb-8 w-fit">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'campaigns' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'templates' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('segments')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'segments' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Segments
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'campaigns' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Segment</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent At</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Layout size={14} className="text-gray-400" />
                        {campaign.template.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400" />
                        {campaign.segment?.name || 'Manual Selection'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        campaign.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                        campaign.status === 'SENDING' ? 'bg-blue-50 text-blue-600' :
                        campaign.status === 'SCHEDULED' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {campaign.status === 'DRAFT' && (
                        <button 
                          onClick={() => handleBroadcast(campaign.id)}
                          className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-1 ml-auto"
                        >
                          <Send size={14} /> Broadcast
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${
                    template.type === 'EMAIL' ? 'bg-blue-50 text-blue-600' :
                    template.type === 'SMS' ? 'bg-amber-50 text-amber-600' :
                    template.type === 'PUSH' ? 'bg-purple-50 text-purple-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {template.type === 'EMAIL' ? <Mail size={20} /> : <MessageSquare size={20} />}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{template.category}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{template.body}</p>
                <div className="flex gap-2">
                  <button className="text-xs font-bold text-emerald-600 hover:underline">Edit Template</button>
                  <button className="text-xs font-bold text-gray-400 hover:underline">Duplicate</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'segments' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {segments.map((segment) => (
                <div key={segment.id} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">{segment.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users size={14} />
                      Criteria Based
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{segment.description}</p>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-xs text-emerald-600 mb-4">
                    {segment.criteria}
                  </div>
                  <button className="text-xs font-bold text-emerald-600 hover:underline">View Matching Users</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && (activeTab === 'campaigns' ? campaigns : activeTab === 'templates' ? templates : segments).length === 0 && (
          <div className="py-20 text-center text-gray-500 italic">
            No {activeTab} found. Create your first one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
