import React from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AvailabilityEditModalProps {
  isOpen: boolean;
  playerName: string;
  currentResponse: 'yes' | 'no' | 'tentative' | 'pending';
  onClose: () => void;
  onUpdate: (response: 'yes' | 'no' | 'tentative') => Promise<void>;
  isLoading?: boolean;
}

const AvailabilityEditModal: React.FC<AvailabilityEditModalProps> = ({
  isOpen,
  playerName,
  currentResponse,
  onClose,
  onUpdate,
  isLoading = false
}) => {
  const [selectedResponse, setSelectedResponse] = React.useState<'yes' | 'no' | 'tentative' | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedResponse(currentResponse === 'pending' ? null : (currentResponse as 'yes' | 'no' | 'tentative'));
    }
  }, [isOpen, currentResponse]);

  const handleSubmit = async () => {
    if (!selectedResponse) return;
    await onUpdate(selectedResponse);
    onClose();
  };

  if (!isOpen) return null;

  const options = [
    {
      id: 'yes',
      label: 'Available',
      icon: <CheckCircle className="w-12 h-12" />,
      color: 'emerald',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      hoverBg: 'hover:bg-emerald-500/30',
      selectedBg: 'bg-emerald-500/40'
    },
    {
      id: 'tentative',
      label: 'Maybe',
      icon: <AlertCircle className="w-12 h-12" />,
      color: 'amber',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      hoverBg: 'hover:bg-amber-500/30',
      selectedBg: 'bg-amber-500/40'
    },
    {
      id: 'no',
      label: 'Not Available',
      icon: <XCircle className="w-12 h-12" />,
      color: 'rose',
      bgColor: 'bg-rose-500/20',
      borderColor: 'border-rose-500/30',
      textColor: 'text-rose-400',
      hoverBg: 'hover:bg-rose-500/30',
      selectedBg: 'bg-rose-500/40'
    }
  ];

  return (
    <div className="fixed inset-x-0 top-[52px] bottom-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="relative p-4 border-b border-white/5 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="text-center">
            <h2 className="text-lg font-bold text-white mb-1">Mark Availability</h2>
            <p className="text-base font-semibold text-emerald-400">{playerName}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedResponse(option.id as 'yes' | 'no' | 'tentative')}
                disabled={isLoading}
                className={`relative p-2.5 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                  selectedResponse === option.id
                    ? `${option.selectedBg} border-${option.color}-500/50`
                    : `${option.bgColor} border-${option.borderColor} ${option.hoverBg}`
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className={`${option.textColor} flex-shrink-0 w-5 h-5 flex items-center justify-center`}>
                  {React.cloneElement(option.icon, { className: "w-4 h-4" })}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className={`text-sm font-medium ${option.textColor}`}>{option.label}</p>
                </div>
                {selectedResponse === option.id && (
                  <div className={`w-4 h-4 rounded-full ${option.bgColor} border-2 border-${option.color}-500 flex items-center justify-center flex-shrink-0`}>
                    <div className={`w-2 h-2 rounded-full bg-${option.color}-500`} />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white text-sm font-medium rounded-lg border border-slate-700/50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedResponse || isLoading}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityEditModal;
