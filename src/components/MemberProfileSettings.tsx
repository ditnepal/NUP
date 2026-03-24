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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Profile Settings</h1>
          <p className="text-slate-500 text-sm">Manage your personal information and contact details.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl flex items-center gap-3">
          <CheckCircle2 size={20} />
          <p className="font-medium text-sm">Profile updated successfully.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Photo & Read-Only Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100">
                {uploadingPhoto ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
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
                className="absolute bottom-0 right-0 p-2.5 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Camera size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/jpeg,image/png,image/webp" 
                className="hidden" 
              />
            </div>
            <h2 className="text-xl font-black text-slate-800">{profile.fullName}</h2>
            <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest mt-1">{profile.status}</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User size={14} />
              Identity & Membership (Read-Only)
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Member ID</p>
                <p className="font-mono font-bold text-slate-800">{profile.membershipId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organization Unit</p>
                <p className="font-bold text-slate-800">{profile.orgUnit?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Joined Date</p>
                <p className="font-bold text-slate-800">{profile.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issue Date</p>
                <p className="font-bold text-slate-800">{(profile.issueDate || profile.joinedDate || profile.createdAt) ? new Date(profile.issueDate || profile.joinedDate || profile.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expiry Date</p>
                <p className="font-bold text-slate-800">
                  {profile.expiryDate 
                    ? new Date(profile.expiryDate).toLocaleDateString() 
                    : (profile.issueDate || profile.joinedDate || profile.createdAt) 
                      ? new Date(new Date(profile.issueDate || profile.joinedDate || profile.createdAt).setFullYear(new Date(profile.issueDate || profile.joinedDate || profile.createdAt).getFullYear() + 5)).toLocaleDateString()
                      : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Citizenship Number</p>
                <p className="font-mono font-bold text-slate-800">{profile.citizenshipNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment Method</p>
                <p className="font-bold text-slate-800 uppercase">{profile.paymentMethod || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
            
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <Phone size={16} className="text-emerald-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mobile Number</label>
                  <input 
                    type="tel" 
                    name="mobile" 
                    value={formData.mobile} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Alt Contact Name</label>
                  <input 
                    type="text" 
                    name="alternateContactName" 
                    value={formData.alternateContactName} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Alt Contact Mobile</label>
                  <input 
                    type="tel" 
                    name="alternateContactMobile" 
                    value={formData.alternateContactMobile} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin size={16} className="text-emerald-600" />
                Current Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Province</label>
                  <input 
                    type="text" 
                    name="province" 
                    value={formData.province} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">District</label>
                  <input 
                    type="text" 
                    name="district" 
                    value={formData.district} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Local Level</label>
                  <input 
                    type="text" 
                    name="localLevel" 
                    value={formData.localLevel} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ward</label>
                  <input 
                    type="number" 
                    name="ward" 
                    value={formData.ward} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tole / Street</label>
                  <input 
                    type="text" 
                    name="tole" 
                    value={formData.tole} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                <Briefcase size={16} className="text-emerald-600" />
                Personal Details
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Occupation</label>
                <input 
                  type="text" 
                  name="occupation" 
                  value={formData.occupation} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-all"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
