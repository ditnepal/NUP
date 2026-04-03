import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { PaymentMethodSelector } from './ui/PaymentMethodSelector';
import { toast } from 'sonner';

const MembershipPublicForm: React.FC<{ onBack: () => void; onSuccess?: (trackingCode: string, mobile: string) => void; user?: any }> = ({ onBack, onSuccess, user }) => {
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<any>({
    defaultValues: {
      fullName: user?.displayName || '',
      email: user?.email || '',
      mobile: user?.phoneNumber || '',
    }
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ loginId: string; tempPassword: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<any[]>([]);

  React.useEffect(() => {
    api.get('/public/units').then(setUnits).catch(console.error);
  }, []);

  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);

  const [isPendingPayment, setIsPendingPayment] = useState(false);

  const onSubmit = async (data: any) => {
    if (!selectedMethod) {
      toast.error('Please select a payment method.');
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

      const result = await api.postFormData('/public/membership/apply', formData);
      toast.success('Application submitted successfully');
      setSuccess(result.trackingCode);
      setCredentials(result.credentials);
      setIsPendingPayment(selectedMethod.instructions ? true : false);
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'An error occurred during submission');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-center animate-in fade-in zoom-in duration-300">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isPendingPayment ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {isPendingPayment ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          )}
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
          {isPendingPayment ? 'Application Initiated' : 'Application Submitted!'}
        </h2>
        <p className="text-slate-600 text-xs mb-6 leading-relaxed">
          Your membership application has been submitted successfully. Your account has been created with temporary credentials.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tracking Code</p>
            <p className="text-lg font-black text-emerald-600 font-mono tracking-tighter">{success}</p>
          </div>
          {credentials && (
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm text-left">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Temporary Credentials</p>
              <div className="space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Login ID:</span>
                  <span className="text-[10px] font-bold text-blue-600 break-all">{credentials.loginId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Password:</span>
                  <span className="text-[10px] font-bold text-blue-600">{credentials.tempPassword}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-6 text-left">
          <p className="text-[10px] text-amber-800 leading-relaxed">
            <strong>Important:</strong> Please save these credentials. You can use them to log in to your Applicant Dashboard to track your status. These credentials have also been sent to your email/mobile.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => onSuccess?.(success, getValues('mobile'))}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
          >
            Go to Applicant Dashboard
          </button>
          <button 
            onClick={onBack}
            className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Back to Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xl">
      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              {...register('fullName', { 
                required: 'Full name is required',
                minLength: { value: 2, message: 'Must be at least 2 characters' }
              })} 
              placeholder="e.g. John Doe" 
              className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm ${errors.fullName ? 'border-rose-500' : 'border-slate-200'}`} 
            />
            {errors.fullName && (
              <p className="text-[9px] font-bold text-rose-500 ml-1">{(errors.fullName as any).message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Citizenship Number</label>
            <input 
              {...register('citizenshipNumber', { 
                required: 'Citizenship number is required',
                minLength: { value: 5, message: 'Must be at least 5 characters' }
              })} 
              placeholder="e.g. 12-34-56-7890" 
              className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm ${errors.citizenshipNumber ? 'border-rose-500' : 'border-slate-200'}`} 
            />
            {errors.citizenshipNumber && (
              <p className="text-[9px] font-bold text-rose-500 ml-1">{(errors.citizenshipNumber as any).message}</p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
          <input {...register('mobile')} placeholder="e.g. 98XXXXXXXX" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" required />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Address Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input {...register('province')} placeholder="Province" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" required />
          <input {...register('district')} placeholder="District" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" required />
          <input {...register('localLevel')} placeholder="Municipality/Local Level" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" required />
          <input {...register('ward')} type="number" placeholder="Ward Number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" required />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Organization & Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization Unit</label>
            <select {...register('orgUnitId')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" required>
              <option value="">Select Unit</option>
              {units?.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.level})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Type</label>
            <select {...register('identityDocumentType')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" required>
              <option value="">Select Type</option>
              <option value="CITIZENSHIP">Citizenship</option>
              <option value="VOTER_ID">Voter ID</option>
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Document</label>
          <div className="relative">
            <input 
              type="file" 
              onChange={(e) => setIdDoc(e.target.files?.[0] || null)} 
              className="w-full px-4 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs file:hidden cursor-pointer hover:border-emerald-500 transition-all" 
              required 
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-[10px]">
              {idDoc ? idDoc.name : 'Choose File'}
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Photo</label>
          <div className="relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setPhoto(e.target.files?.[0] || null)} 
              className="w-full px-4 py-2 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-xs file:hidden cursor-pointer hover:border-emerald-500 transition-all" 
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 text-[10px]">
              {photo ? photo.name : 'Choose Image'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Payment Information</h2>
        <PaymentMethodSelector 
          module="MEMBERSHIP"
          selectedMethodId={selectedMethod?.id || null}
          onSelect={setSelectedMethod}
        />
      </div>

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input type="checkbox" {...register('declaration')} className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" required />
          <span className="text-[11px] text-slate-600 group-hover:text-slate-900 transition-colors leading-tight">
            I hereby declare that all information provided is true and accurate to the best of my knowledge. I understand that any false information may lead to rejection of my application.
          </span>
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button 
          type="submit" 
          disabled={loading || !selectedMethod}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
        <button 
          type="button" 
          onClick={onBack} 
          className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default MembershipPublicForm;
