import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';

const MembershipPublicVideo: React.FC<{ onBack: () => void; onSuccess?: (code: string) => void }> = ({ onBack, onSuccess }) => {
  const { register, handleSubmit } = useForm();
  const [units, setUnits] = useState<any[]>([]);

  React.useEffect(() => {
    api.get('/public/units').then(setUnits).catch(console.error);
  }, []);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('mobile', data.mobile);
      formData.append('orgUnitId', data.orgUnitId);
      formData.append('identityDocumentType', data.identityDocumentType);
      formData.append('applicationMode', 'VIDEO');
      if (idDoc) formData.append('identityDocument', idDoc);
      if (videoFile) formData.append('video', videoFile);

      const result = await api.postFormData('/members/apply', formData);
      setSuccess(result.trackingCode);
    } catch (err: any) {
      console.error('Submission error:', err);
      alert(err.message || 'An error occurred during submission');
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-emerald-50 border-2 border-emerald-100 rounded-3xl text-center">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">Video Application Submitted!</h2>
        <p className="text-slate-600 mb-8">Tracking Code: <span className="font-mono font-bold text-emerald-600">{success}</span></p>
        <div className="flex flex-col gap-3">
          <button onClick={() => onSuccess?.(success)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold">Check Status Now</button>
          <button onClick={onBack} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold">Back to Portal</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <input {...register('fullName')} placeholder="Full Name" className="p-3 border rounded-lg" required />
      <input {...register('mobile')} placeholder="Mobile Number" className="p-3 border rounded-lg" required />
      <select {...register('orgUnitId')} className="p-3 border rounded-lg" required>
        <option value="">Select Organization Unit</option>
        {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name} ({unit.level})</option>)}
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
      <label>Video Upload</label>
      <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="p-3 border rounded-lg" required />
      <button type="submit" className="p-4 bg-green-600 text-white rounded-xl">Submit Video</button>
      <button type="button" onClick={onBack} className="p-4 bg-gray-200 rounded-xl">Back</button>
    </form>
  );
};

export default MembershipPublicVideo;
