import React, { useState } from 'react';
import MembershipPublicForm from './MembershipPublicForm';
import MembershipPublicVideo from './MembershipPublicVideo';
import MembershipPublicAssisted from './MembershipPublicAssisted';

interface MembershipPublicProps {
  onStatusClick?: (trackingCode?: string, mobile?: string) => void;
}

const MembershipPublic: React.FC<MembershipPublicProps> = ({ onStatusClick }) => {
  const [mode, setMode] = useState<'FORM' | 'VIDEO' | 'ASSISTED' | null>(null);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Membership Application</h1>
      {!mode && (
        <div className="grid gap-4">
          <button onClick={() => setMode('FORM')} className="p-6 bg-blue-600 text-white rounded-xl text-xl">Apply by Form</button>
          <button onClick={() => setMode('VIDEO')} className="p-6 bg-green-600 text-white rounded-xl text-xl">Apply by Video</button>
          <button onClick={() => setMode('ASSISTED')} className="p-6 bg-purple-600 text-white rounded-xl text-xl">Apply with Help</button>
          <button onClick={() => onStatusClick?.()} className="p-4 bg-slate-200 text-slate-700 rounded-xl font-bold mt-4">Already Applied? Check Status</button>
        </div>
      )}
      {mode === 'FORM' && <MembershipPublicForm onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
      {mode === 'VIDEO' && <MembershipPublicVideo onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
      {mode === 'ASSISTED' && <MembershipPublicAssisted onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
    </div>
  );
};

export default MembershipPublic;
