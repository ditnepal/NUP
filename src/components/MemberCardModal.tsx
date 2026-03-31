import React from 'react';
import { Member } from '../types';
import { Download, Printer, X } from 'lucide-react';
import MemberIdCard from './MemberIdCard';
import html2canvas from 'html2canvas';

import { toast } from 'sonner';

interface MemberCardModalProps {
  member: Member;
  onClose: () => void;
}

export const MemberCardModal: React.FC<MemberCardModalProps> = ({ member, onClose }) => {
  const handleDownload = async () => {
    const cardElement = document.getElementById('member-id-card-export-target');
    if (!cardElement) return;
    
    try {
      // Wait for fonts to be ready
      if (document.fonts) {
        await document.fonts.ready;
      }

      // Ensure all images are fully loaded and decoded before capture
      const images = cardElement.getElementsByTagName('img');
      const loadPromises = Array.from(images).map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
        // Try to decode the image to ensure it's actually ready to be painted
        try {
          if ('decode' in img) {
            await img.decode();
          }
        } catch (e) {
          console.warn('Image decode failed, proceeding anyway', e);
        }
      });
      
      await Promise.all(loadPromises);
      // Small buffer for rendering engine to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardElement, {
        scale: 2, // 2x scale for 632x400 is perfectly crisp
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 632,
        height: 400,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 632,
        windowHeight: 400,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('member-id-card-export-target');
          if (clonedElement) {
            clonedElement.style.visibility = 'visible';
            clonedElement.style.position = 'static';
            clonedElement.style.left = 'auto';
            clonedElement.style.top = 'auto';
          }
        }
      });
      
      const link = document.createElement('a');
      link.download = `NUP-Member-Card-${member.membershipId || member.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating card image:', error);
      toast.error('Failed to download ID card');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Hidden fixed-size card for export only - positioned off-screen but NOT invisible */}
      <div 
        className="fixed top-0 pointer-events-none" 
        style={{ left: '-9999px', width: '632px', height: '400px', backgroundColor: '#ffffff' }}
      >
        <MemberIdCard member={member} id="member-id-card-export-target" isExporting={true} />
      </div>

      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:border-none">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center print:hidden">
          <h2 className="font-black text-slate-800 uppercase tracking-tight">Digital ID Card</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8">
          <div className="mb-8 flex justify-center">
            <MemberIdCard member={member} id="member-id-card-modal" />
          </div>

          <div className="grid grid-cols-2 gap-3 print:hidden">
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
