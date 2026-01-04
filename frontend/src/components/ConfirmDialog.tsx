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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card" style={{maxWidth: '500px', width: '90%'}}>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-primary">{title}</h3>
          <div className="mt-4">
            <p className="text-secondary">{message}</p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="btn btn-outline"
              style={{borderColor: 'var(--accent-red)', color: 'var(--accent-red)'}}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="btn btn-primary"
              style={{backgroundColor: 'var(--accent-red)'}}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
