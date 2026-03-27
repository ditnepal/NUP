import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  showReasonInput?: boolean;
  isReasonRequired?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  showReasonInput = false,
  isReasonRequired = false,
}) => {
  const [reason, setReason] = React.useState('');

  if (!isOpen) return null;

  const isConfirmDisabled = showReasonInput && isReasonRequired && !reason.trim();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <p className="mb-4">{message}</p>
        {showReasonInput && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Decision Note / Reason {isReasonRequired && <span className="text-rose-500">*</span>} (Max 300 chars)
            </label>
            <textarea
              className={`w-full border rounded-lg p-3 text-sm focus:ring-2 outline-none ${
                isConfirmDisabled ? 'border-amber-200 focus:ring-amber-500' : 'focus:ring-blue-500'
              }`}
              placeholder={isReasonRequired ? "Explain the reason for this action (Required)..." : "Explain the reason for this action..."}
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value.substring(0, 300))}
              rows={3}
            />
            <div className="text-[10px] text-gray-400 text-right mt-1">
              {reason.length}/300
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button 
            disabled={isConfirmDisabled}
            onClick={() => {
              onConfirm(reason);
              setReason('');
              onClose();
            }} 
            className={`px-4 py-2 text-white rounded transition-all ${
              isConfirmDisabled ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
