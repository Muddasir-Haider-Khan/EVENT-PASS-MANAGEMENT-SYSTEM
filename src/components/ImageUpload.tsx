'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface ImageUploadProps {
  label?: string;
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  placeholder?: string;
  helpText?: string;
  theme?: 'dark' | 'light';
}

export function ImageUpload({
  label,
  value,
  onChange,
  folder = '/epms/uploads',
  placeholder = 'Upload image file or paste URL',
  helpText,
  theme = 'dark',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(file: File) {
    setError(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selected file is not an image (PNG, JPEG, WebP, GIF, SVG)');
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setError('File size exceeds maximum 6MB limit');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/imagekit/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  // Dashboard variant follows the app theme; the light variant sits on the public
  // event page, whose fixed palette never flips with the dashboard theme.
  const isLight = theme === 'light';
  const ui = isLight
    ? {
        label: 'block text-[13px] font-semibold text-ink-900 mb-1.5',
        frame: 'bg-white border border-ink-200',
        drop: 'bg-ink-50 border-ink-300 hover:border-ink-500',
        dropActive: 'bg-ink-100 border-ink-900',
        text: 'text-ink-900',
        muted: 'text-ink-500',
        btn: 'h-8 px-3 rounded-full text-[12.5px] font-semibold border border-ink-300 text-ink-800 bg-white hover:bg-ink-50',
        input: 'w-full h-11 bg-white border border-ink-300 text-ink-900 rounded-[14px] px-3.5 text-sm focus:border-ink-900 focus:ring-0 outline-none',
        error: 'text-negative-600',
      }
    : {
        label: 'input-label',
        frame: 'bg-surface border border-line',
        drop: 'bg-surface border-line-2 hover:border-faint',
        dropActive: 'bg-surface-2 border-fg',
        text: 'text-fg',
        muted: 'text-muted',
        btn: 'btn btn-ghost btn-sm',
        input: 'input',
        error: 'text-negative-400',
      };

  return (
    <div className="mb-1">
      {label && <label className={ui.label}>{label}</label>}

      {value ? (
        <div className={`flex items-center gap-3.5 p-3 rounded-[16px] ${ui.frame}`}>
          <div className="w-14 h-14 rounded-[12px] overflow-hidden flex-none bg-ink-900/10">
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`truncate text-[13px] font-semibold ${ui.text}`}>{value.split('/').pop()}</p>
            <p className={`text-[12px] mt-0.5 ${ui.muted}`}>Uploaded</p>
          </div>
          <div className="flex gap-1.5">
            <button type="button" className={ui.btn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              Replace
            </button>
            <button type="button" className={ui.btn} onClick={() => onChange('')} disabled={uploading}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div>
          {!showUrlInput ? (
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-[16px] border-2 border-dashed px-4 py-6 text-center transition-colors ${uploading ? 'cursor-wait' : 'cursor-pointer'} ${dragActive ? ui.dropActive : ui.drop}`}
            >
              {uploading ? (
                <span className={`inline-flex items-center gap-2 text-[13px] font-semibold ${ui.text}`}>
                  <span className="spinner !w-4 !h-4" /> Uploading…
                </span>
              ) : (
                <>
                  <UploadCloud className={`w-5 h-5 mx-auto mb-2 ${ui.muted}`} aria-hidden="true" />
                  <p className={`text-[13px] font-semibold ${ui.text}`}>Drop an image here, or click to choose</p>
                  <p className={`text-[12px] mt-1 ${ui.muted}`}>PNG, JPG, WebP, GIF or SVG · up to 6 MB</p>
                </>
              )}
            </div>
          ) : (
            <input type="url" className={ui.input} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
          )}

          <div className="flex items-start justify-between gap-3 mt-1.5">
            <span className={`text-[12px] ${ui.muted}`}>{helpText}</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className={`text-[12px] font-semibold underline underline-offset-2 whitespace-nowrap ${ui.text}`}
            >
              {showUrlInput ? 'Upload a file instead' : 'Use an image URL'}
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className={`text-[12.5px] mt-1.5 font-semibold ${ui.error}`}>{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
