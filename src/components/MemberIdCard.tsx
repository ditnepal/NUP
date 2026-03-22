import React from 'react';
import { Member } from '../types';
import logo from '../assets/nup-logo.svg';

interface MemberIdCardProps {
  member: Member;
  id?: string;
  isExporting?: boolean;
}

const MemberIdCard: React.FC<MemberIdCardProps> = ({ member, id, isExporting = false }) => {
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
  
  const hasRealPhoto = Boolean(member.profilePhotoUrl || member.photoUrl);
  const realPhotoUrl = member.profilePhotoUrl || member.photoUrl;
  
  const qrCodeUrl = member.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(member.membershipId || member.id)}`;

  const issueDate = member.issueDate || member.joinedDate || member.createdAt;
  const expiryDate = member.expiryDate || (issueDate ? new Date(new Date(issueDate).setFullYear(new Date(issueDate).getFullYear() + 5)).toISOString() : undefined);

  return (
    <div 
      id={id}
      className={`relative rounded-xl overflow-hidden font-sans ${isExporting ? '' : 'w-full max-w-[400px] aspect-[1.58/1] mx-auto'}`}
      style={{ 
        printColorAdjust: 'exact',
        backgroundColor: '#ffffff',
        backgroundImage: isExporting ? 'none' : 'radial-gradient(#f1f5f9 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        border: '1px solid #e5e7eb',
        boxShadow: isExporting ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: isExporting ? '632px' : undefined,
        height: isExporting ? '400px' : undefined,
        flexShrink: 0,
        zIndex: isExporting ? 100 : undefined,
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
        <img src={logo} alt="NUP Logo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" crossOrigin="anonymous" />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold leading-tight" style={{ color: '#111827' }}>NUP Nepal</h1>
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#4b5563' }}>Nagarik Unmukti Party Nepal</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 mt-4 flex gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          <div 
            className="w-24 h-28 rounded-lg overflow-hidden flex items-center justify-center" 
            style={{ 
              border: '2px solid #f3f4f6', 
              backgroundColor: '#e5e7eb',
              boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            {hasRealPhoto ? (
              <img 
                src={realPhotoUrl} 
                alt={member.fullName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#9ca3af" className="w-16 h-16">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-grow flex flex-col justify-between py-1">
          <div>
            <h2 className="text-lg font-bold leading-tight mb-1" style={{ color: '#111827' }}>{member.fullName}</h2>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase" style={{ color: '#9ca3af' }}>Member ID:</span>
                <span className="text-xs font-mono font-bold" style={{ color: '#374151' }}>{member.membershipId || member.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase" style={{ color: '#9ca3af' }}>Status:</span>
                <span 
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                  style={{ 
                    backgroundColor: statusStyle.bg, 
                    color: statusStyle.text, 
                    border: `1px solid ${statusStyle.border}` 
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
              <p className="text-[10px] font-semibold" style={{ color: '#374151' }}>{formatDate(issueDate)}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase" style={{ color: '#9ca3af' }}>Expiry Date</p>
              <p className="text-[10px] font-semibold" style={{ color: '#374151' }}>{formatDate(expiryDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / QR Section */}
      <div 
        className="absolute bottom-0 left-0 w-full px-4 py-3 flex items-end justify-between"
        style={{ 
          backgroundColor: 'rgba(249, 250, 251, 0.5)', 
          borderTop: '1px solid #f3f4f6' 
        }}
      >
        <p className="text-[9px] font-bold italic" style={{ color: '#9ca3af' }}>Official Digital Membership Card</p>
        <div 
          className="p-1 rounded" 
          style={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="w-10 h-10"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        </div>
      </div>

      {/* Watermark Logo */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ opacity: isExporting ? 0.04 : 0.03 }}
      >
        <img src={logo} alt="" className={isExporting ? "w-64 h-64" : "w-48 h-48"} referrerPolicy="no-referrer" crossOrigin="anonymous" />
      </div>
    </div>
  );
};

export default MemberIdCard;
