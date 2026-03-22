import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  showReasonInput?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  showReasonInput = false,
}) => {
  const [reason, setReason] = React.useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <p className="mb-4">{message}</p>
        {showReasonInput && (
          <textarea
            className="w-full border rounded p-2 mb-4"
            placeholder="Enter reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button 
            onClick={() => {
              onConfirm(reason);
              setReason('');
              onClose();
            }} 
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
