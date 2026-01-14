import React, { useState } from 'react';
import { X, Link2, Copy, Check, ExternalLink, Loader2, Share2 } from 'lucide-react';
import { generatePublicLink } from '../services/api';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'match' | 'payment';
  resourceId: string;
  resourceTitle: string;
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await generatePublicLink({
        resourceType,
        resourceId,
        viewType: 'full'
      });
      
      if (response.success) {
        setGeneratedUrl(response.data.url);
      } else {
        setError(response.error || 'Failed to generate link');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedUrl) return;
    
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenLink = () => {
    if (generatedUrl) {
      window.open(generatedUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Share Link</h3>
              <p className="text-xs text-slate-400">Anyone with link can view</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
            <p className="text-sm text-slate-300 font-medium">{resourceTitle}</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">{resourceType} Details</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!generatedUrl ? (
            <button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  Generate Shareable Link
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              {/* Generated URL Display */}
              <div className="bg-slate-800 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-slate-500 mb-1">Shareable Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-emerald-400 font-mono truncate outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
                <button
                  onClick={handleOpenLink}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-xl font-medium transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </button>
              </div>

              {/* Info */}
              <p className="text-xs text-slate-500 text-center">
                🔗 This link never expires and can be shared with anyone
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;
