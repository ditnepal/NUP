import React, { useRef } from 'react';
import { Member } from '../types';
import { Download, Printer, X } from 'lucide-react';
import MemberIdCard from './MemberIdCard';
import html2canvas from 'html2canvas';

interface MemberCardModalProps {
  member: Member;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({ member, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // High quality
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `NUP-Member-Card-${member.membershipId || member.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating card image:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:hidden">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-black text-slate-800 uppercase tracking-tight">Digital ID Card</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8">
          <div className="mb-8 flex justify-center">
            <MemberIdCard member={member} id="member-id-card-modal" />
            {/* Hidden copy for high-quality capture */}
            <div className="fixed -left-[9999px] top-0">
              <div ref={cardRef}>
                <MemberIdCard member={member} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              <Download size={18} />
              Download
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Printer size={18} />
              Print Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
