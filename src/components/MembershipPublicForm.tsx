import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { PaymentMethodSelector } from './ui/PaymentMethodSelector';

const MembershipPublicForm: React.FC<{ onBack: () => void; onSuccess?: (trackingCode: string, mobile: string) => void }> = ({ onBack, onSuccess }) => {
  const { register, handleSubmit, getValues } = useForm();
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<any[]>([]);

  React.useEffect(() => {
    api.get('/public/units').then(setUnits).catch(console.error);
  }, []);

  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);

  const onSubmit = async (data: any) => {
    if (!selectedMethod) {
      alert('Please select a payment method.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      formData.append('applicationMode', 'FORM');
      formData.append('paymentMethod', selectedMethod.provider);
      if (idDoc) formData.append('identityDocument', idDoc);
      if (photo) formData.append('profilePhoto', photo);

      const result = await api.postFormData('/members/apply', formData);
      setSuccess(result.trackingCode);
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(err.message || 'An error occurred during submission');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-3xl text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Application Submitted!</h2>
        <p className="text-slate-600 mb-8">Your application has been received and is currently being processed.</p>
        
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 mb-8 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Tracking Code</p>
          <p className="text-3xl font-black text-emerald-600 font-mono tracking-tighter">{success}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onSuccess?.(success, getValues('mobile'))}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100"
          >
            Check Status Now
          </button>
          <button 
            onClick={onBack}
            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input {...register('fullName')} placeholder="e.g. John Doe" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Citizenship Number</label>
            <input {...register('citizenshipNumber')} placeholder="e.g. 12-34-56-7890" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" required />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
          <input {...register('mobile')} placeholder="e.g. 98XXXXXXXX" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" required />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Address Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input {...register('province')} placeholder="Province" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" required />
          <input {...register('district')} placeholder="District" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" required />
          <input {...register('localLevel')} placeholder="Municipality/Local Level" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" required />
          <input {...register('ward')} type="number" placeholder="Ward Number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" required />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Organization & Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization Unit</label>
            <select {...register('orgUnitId')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" required>
              <option value="">Select Unit</option>
              {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.level})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Type</label>
            <select {...register('identityDocumentType')} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:ring-0 transition-all" required>
              <option value="">Select Type</option>
              <option value="CITIZENSHIP">Citizenship</option>
              <option value="VOTER_ID">Voter ID</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Identity Document</label>
          <div className="relative">
            <input 
              type="file" 
              onChange={(e) => setIdDoc(e.target.files?.[0] || null)} 
              className="w-full p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-sm file:hidden cursor-pointer hover:border-emerald-500 transition-all" 
              required 
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              {idDoc ? idDoc.name : 'Choose File'}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Profile Photo</label>
          <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setPhoto(e.target.files?.[0] || null)} 
              className="w-full p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-sm file:hidden cursor-pointer hover:border-emerald-500 transition-all" 
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              {photo ? photo.name : 'Choose Image'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Payment Information</h2>
        <PaymentMethodSelector 
          module="MEMBERSHIP"
          selectedMethodId={selectedMethod?.id || null}
          onSelect={setSelectedMethod}
        />
      </div>

      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input type="checkbox" {...register('declaration')} className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" required />
          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
            I hereby declare that all information provided is true and accurate to the best of my knowledge. I understand that any false information may lead to rejection of my application.
          </span>
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button 
          type="submit" 
          disabled={loading || !selectedMethod}
          className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
        <button 
          type="button" 
          onClick={onBack} 
          className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default MembershipPublicForm;
