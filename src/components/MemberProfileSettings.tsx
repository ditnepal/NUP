import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { 
  User, Mail, Phone, MapPin, Briefcase, Camera, 
  CheckCircle2, Loader2, AlertCircle, ChevronLeft, Save
} from 'lucide-react';

interface MemberProfileSettingsProps {
  profile: any;
  onBack: () => void;
  onUpdate: () => void;
}

export const MemberProfileSettings: React.FC<MemberProfileSettingsProps> = ({ profile, onBack, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    email: profile.user?.email || profile.email || '',
    mobile: profile.user?.phoneNumber || profile.mobile || '',
    alternateContactName: profile.alternateContactName || '',
    alternateContactMobile: profile.alternateContactMobile || '',
    province: profile.province || '',
    district: profile.district || '',
    localLevel: profile.localLevel || '',
    ward: profile.ward || '',
    tole: profile.tole || '',
    occupation: profile.occupation || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.put('/members/me', formData);
      setSuccess(true);
      onUpdate();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError(null);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      await api.postFormData('/members/me/photo', formData);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={16} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage your personal information and contact details.</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          <p className="font-bold text-xs">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={16} />
          <p className="font-bold text-xs">Profile updated successfully.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Photo & Read-Only Info */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="relative inline-block mb-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-sm bg-slate-100">
                {uploadingPhoto ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  </div>
                ) : (
                  <img 
                    src={profile.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.fullName}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Camera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/jpeg,image/png,image/webp" 
                className="hidden" 
              />
            </div>
            <h2 className="text-lg font-bold text-slate-900">{profile.fullName}</h2>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">{profile.status}</p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <User size={12} />
              Identity & Membership (Read-Only)
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Member ID</p>
                <p className="font-mono font-bold text-slate-900 text-xs">{profile.membershipId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organization Unit</p>
                <p className="font-bold text-slate-900 text-xs">{profile.orgUnit?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined Date</p>
                <p className="font-bold text-slate-900 text-xs">{profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issue Date</p>
                <p className="font-bold text-slate-900 text-xs">{(profile.issueDate || profile.joinedDate || profile.createdAt) ? new Date(profile.issueDate || profile.joinedDate || profile.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expiry Date</p>
                <p className="font-bold text-slate-900 text-xs">
                  {profile.expiryDate 
                    ? new Date(profile.expiryDate).toLocaleDateString() 
                    : (profile.issueDate || profile.joinedDate || profile.createdAt) 
                      ? new Date(new Date(profile.issueDate || profile.joinedDate || profile.createdAt).setFullYear(new Date(profile.issueDate || profile.joinedDate || profile.createdAt).getFullYear() + 5)).toLocaleDateString()
                      : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Citizenship Number</p>
                <p className="font-mono font-bold text-slate-900 text-xs">{profile.citizenshipNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment Method</p>
                <p className="font-bold text-slate-900 text-xs uppercase">{profile.paymentMethod || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            
            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Phone size={14} className="text-emerald-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                  <input 
                    type="tel" 
                    name="mobile" 
                    value={formData.mobile} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Alt Contact Name</label>
                  <input 
                    type="text" 
                    name="alternateContactName" 
                    value={formData.alternateContactName} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Alt Contact Mobile</label>
                  <input 
                    type="tel" 
                    name="alternateContactMobile" 
                    value={formData.alternateContactMobile} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <MapPin size={14} className="text-emerald-600" />
                Current Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Province</label>
                  <input 
                    type="text" 
                    name="province" 
                    value={formData.province} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">District</label>
                  <input 
                    type="text" 
                    name="district" 
                    value={formData.district} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Local Level</label>
                  <input 
                    type="text" 
                    name="localLevel" 
                    value={formData.localLevel} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ward</label>
                  <input 
                    type="number" 
                    name="ward" 
                    value={formData.ward} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tole / Street</label>
                  <input 
                    type="text" 
                    name="tole" 
                    value={formData.tole} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Briefcase size={14} className="text-emerald-600" />
                Personal Details
              </h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Occupation</label>
                <input 
                  type="text" 
                  name="occupation" 
                  value={formData.occupation} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-slate-100">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
