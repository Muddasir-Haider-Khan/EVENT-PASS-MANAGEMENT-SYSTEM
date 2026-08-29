'use client';

import React, { useState, useRef } from 'react';

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
      const msg = err instanceof Error ? err.message : 'Failed to upload image to ImageKit';
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

  const isLight = theme === 'light';

  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLight ? 'text-slate-800' : 'input-label'}`}>
          {label}
        </label>
      )}

      {value ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 12,
            background: isLight ? '#F8FAFC' : 'var(--bg-surface)',
            border: isLight ? '1px solid #E2E8F0' : '1px solid var(--border-hover)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 8,
              overflow: 'hidden',
              background: isLight ? '#E2E8F0' : '#000',
              flexShrink: 0,
              border: isLight ? '1px solid #CBD5E1' : '1px solid var(--border-default)',
            }}
          >
            <img
              src={value}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div
              className="truncate"
              style={{
                fontSize: 13,
                color: isLight ? '#0F172A' : 'var(--text-primary)',
                fontFamily: 'IBM Plex Mono, monospace',
                fontWeight: 600,
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 11, color: isLight ? '#16A34A' : 'var(--gold-light)', marginTop: 2, fontWeight: 600 }}>
              ✓ ImageKit Hosted
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={isLight ? 'px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100' : 'btn btn-ghost btn-sm'}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Change
            </button>
            <button
              type="button"
              className={isLight ? 'px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100' : 'btn btn-ghost btn-sm'}
              style={isLight ? undefined : { color: 'var(--error)' }}
              onClick={() => onChange('')}
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div>
          {!showUrlInput ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? (isLight ? '#4F46E5' : 'var(--gold-primary)') : (isLight ? '#CBD5E1' : 'var(--border-default)')}`,
                background: dragActive ? (isLight ? 'rgba(79, 70, 229, 0.05)' : 'rgba(212, 175, 55, 0.05)') : (isLight ? '#F8FAFC' : 'var(--bg-root)'),
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
                cursor: uploading ? 'wait' : 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div className="spinner" style={{ borderTopColor: isLight ? '#4F46E5' : 'var(--gold-primary)' }} />
                  <span style={{ fontSize: 13, color: isLight ? '#4F46E5' : 'var(--gold-light)', fontWeight: 600 }}>Uploading to ImageKit...</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isLight ? '#0F172A' : 'var(--text-primary)' }}>
                    Click or drag image file here to upload on ImageKit
                  </div>
                  <div style={{ fontSize: 11, color: isLight ? '#64748B' : 'var(--text-muted)', marginTop: 4 }}>
                    Supports PNG, JPG, WebP, GIF, SVG (Max 6MB)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <input
              type="url"
              className={isLight ? 'w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-indigo-600 outline-none' : 'input'}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: isLight ? '#64748B' : 'var(--text-muted)' }}>{helpText}</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              style={{
                background: 'none',
                border: 'none',
                color: isLight ? '#4F46E5' : 'var(--gold-light)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {showUrlInput ? '← Upload File to ImageKit' : 'Paste Direct Image URL'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: isLight ? '#DC2626' : 'var(--error)', fontSize: 12, marginTop: 6, fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
