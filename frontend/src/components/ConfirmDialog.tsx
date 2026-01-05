import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md shadow-2xl animate-modal-in" style={{borderRadius: '20px'}}>
        <div className="p-2 md:p-4">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4">{title}</h3>
          <p className="text-secondary text-sm md:text-base leading-relaxed mb-8">{message}</p>
          
          <div className="flex flex-col md:flex-row justify-end gap-3">
            <button
              onClick={onConfirm}
              className="btn btn-primary order-1 md:order-2 h-12 md:h-auto"
              style={{backgroundColor: 'var(--accent-red)'}}
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="btn btn-outline order-2 md:order-1 h-12 md:h-auto"
              style={{borderColor: 'rgba(255,255,255,0.2)', color: 'var(--text-secondary)'}}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
