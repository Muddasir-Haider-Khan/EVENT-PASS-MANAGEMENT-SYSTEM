'use client';

import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  label?: string;
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  placeholder?: string;
  helpText?: string;
}

export function ImageUpload({
  label,
  value,
  onChange,
  folder = '/epms/uploads',
  placeholder = 'Upload image file or paste URL',
  helpText,
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

  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label className="input-label">{label}</label>}

      {value ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: 12,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-hover)',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 8,
              overflow: 'hidden',
              background: '#000',
              flexShrink: 0,
              border: '1px solid var(--border-default)',
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
              style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace' }}
            >
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gold-light)', marginTop: 2 }}>
              ✓ ImageKit Hosted
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Change
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--error)' }}
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
                border: `2px dashed ${dragActive ? 'var(--gold-primary)' : 'var(--border-default)'}`,
                background: dragActive ? 'rgba(212, 175, 55, 0.05)' : 'var(--bg-root)',
                borderRadius: 10,
                padding: '20px 16px',
                textAlign: 'center',
                cursor: uploading ? 'wait' : 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div className="spinner" style={{ borderTopColor: 'var(--gold-primary)' }} />
                  <span style={{ fontSize: 13, color: 'var(--gold-light)' }}>Uploading to ImageKit...</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                    Click or drag image file here to upload on ImageKit
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Supports PNG, JPG, WebP, GIF, SVG (Max 6MB)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <input
              type="url"
              className="input"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{helpText}</span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold-light)',
                fontSize: 11,
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
        <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 6 }}>
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
