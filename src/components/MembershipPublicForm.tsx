import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const MembershipPublicForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { register, handleSubmit } = useForm();
  const [success, setSuccess] = useState<string | null>(null);
  const [units, setUnits] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/v1/public/units').then(res => res.json()).then(setUnits);
  }, []);

  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    formData.append('applicationMode', 'FORM');
    if (idDoc) formData.append('identityDocument', idDoc);
    if (photo) formData.append('profilePhoto', photo);

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

  if (success) return <div className="p-6 bg-green-100 text-green-800 rounded-xl">Application submitted successfully! Tracking Code: {success}</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <input {...register('fullName')} placeholder="Full Name" className="p-3 border rounded-lg" required />
      <input {...register('citizenshipNumber')} placeholder="Citizenship Number" className="p-3 border rounded-lg" required />
      <input {...register('mobile')} placeholder="Mobile" className="p-3 border rounded-lg" />
      <input {...register('province')} placeholder="Province" className="p-3 border rounded-lg" required />
      <input {...register('district')} placeholder="District" className="p-3 border rounded-lg" required />
      <input {...register('localLevel')} placeholder="Municipality" className="p-3 border rounded-lg" required />
      <input {...register('ward')} type="number" placeholder="Ward" className="p-3 border rounded-lg" required />
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
      <label>Profile Photo (Optional)</label>
      <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="p-3 border rounded-lg" />
      <label className="flex items-center gap-2">
        <input type="checkbox" {...register('declaration')} required />
        I declare that the information provided is true.
      </label>
      <button type="submit" className="p-4 bg-blue-600 text-white rounded-xl">Submit</button>
      <button type="button" onClick={onBack} className="p-4 bg-gray-200 rounded-xl">Back</button>
    </form>
  );
};

export default MembershipPublicForm;
