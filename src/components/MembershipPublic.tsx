import React, { useState } from 'react';
import MembershipPublicForm from './MembershipPublicForm';
import MembershipPublicVideo from './MembershipPublicVideo';
import MembershipPublicAssisted from './MembershipPublicAssisted';

const MembershipPublic: React.FC = () => {
  const [mode, setMode] = useState<'FORM' | 'VIDEO' | 'ASSISTED' | null>(null);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Membership Application</h1>
      {!mode && (
        <div className="grid gap-4">
          <button onClick={() => setMode('FORM')} className="p-6 bg-blue-600 text-white rounded-xl text-xl">Apply by Form</button>
          <button onClick={() => setMode('VIDEO')} className="p-6 bg-green-600 text-white rounded-xl text-xl">Apply by Video</button>
          <button onClick={() => setMode('ASSISTED')} className="p-6 bg-purple-600 text-white rounded-xl text-xl">Apply with Help</button>
        </div>
      )}
      {mode === 'FORM' && <MembershipPublicForm onBack={() => setMode(null)} />}
      {mode === 'VIDEO' && <MembershipPublicVideo onBack={() => setMode(null)} />}
      {mode === 'ASSISTED' && <MembershipPublicAssisted onBack={() => setMode(null)} />}
    </div>
  );
};

export default MembershipPublic;
