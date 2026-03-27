import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Globe, 
  Bell, 
  Layout, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Building2,
  Mail,
  Phone,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export const SystemSettings: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'localization' | 'notifications' | 'modules' | 'system'>('general');
  const [decisionNote, setDecisionNote] = useState('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await api.get('/system-config');
      setConfigs(data);
    } catch (error) {
      console.error('Error fetching system configs:', error);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, newValue: string) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue } : c));
  };

  const handleToggle = (key: string) => {
    const config = configs.find(c => c.key === key);
    if (config) {
      const newValue = config.value === 'true' ? 'false' : 'true';
      handleValueChange(key, newValue);
    }
  };

  const handleSave = async () => {
    if (!decisionNote.trim()) {
      toast.error('Please provide a decision note for this update');
      return;
    }

    setSaving(true);
    try {
      await api.post('/system-config', {
        configs: configs.map(({ key, value, description }) => ({ key, value, description })),
        decisionNote
      });
      toast.success('System settings updated successfully');
      setDecisionNote('');
      fetchConfigs();
    } catch (error) {
      console.error('Error saving system configs:', error);
      toast.error('Failed to save system settings');
    } finally {
      setSaving(false);
    }
  };

  const getConfigValue = (key: string) => configs.find(c => c.key === key)?.value || '';
  const getConfigDesc = (key: string) => configs.find(c => c.key === key)?.description || '';

  const renderSettingRow = (key: string, label: string, type: 'text' | 'email' | 'tel' | 'toggle' = 'text') => {
    const value = getConfigValue(key);
    const desc = getConfigDesc(key);

    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-slate-100 last:border-0 gap-4">
        <div className="flex-1">
          <label className="text-sm font-bold text-slate-700 block">{label}</label>
          <span className="text-xs text-slate-500">{desc}</span>
        </div>
        <div className="w-full md:w-2/3 max-w-md">
          {type === 'toggle' ? (
            <button 
              onClick={() => handleToggle(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                value === 'true' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-slate-50 text-slate-500 border border-slate-200'
              }`}
            >
              {value === 'true' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              <span className="text-xs font-bold uppercase">{value === 'true' ? 'Enabled' : 'Disabled'}</span>
            </button>
          ) : (
            <input 
              type={type}
              value={value}
              onChange={(e) => handleValueChange(key, e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-500 animate-pulse">Loading system governance foundation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="text-blue-600" /> System Governance
          </h2>
          <p className="text-slate-500">Centralized application settings and module control.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchConfigs}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Refresh Settings"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1 space-y-1">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'branding', label: 'Branding', icon: Building2 },
            { id: 'localization', label: 'Localization', icon: Globe },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'modules', label: 'Modules', icon: Layout },
            { id: 'system', label: 'System Info', icon: Info },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 capitalize">{activeTab} Settings</h3>
              <p className="text-sm text-slate-500">Configure global parameters for the {activeTab} layer.</p>
            </div>
            
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'general' && (
                    <div className="space-y-2">
                      {renderSettingRow('PARTY_NAME', 'Organization Name')}
                      {renderSettingRow('CONTACT_EMAIL', 'Primary Contact Email', 'email')}
                      {renderSettingRow('CONTACT_PHONE', 'Primary Contact Phone', 'tel')}
                    </div>
                  )}

                  {activeTab === 'branding' && (
                    <div className="space-y-2">
                      {renderSettingRow('PARTY_TAGLINE', 'Public Tagline')}
                    </div>
                  )}

                  {activeTab === 'localization' && (
                    <div className="space-y-2">
                      {renderSettingRow('DEFAULT_LANGUAGE', 'Default Language')}
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-2">
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 mb-4">
                        <Bell className="text-blue-600 shrink-0" size={20} />
                        <p className="text-xs text-blue-800 leading-relaxed">
                          These defaults are used by the Messaging Engine when specific provider configurations are not provided.
                        </p>
                      </div>
                      <p className="text-sm text-slate-400 italic py-4">No specific notification defaults configured yet.</p>
                    </div>
                  )}

                  {activeTab === 'modules' && (
                    <div className="space-y-2">
                      {renderSettingRow('ENABLE_WAR_ROOM', 'War Room Module', 'toggle')}
                      {renderSettingRow('ENABLE_PGIS', 'PGIS Module', 'toggle')}
                      {renderSettingRow('ENABLE_OFFICE_LOCATIONS', 'Office Locations Module', 'toggle')}
                    </div>
                  )}

                  {activeTab === 'system' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Environment</span>
                          <div className="text-sm font-bold text-slate-700">Production Mode</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Type</span>
                          <div className="text-sm font-bold text-slate-700">SQLite (Local)</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Version</span>
                          <div className="text-sm font-bold text-slate-700">v1.10.0-governance</div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Sync</span>
                          <div className="text-sm font-bold text-slate-700">{new Date().toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                        <Shield className="text-amber-600 shrink-0" size={20} />
                        <div>
                          <p className="text-xs font-bold text-amber-800 mb-1">Security Notice</p>
                          <p className="text-[10px] text-amber-700 leading-relaxed">
                            Technical internals and secrets are hidden from this view. To manage environment variables, please use the platform settings menu.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Audit Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Shield className="text-blue-600" size={18} />
              <h4 className="font-bold">Governance & Accountability</h4>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Decision Note (Required to Save)</label>
              <textarea 
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Explain why these system settings are being updated..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
