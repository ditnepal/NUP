import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { usePermissions } from '../hooks/usePermissions';
import { UserProfile } from '../types';
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, Mail, MessageSquare, Bell, Users, Send, FileText, Layout, Target, Megaphone, AlertTriangle, Shield, Key, Settings, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { CommunicationProvider, CommunicationChannel } from '../types';

type Tab = 'templates' | 'segments' | 'campaigns' | 'providers';

interface Props {
  user: UserProfile;
}

export const CommunicationAdmin: React.FC<Props> = ({ user }) => {
  const { can } = usePermissions(user);
  
  const availableTabs = (['templates', 'segments', 'campaigns', 'providers'] as const).filter(tab => {
    if (tab === 'templates' || tab === 'segments') {
      return can('COMMUNICATION', 'CREATE') || can('COMMUNICATION', 'UPDATE');
    }
    if (tab === 'providers') {
      return user.role === 'ADMIN';
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState<Tab>(
    availableTabs.includes('templates') ? 'templates' : 'campaigns'
  );
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [providers, setProviders] = useState<CommunicationProvider[]>([]);
  const [routingSummary, setRoutingSummary] = useState<Record<string, { default?: string; backup?: string }>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [broadcastTarget, setBroadcastTarget] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    if (activeTab === 'campaigns') {
      fetchTemplatesAndSegments();
    }
  }, [activeTab]);

  const fetchTemplatesAndSegments = async () => {
    try {
      const [templatesData, segmentsData] = await Promise.all([
        api.get('/communication/templates'),
        api.get('/communication/segments')
      ]);
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
      setSegments(Array.isArray(segmentsData) ? segmentsData : []);
    } catch (error) {
      console.error('Error fetching templates and segments:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const configs = await api.get('/system-config');
      const providersConfig = configs.find((c: any) => c.key === 'COMMUNICATION_PROVIDERS');
      let currentProviders: CommunicationProvider[] = [];
      
      if (providersConfig && providersConfig.value) {
        currentProviders = JSON.parse(providersConfig.value);
        setProviders(currentProviders);
      } else {
        setProviders([]);
      }

      if (activeTab === 'providers') {
        setData(currentProviders);
        
        // Calculate routing summary
        const summary: Record<string, { default?: string; backup?: string }> = {};
        (['SMS', 'EMAIL', 'WHATSAPP', 'PUSH'] as const).forEach(channel => {
          const channelProviders = currentProviders.filter(p => p.channel === channel && p.isActive);
          summary[channel] = {
            default: channelProviders.find(p => p.isDefault)?.name,
            backup: channelProviders.find(p => p.isBackup)?.name
          };
        });
        setRoutingSummary(summary);
      } else {
        const endpoint = `/communication/${activeTab}`;
        const result = await api.get(endpoint);
        setData(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (activeTab === 'providers') {
        const updatedProviders = providers.filter(p => p.id !== deleteTarget);
        await api.post('/system-config', {
          configs: [
            { 
              key: 'COMMUNICATION_PROVIDERS', 
              value: JSON.stringify(updatedProviders),
              description: 'Configured communication providers (SMS, Email, WhatsApp)'
            }
          ],
          decisionNote: `Deleted communication provider`
        });
        toast.success('Provider deleted successfully');
        fetchData();
      } else {
        await api.delete(`/communication/${activeTab}/${deleteTarget}`);
        toast.success(`${activeTab.slice(0, -1)} deleted successfully`);
        fetchData();
      }
    } catch (error: any) {
      console.error(`Error deleting ${activeTab}:`, error);
      toast.error(error.message || 'Failed to delete item');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSave = async (formData: any) => {
    if (activeTab === 'providers') {
      return handleSaveProvider(formData);
    }
    try {
      if (editingItem) {
        await api.put(`/communication/${activeTab}/${editingItem.id}`, formData);
        toast.success(`${activeTab.slice(0, -1)} updated successfully`);
      } else {
        await api.post(`/communication/${activeTab}`, formData);
        toast.success(`${activeTab.slice(0, -1)} created successfully`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(`Error saving ${activeTab}:`, error);
      toast.error(error.message || 'Failed to save item');
    }
  };

  const handleBroadcast = (campaignId: string) => {
    setBroadcastTarget(campaignId);
  };

  const confirmBroadcast = async () => {
    if (!broadcastTarget) return;
    try {
      await api.post(`/communication/campaigns/${broadcastTarget}/broadcast`, {});
      toast.success('Campaign broadcast started!');
      fetchData();
    } catch (error: any) {
      console.error('Error broadcasting campaign:', error);
      toast.error(error.message || 'Failed to broadcast campaign');
    } finally {
      setBroadcastTarget(null);
    }
  };

  const renderTemplateForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSave({
        name: formData.get('name'),
        subject: formData.get('subject'),
        body: formData.get('body'),
        type: formData.get('type'),
        category: formData.get('category'),
      });
    }}>
      <input name="name" defaultValue={editingItem?.name} placeholder="Template Name" className="w-full p-2 border rounded mb-2" required />
      <input name="subject" defaultValue={editingItem?.subject} placeholder="Subject Line" className="w-full p-2 border rounded mb-2" />
      <textarea name="body" defaultValue={editingItem?.body} placeholder="Message Body (use {{fullName}} for dynamic name)" className="w-full p-2 border rounded mb-2" rows={6} required />
      <div className="grid grid-cols-2 gap-2 mb-2">
        <select name="type" defaultValue={editingItem?.type || 'EMAIL'} className="p-2 border rounded">
          <option value="EMAIL">EMAIL</option>
          <option value="SMS">SMS</option>
          <option value="PUSH">PUSH</option>
          <option value="IN_APP">IN_APP</option>
        </select>
        <select name="category" defaultValue={editingItem?.category || 'TRANSACTIONAL'} className="p-2 border rounded">
          <option value="TRANSACTIONAL">TRANSACTIONAL</option>
          <option value="MARKETING">MARKETING</option>
          <option value="ALERT">ALERT</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
      </div>
    </form>
  );

  const renderSegmentForm = () => {
    let defaultRoles: string[] = ['MEMBER'];
    try {
      if (editingItem?.criteria) {
        const parsed = JSON.parse(editingItem.criteria);
        if (Array.isArray(parsed.roles)) {
          defaultRoles = parsed.roles;
        } else if (parsed.role) {
          defaultRoles = [parsed.role];
        }
      }
    } catch (e) {}

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const selectedRoles = Array.from(formData.getAll('roles')) as string[];
        handleSave({
          name: formData.get('name'),
          description: formData.get('description'),
          criteria: JSON.stringify({ roles: selectedRoles }),
        });
      }}>
        <input name="name" defaultValue={editingItem?.name} placeholder="Segment Name" className="w-full p-2 border rounded mb-2" required />
        <input name="description" defaultValue={editingItem?.description} placeholder="Description" className="w-full p-2 border rounded mb-2" />
        <div className="mb-2">
          <label className="text-xs text-gray-500 block mb-1">Target Roles</label>
          <div className="space-y-1 border rounded p-2 bg-gray-50">
            {['ADMIN', 'STAFF', 'MEMBER', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER'].map(role => (
              <label key={role} className="flex items-center gap-2">
                <input type="checkbox" name="roles" value={role} defaultChecked={defaultRoles.includes(role)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="text-sm text-gray-700">{role.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
        </div>
      </form>
    );
  };

  const renderCampaignForm = () => {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleSave({
          name: formData.get('name'),
          templateId: formData.get('templateId'),
          segmentId: formData.get('segmentId'),
          scheduledAt: formData.get('scheduledAt'),
        });
      }}>
        <input name="name" defaultValue={editingItem?.name} placeholder="Campaign Name" className="w-full p-2 border rounded mb-2" required />
        
        <div className="mb-2">
          <label className="text-xs text-gray-500">Template</label>
          <select name="templateId" defaultValue={editingItem?.templateId} className="w-full p-2 border rounded" required>
            <option value="">Select a template...</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="text-xs text-gray-500">Audience Segment</label>
          <select name="segmentId" defaultValue={editingItem?.segmentId} className="w-full p-2 border rounded">
            <option value="">Select a segment (Optional)...</option>
            {segments.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="text-xs text-gray-500">Schedule At</label>
          <input type="datetime-local" name="scheduledAt" defaultValue={editingItem?.scheduledAt?.slice(0, 16)} className="w-full p-2 border rounded" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
        </div>
      </form>
    );
  };

  const handleSaveProvider = async (formData: any) => {
    try {
      let updatedProviders: CommunicationProvider[];
      const now = new Date().toISOString();
      
      if (editingItem) {
        updatedProviders = providers.map(p => p.id === editingItem.id ? { ...p, ...formData, updatedAt: now } : p);
      } else {
        const newProvider: CommunicationProvider = {
          ...formData,
          id: Math.random().toString(36).substring(2, 11),
          createdAt: now,
          updatedAt: now
        };
        updatedProviders = [...providers, newProvider];
      }

      // Ensure only one default per channel
      if (formData.isDefault) {
        updatedProviders = updatedProviders.map(p => 
          (p.channel === formData.channel && p.id !== (editingItem?.id || updatedProviders[updatedProviders.length-1].id))
          ? { ...p, isDefault: false } 
          : p
        );
      }

      await api.post('/system-config', {
        configs: [
          { 
            key: 'COMMUNICATION_PROVIDERS', 
            value: JSON.stringify(updatedProviders),
            description: 'Configured communication providers (SMS, Email, WhatsApp)'
          }
        ],
        decisionNote: `${editingItem ? 'Updated' : 'Added'} communication provider: ${formData.name}`
      });

      toast.success(`Provider ${editingItem ? 'updated' : 'added'} successfully`);
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving provider:', error);
      toast.error(error.message || 'Failed to save provider');
    }
  };

  const renderProviderForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const channel = formData.get('channel') as string;
      const fromNameValue = formData.get('fromName') as string;
      
      handleSave({
        name: formData.get('name'),
        channel: channel,
        isActive: formData.get('isActive') === 'on',
        isDefault: formData.get('isDefault') === 'on',
        isBackup: formData.get('isBackup') === 'on',
        senderId: channel !== 'EMAIL' ? fromNameValue : undefined,
        fromAddress: formData.get('fromAddress'),
        fromName: channel === 'EMAIL' ? fromNameValue : undefined,
        endpoint: formData.get('endpoint'),
        apiKey: formData.get('apiKey'),
        apiSecret: formData.get('apiSecret'),
        authToken: formData.get('authToken'),
        notes: formData.get('notes'),
      });
    }} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Provider Name</label>
          <input name="name" defaultValue={editingItem?.name} placeholder="e.g. Twilio, SendGrid" className="w-full p-2 border rounded mt-1" required />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Channel</label>
          <select name="channel" defaultValue={editingItem?.channel || 'SMS'} className="w-full p-2 border rounded mt-1">
            <option value="SMS">SMS</option>
            <option value="EMAIL">EMAIL</option>
            <option value="WHATSAPP">WHATSAPP</option>
            <option value="PUSH">PUSH</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isActive" defaultChecked={editingItem ? editingItem.isActive : true} className="rounded text-emerald-600" />
          <span className="text-sm font-medium">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isDefault" defaultChecked={editingItem?.isDefault} className="rounded text-emerald-600" />
          <span className="text-sm font-medium">Set as Default</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isBackup" defaultChecked={editingItem?.isBackup} className="rounded text-emerald-600" />
          <span className="text-sm font-medium">Set as Backup</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">Sender ID / From Name</label>
          <input name="fromName" defaultValue={editingItem?.fromName || editingItem?.senderId} placeholder="e.g. MyOrg" className="w-full p-2 border rounded mt-1" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">From Address / Number</label>
          <input name="fromAddress" defaultValue={editingItem?.fromAddress} placeholder="e.g. no-reply@org.com" className="w-full p-2 border rounded mt-1" />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Shield size={16} /> API Credentials
        </h3>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">API Endpoint</label>
          <input name="endpoint" defaultValue={editingItem?.endpoint} placeholder="https://api.provider.com/v1" className="w-full p-2 border rounded mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">API Key / SID</label>
            <input type="password" name="apiKey" defaultValue={editingItem?.apiKey} placeholder="••••••••" className="w-full p-2 border rounded mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">API Secret / Token</label>
            <input type="password" name="apiSecret" defaultValue={editingItem?.apiSecret} placeholder="••••••••" className="w-full p-2 border rounded mt-1" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">Internal Notes</label>
        <textarea name="notes" defaultValue={editingItem?.notes} placeholder="Configuration notes..." className="w-full p-2 border rounded mt-1" rows={2} />
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">Save Provider</button>
      </div>
    </form>
  );

  const isConfigComplete = (p: CommunicationProvider) => {
    if (!p.name || !p.channel) return false;
    if (p.channel === 'EMAIL' && !p.fromAddress) return false;
    if (p.channel === 'SMS' && !p.senderId && !p.fromAddress) return false;
    if (!p.apiKey && !p.authToken && !p.apiSecret) return false;
    return true;
  };

  const renderTable = () => {
    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (data.length === 0) {
      return (
        <div className="p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            {activeTab === 'templates' && <Layout className="w-12 h-12 text-slate-300 mb-4" />}
            {activeTab === 'segments' && <Target className="w-12 h-12 text-slate-300 mb-4" />}
            {activeTab === 'campaigns' && <Megaphone className="w-12 h-12 text-slate-300 mb-4" />}
            <p className="text-lg font-medium text-slate-900">No {activeTab} found</p>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              There are currently no {activeTab} to display. Create one to get started.
            </p>
            {(can('COMMUNICATION', 'CREATE') || can('COMMUNICATION', 'UPDATE')) && (
              <button 
                onClick={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
                className="mt-4 text-emerald-600 font-medium hover:text-emerald-700"
              >
                Create {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Name
              </th>
              {activeTab === 'campaigns' && (
                <>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Segment
                  </th>
                </>
              )}
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {activeTab === 'templates' ? 'Type & Category' : activeTab === 'segments' ? 'Criteria' : activeTab === 'providers' ? 'Channel & Status' : 'Status'}
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {item.name}
                </td>
                {activeTab === 'campaigns' && (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.template?.name || 'Unknown Template'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.segment?.name || 'All Users'}
                    </td>
                  </>
                )}
                <td className="px-6 py-4 text-sm text-gray-500">
                  {activeTab === 'templates' ? (
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">{item.type}</span>
                        {(() => {
                          const provider = providers.find(p => p.channel === item.type && p.isActive && p.isDefault);
                          if (!provider) return <span className="text-[10px] text-amber-600 flex items-center gap-1"><AlertTriangle size={10} /> No Default Provider</span>;
                          return <span className="text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle size={10} /> via {provider.name}</span>;
                        })()}
                      </div>
                      <span className="text-xs text-gray-400">{item.category}</span>
                    </div>
                  ) : activeTab === 'segments' ? (
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        try {
                          const parsed = JSON.parse(item.criteria);
                          const roles = parsed.roles || (parsed.role ? [parsed.role] : []);
                          if (roles.length === 0) return <span className="text-xs text-gray-400">No roles selected</span>;
                          return roles.map((r: string) => (
                            <span key={r} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {r.replace('_', ' ')}
                            </span>
                          ));
                        } catch (e) {
                          return <span className="text-xs text-red-500">Invalid Criteria</span>;
                        }
                      })()}
                    </div>
                  ) : activeTab === 'providers' ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{item.channel}</span>
                        {item.isDefault && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Default</span>}
                        {item.isBackup && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">Backup</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                          item.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {!isConfigComplete(item) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertCircle size={10} /> INCOMPLETE
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                        item.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        item.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                      {item.template && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          {(() => {
                            const provider = providers.find(p => p.channel === item.template.type && p.isActive && p.isDefault);
                            if (!provider) return <span className="text-amber-600 flex items-center gap-1"><AlertTriangle size={10} /> No Default</span>;
                            return <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={10} /> via {provider.name}</span>;
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 space-x-2">
                  {can('COMMUNICATION', 'UPDATE') && (
                    <button onClick={() => handleEdit(item)} className="hover:underline">Edit</button>
                  )}
                  {activeTab === 'campaigns' && item.status === 'DRAFT' && can('COMMUNICATION', 'APPROVE') && (
                    <button onClick={() => handleBroadcast(item.id)} className="text-blue-600 hover:underline">Broadcast</button>
                  )}
                  {can('COMMUNICATION', 'DELETE') && (
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit' : 'Create'} {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
            </h2>
            {activeTab === 'templates' && renderTemplateForm()}
            {activeTab === 'segments' && renderSegmentForm()}
            {activeTab === 'campaigns' && renderCampaignForm()}
            {activeTab === 'providers' && renderProviderForm()}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
          <p className="text-gray-500">
            {activeTab === 'providers' 
              ? 'Configure communication channels (SMS, Email, WhatsApp) and their API credentials.'
              : 'Manage templates, segments, and campaigns.'}
          </p>
        </div>
        {can('COMMUNICATION', 'CREATE') && (
          <button 
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
          >
            <Plus size={20} />
            Create {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)}
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {availableTabs.includes('templates') && (
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'templates' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Layout size={18} /> Templates
          </button>
        )}
        {availableTabs.includes('segments') && (
          <button 
            onClick={() => setActiveTab('segments')}
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'segments' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Target size={18} /> Segments
          </button>
        )}
        {availableTabs.includes('campaigns') && (
          <button 
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'campaigns' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Megaphone size={18} /> Campaigns
          </button>
        )}
        {availableTabs.includes('providers') && (
          <button 
            onClick={() => setActiveTab('providers')}
            className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'providers' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Shield size={18} /> Providers
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'providers' && providers.length > 0 && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['SMS', 'EMAIL', 'WHATSAPP', 'PUSH'] as const).map(channel => (
              <div key={channel} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{channel} Routing</span>
                  {routingSummary[channel]?.default ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  ) : (
                    <AlertTriangle size={14} className="text-amber-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Default:</span>
                    <span className="font-medium text-slate-900">{routingSummary[channel]?.default || 'None'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Backup:</span>
                    <span className="font-medium text-slate-900">{routingSummary[channel]?.backup || 'None'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {renderTable()}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete {activeTab.slice(0, -1)}</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete this {activeTab.slice(0, -1)}? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Confirmation Modal */}
      {broadcastTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Send size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Broadcast Campaign</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to broadcast this campaign? This will send messages to all users in the segment.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBroadcastTarget(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBroadcast}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                >
                  Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
