import React from 'react';
import MembershipPublicForm from './MembershipPublicForm';

interface MembershipPublicProps {
  onStatusClick?: (trackingCode?: string, mobile?: string) => void;
  onBack?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  user?: any;
}

const MembershipPublic: React.FC<MembershipPublicProps> = ({ onStatusClick, onBack, user }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <MembershipPublicForm 
        onBack={onBack} 
        onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} 
        user={user} 
      />
    </div>
  );
};

export default MembershipPublic;
