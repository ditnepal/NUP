import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { PaymentMethodSelector } from './ui/PaymentMethodSelector';
import { toast } from 'sonner';

const MembershipPublicAssisted: React.FC<{ onBack: () => void; onSuccess?: (code: string, mobile: string) => void }> = ({ onBack, onSuccess }) => {
  const { register, handleSubmit, getValues, formState: { errors } } = useForm();
  const [units, setUnits] = useState<any[]>([]);

  React.useEffect(() => {
    api.get('/public/units').then(setUnits).catch(console.error);
  }, []);

  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ loginId: string; tempPassword: string } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);

  const [isPendingPayment, setIsPendingPayment] = useState(false);

  const onSubmit = async (data: any) => {
    if (!selectedMethod) {
      toast.error('Please select a payment method.');
      return;
    }
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      formData.append('applicationMode', 'ASSISTED');
      formData.append('paymentMethod', selectedMethod.provider);
      if (idDoc) formData.append('identityDocument', idDoc);

      const result = await api.postFormData('/public/membership/apply', formData);
      toast.success('Application submitted successfully');
      setSuccess(result.trackingCode);
      setCredentials(result.credentials);
      setIsPendingPayment(selectedMethod.instructions ? true : false);
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'An error occurred during submission');
    }
  };

  if (success) {
    return (
      <div className={`p-8 border-2 rounded-3xl text-center animate-in fade-in zoom-in duration-300 ${
        isPendingPayment ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isPendingPayment ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {isPendingPayment ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          )}
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">
          {isPendingPayment ? 'Assisted Application Initiated' : 'Assisted Application Submitted!'}
        </h2>
        <p className="text-slate-600 mb-8">
          Your membership application has been submitted successfully. Your account has been created with temporary credentials.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className={`p-6 rounded-2xl border shadow-sm bg-white ${isPendingPayment ? 'border-amber-100' : 'border-emerald-100'}`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tracking Code</p>
            <p className={`text-xl font-black font-mono tracking-tighter ${isPendingPayment ? 'text-amber-600' : 'text-emerald-600'}`}>{success}</p>
          </div>
          {credentials && (
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Temporary Credentials</p>
              <div className="text-left space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Login ID:</p>
                <p className="text-sm font-bold text-blue-600 break-all">{credentials.loginId}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Password:</p>
                <p className="text-sm font-bold text-blue-600">{credentials.tempPassword}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-8 text-left">
          <p className="text-xs text-amber-800 font-medium">
            <strong>Important:</strong> Please save these credentials. You can use them to log in to your Applicant Dashboard to track your status. These credentials have also been sent to your email/mobile.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => onSuccess?.(success, getValues('mobile'))} className={`w-full py-4 text-white rounded-2xl font-bold text-lg transition-all shadow-xl ${isPendingPayment ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}>Go to Applicant Dashboard</button>
          <button onClick={onBack} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Back to Portal</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <h3 className="font-bold">Applicant Information</h3>
      <div className="space-y-1">
        <input 
          {...register('fullName', { 
            required: 'Full name is required',
            minLength: { value: 2, message: 'Must be at least 2 characters' }
          })} 
          placeholder="Full Name" 
          className={`w-full p-3 border rounded-lg ${errors.fullName ? 'border-rose-500' : ''}`} 
        />
        {errors.fullName && (
          <p className="text-[10px] font-bold text-rose-500 ml-1">{(errors.fullName as any).message}</p>
        )}
      </div>
      <input {...register('mobile')} placeholder="Mobile" className="p-3 border rounded-lg" />
      <div className="space-y-1">
        <input 
          {...register('citizenshipNumber', { 
            required: 'Citizenship number is required',
            minLength: { value: 5, message: 'Must be at least 5 characters' }
          })} 
          placeholder="Citizenship Number" 
          className={`w-full p-3 border rounded-lg ${errors.citizenshipNumber ? 'border-rose-500' : ''}`} 
        />
        {errors.citizenshipNumber && (
          <p className="text-[10px] font-bold text-rose-500 ml-1">{(errors.citizenshipNumber as any).message}</p>
        )}
      </div>
      <select {...register('orgUnitId')} className="p-3 border rounded-lg" required>
        <option value="">Select Organization Unit</option>
        {units?.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.level})</option>)}
      </select>
      <select {...register('identityDocumentType')} className="p-3 border rounded-lg" required>
        <option value="">Select Identity Document Type</option>
        <option value="CITIZENSHIP">Citizenship</option>
        <option value="VOTER_ID">Voter ID</option>
        <option value="NATIONAL_ID">National ID</option>
        <option value="PASSPORT">Passport</option>
      </select>
      <label>Identity Document Upload</label>
      <input type="file" onChange={(e) => setIdDoc(e.target.files?.[0] || null)} className="p-3 border rounded-lg" required />
      
      <h3 className="font-bold mt-4">Helper Information</h3>
      <input {...register('helperName')} placeholder="Helper Name" className="p-3 border rounded-lg" required />
      <input {...register('helperPhone')} placeholder="Helper Phone" className="p-3 border rounded-lg" required />
      <input {...register('helperRole')} placeholder="Relationship/Role" className="p-3 border rounded-lg" required />
      
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Payment Information</h2>
        <PaymentMethodSelector 
          module="MEMBERSHIP"
          selectedMethodId={selectedMethod?.id || null}
          onSelect={setSelectedMethod}
        />
      </div>

      <button type="submit" disabled={!selectedMethod} className="p-4 bg-purple-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">Submit Assisted</button>
      <button type="button" onClick={onBack} className="p-4 bg-gray-200 rounded-xl">Back</button>
    </form>
  );
};

export default MembershipPublicAssisted;
