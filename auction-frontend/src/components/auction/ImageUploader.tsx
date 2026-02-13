'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Link, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  currentImageUrl?: string;
  cropPosition?: string;
  onUpload: (file: File) => Promise<{ imageUrl: string; thumbnailUrl?: string }>;
  onCropPositionChange?: (position: string) => void;
  onUrlChange?: (url: string) => void;
  showCropPicker?: boolean;
  label?: string;
  accept?: string;
}

const CROP_PRESETS = [
  { label: 'Top', value: 'center top' },
  { label: 'Center', value: 'center center' },
  { label: 'Bottom', value: 'center bottom' },
];

export default function ImageUploader({
  currentImageUrl,
  cropPosition = 'center top',
  onUpload,
  onCropPositionChange,
  onUrlChange,
  showCropPicker = false,
  label = 'Image',
  accept = 'image/jpeg,image/png,image/webp',
}: ImageUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [localCropPosition, setLocalCropPosition] = useState(cropPosition);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const result = await onUpload(file);
      setPreviewUrl(result.imageUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleUrlSubmit = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    setPreviewUrl(trimmed);
    onUrlChange?.(trimmed);
    setError(null);
  }, [urlInput, onUrlChange]);

  const handleCropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cropAreaRef.current || !showCropPicker) return;
    const rect = cropAreaRef.current.getBoundingClientRect();
    const yPercent = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const xPercent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const newPosition = `${xPercent}% ${yPercent}%`;
    setLocalCropPosition(newPosition);
    onCropPositionChange?.(newPosition);
  }, [showCropPicker, onCropPositionChange]);

  const handlePresetClick = useCallback((value: string) => {
    setLocalCropPosition(value);
    onCropPositionChange?.(value);
  }, [onCropPositionChange]);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">{label}</label>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-slate-900/50 rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'upload' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Upload className="w-3 h-3" /> Upload
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === 'url' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Link className="w-3 h-3" /> URL
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-white/10 hover:border-white/20 bg-slate-900/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-400">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-slate-500" />
              <span className="text-xs text-slate-400">
                Drop an image here or <span className="text-emerald-400">click to browse</span>
              </span>
              <span className="text-[10px] text-slate-600">JPEG, PNG, WebP • Max 2MB • Min 200×200</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="https://example.com/image.jpg"
            className="input-field flex-1 text-sm"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 disabled:opacity-40 transition-colors"
          >
            Set
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Preview + crop picker */}
      {previewUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Preview</span>
            <button
              type="button"
              onClick={() => { setPreviewUrl(''); onUrlChange?.(''); }}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="flex gap-4 items-start">
            {/* Full preview with crop indicator */}
            {showCropPicker ? (
              <div className="space-y-2">
                <div
                  ref={cropAreaRef}
                  onClick={handleCropClick}
                  className="relative w-40 h-48 rounded-xl overflow-hidden border border-white/10 cursor-crosshair group"
                >
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setError('Image failed to load')}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white/80 bg-black/50 px-2 py-1 rounded">Click to set focal point</span>
                  </div>
                </div>

                {/* Crop presets */}
                <div className="flex gap-1">
                  {CROP_PRESETS.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePresetClick(preset.value)}
                      className={`flex-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                        localCropPosition === preset.value
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Avatar preview (how it looks in the UI) */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-600">As avatar</span>
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: localCropPosition }}
                  onError={() => {}}
                />
              </div>
              {showCropPicker && (
                <span className="text-[9px] text-slate-600 block">{localCropPosition}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
