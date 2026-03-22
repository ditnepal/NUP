import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const MembershipPublicAssisted: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { register, handleSubmit } = useForm();
  const [units, setUnits] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/v1/public/units').then(res => res.json()).then(setUnits);
  }, []);

  const [idDoc, setIdDoc] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    formData.append('applicationMode', 'ASSISTED');
    if (idDoc) formData.append('identityDocument', idDoc);

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

  if (success) return <div className="p-6 bg-green-100 text-green-800 rounded-xl">Assisted application submitted! Tracking Code: {success}</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <h3 className="font-bold">Applicant Information</h3>
      <input {...register('fullName')} placeholder="Full Name" className="p-3 border rounded-lg" required />
      <input {...register('mobile')} placeholder="Mobile" className="p-3 border rounded-lg" />
      <input {...register('citizenshipNumber')} placeholder="Citizenship Number" className="p-3 border rounded-lg" />
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
      
      <h3 className="font-bold mt-4">Helper Information</h3>
      <input {...register('helperName')} placeholder="Helper Name" className="p-3 border rounded-lg" required />
      <input {...register('helperPhone')} placeholder="Helper Phone" className="p-3 border rounded-lg" required />
      <input {...register('helperRole')} placeholder="Relationship/Role" className="p-3 border rounded-lg" required />
      
      <button type="submit" className="p-4 bg-purple-600 text-white rounded-xl">Submit Assisted</button>
      <button type="button" onClick={onBack} className="p-4 bg-gray-200 rounded-xl">Back</button>
    </form>
  );
};

export default MembershipPublicAssisted;
