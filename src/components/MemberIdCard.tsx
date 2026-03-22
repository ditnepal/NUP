import React from 'react';
import { Member } from '../types';
import logo from '../assets/nup-logo.svg';

interface MemberIdCardProps {
  member: Member;
  id?: string;
}

const MemberIdCard: React.FC<MemberIdCardProps> = ({ member, id }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const statusStyles = {
    PENDING: { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' }, // yellow-100, yellow-800, yellow-200
    VERIFIED: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' }, // blue-100, blue-800, blue-200
    ACTIVE: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' }, // green-100, green-800, green-200
    SUSPENDED: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }, // red-100, red-800, red-200
    TERMINATED: { bg: '#f3f4f6', text: '#1f2937', border: '#e5e7eb' }, // gray-100, gray-800, gray-200
    REJECTED: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' }, // red-100, red-800, red-200
  };

  const currentStatus = member.status || 'PENDING';
  const statusStyle = statusStyles[currentStatus as keyof typeof statusStyles] || statusStyles.PENDING;
  const profilePhoto = member.profilePhotoUrl || member.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`;
  const qrCodeUrl = member.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(member.membershipId || member.id)}`;

  return (
    <div 
      id={id}
      className="relative w-full max-w-[400px] aspect-[1.58/1] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 font-sans print:shadow-none print:border-gray-300 mx-auto"
      style={{ 
        printColorAdjust: 'exact',
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(#f1f5f9 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-2 flex">
        <div className="flex-1" style={{ backgroundColor: '#dc2626' }}></div>
        <div className="flex-1" style={{ backgroundColor: '#facc15' }}></div>
        <div className="flex-1" style={{ backgroundColor: '#16a34a' }}></div>
      </div>

      {/* Header */}
      <div className="pt-4 px-4 flex items-center gap-3">
        <img src={logo} alt="NUP Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold leading-tight" style={{ color: '#111827' }}>NUP Nepal</h1>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#4b5563' }}>Nagarik Unmukti Party Nepal</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 mt-4 flex gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          <div className="w-24 h-28 rounded-lg border-2 overflow-hidden shadow-inner" style={{ borderColor: '#f3f4f6', backgroundColor: '#f9fafb' }}>
            <img 
              src={profilePhoto} 
              alt={member.fullName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Details */}
        <div className="flex-grow flex flex-col justify-between py-1">
          <div>
            <h2 className="text-lg font-bold leading-tight mb-1" style={{ color: '#111827' }}>{member.fullName}</h2>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase" style={{ color: '#9ca3af' }}>Member ID:</span>
                <span className="text-xs font-mono font-bold" style={{ color: '#374151' }}>{member.membershipId || member.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase" style={{ color: '#9ca3af' }}>Status:</span>
                <span 
                  className="text-[10px] px-1.5 py-0.5 rounded-full border font-bold uppercase"
                  style={{ 
                    backgroundColor: statusStyle.bg, 
                    color: statusStyle.text, 
                    borderColor: statusStyle.border 
                  }}
                >
                  {currentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-[8px] font-bold uppercase" style={{ color: '#9ca3af' }}>Issue Date</p>
              <p className="text-[10px] font-semibold" style={{ color: '#374151' }}>{formatDate(member.issueDate || member.joinedDate)}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase" style={{ color: '#9ca3af' }}>Expiry Date</p>
              <p className="text-[10px] font-semibold" style={{ color: '#374151' }}>{formatDate(member.expiryDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / QR Section */}
      <div 
        className="absolute bottom-0 left-0 w-full px-4 py-3 flex items-end justify-between border-t"
        style={{ backgroundColor: 'rgba(249, 250, 251, 0.5)', borderColor: '#f3f4f6' }}
      >
        <p className="text-[9px] font-bold italic" style={{ color: '#9ca3af' }}>Official Digital Membership Card</p>
        <div className="p-1 rounded border shadow-sm" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="w-10 h-10"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Watermark Logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
        <img src={logo} alt="" className="w-48 h-48" referrerPolicy="no-referrer" />
      </div>
    </div>
  );
};

export default MemberIdCard;
