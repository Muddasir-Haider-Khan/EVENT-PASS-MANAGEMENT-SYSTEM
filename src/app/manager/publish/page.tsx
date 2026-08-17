'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';

export default function PublishPage() {
  const { toast } = useToast();
  const [slug, setSlug] = useState('');
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const loadPublishState = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.event.slug) {
          setCurrentSlug(data.event.slug);
          setSlug(data.event.slug);
        }
      }
    } catch {
      toast('Failed to load publishing state', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPublishState();
  }, [loadPublishState]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setPublishing(true);
    try {
      const res = await fetch('/api/manager/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentSlug(slug);
        toast('Form published successfully!', 'success');
      } else {
        toast(data.error || 'Publish failed', 'error');
      }
    } catch {
      toast('Network communication error', 'error');
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish() {
    try {
      const res = await fetch('/api/manager/publish', { method: 'DELETE' });
      if (res.ok) {
        setCurrentSlug(null);
        setSlug('');
        toast('Form unpublished', 'success');
      }
    } catch {
      toast('Network communication error', 'error');
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--gold-primary)' }} />
      </div>
    );
  }

  const publicUrl = currentSlug ? `/event/${currentSlug}` : null;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="text-overline" style={{ color: 'var(--gold-light)' }}>27 MEDIA AGENCY • PUBLIC FORM LAUNCH</span>
        <h1 className="text-headline gold-gradient-text" style={{ marginTop: 4 }}>
          Publish & QR Distribution
        </h1>
        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Set your custom event URL slug and launch the public registration form.
        </p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        {currentSlug ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span className="badge badge-gold">🟢 Live & Accepting Registrations</span>
            </div>

            <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              Your event registration pass portal is live and accessible at:
            </p>

            <a
              href={publicUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-mono gold-gradient-text"
              style={{ fontSize: 18, fontWeight: 700, display: 'block', marginBottom: 24, textDecoration: 'underline' }}
            >
              {typeof window !== 'undefined' ? `${window.location.origin}/event/${currentSlug}` : `/event/${currentSlug}`} ↗
            </a>

            <div style={{ display: 'flex', gap: 12 }}>
              <a
                href={publicUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold"
                style={{ textDecoration: 'none' }}
              >
                Open Public Pass Form ↗
              </a>

              <button className="btn btn-ghost" style={{ color: 'var(--error)' }} onClick={handleUnpublish}>
                Unpublish Form
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish}>
            <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Specify a custom URL slug for your public registration form.
            </p>

            <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
              <div>
                <label className="input-label">Event URL Slug *</label>
                <input
                  className="input text-mono"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. gala-2026"
                  required
                  minLength={2}
                  maxLength={50}
                  style={{ fontSize: 15 }}
                />
                <p className="text-caption" style={{ color: 'var(--text-muted)', marginTop: 6 }}>
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>
            </div>

            <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 44 }} disabled={publishing || !slug}>
              {publishing ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Publish Event Pass Form →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
