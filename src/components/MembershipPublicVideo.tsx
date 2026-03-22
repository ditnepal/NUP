import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const MembershipPublicVideo: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { register, handleSubmit } = useForm();
  const [units, setUnits] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/v1/public/units').then(res => res.json()).then(setUnits);
  }, []);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('mobile', data.mobile);
    formData.append('orgUnitId', data.orgUnitId);
    formData.append('identityDocumentType', data.identityDocumentType);
    formData.append('applicationMode', 'VIDEO');
    if (idDoc) formData.append('identityDocument', idDoc);
    if (videoFile) formData.append('video', videoFile);

    const response = await fetch('/api/v1/members/apply', {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      const result = await response.json();
      setSuccess(result.trackingCode);
    }
    else {
      const error = await response.json();
      alert(error.error);
    }
  };

  if (success) return <div className="p-6 bg-green-100 text-green-800 rounded-xl">Video application submitted! Tracking Code: {success}</div>;

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
