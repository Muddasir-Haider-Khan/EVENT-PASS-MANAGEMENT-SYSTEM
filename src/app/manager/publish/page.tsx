'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

export default function PublishPage() {
  const { toast } = useToast();
  const [slug, setSlug] = useState('');
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const rootDomain = '27mediaagency.com';

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/manager/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.event.slug) {
          setCurrentSlug(data.event.slug);
          setSlug(data.event.slug);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

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
        toast('Form published!', 'success');
      } else {
        toast(data.error || 'Publish failed', 'error');
      }
    } catch { toast('Network error', 'error'); }
    finally { setPublishing(false); }
  }

  async function handleUnpublish() {
    try {
      const res = await fetch('/api/manager/publish', { method: 'DELETE' });
      if (res.ok) {
        setCurrentSlug(null);
        setSlug('');
        toast('Form unpublished', 'success');
      }
    } catch { toast('Network error', 'error'); }
  }

  if (loading) return <div style={{ padding: 24 }}><div className="spinner" /></div>;

  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-headline" style={{ marginBottom: 20 }}>Publish Form</h1>

      <div className="card" style={{ padding: 24, maxWidth: 500 }}>
        {currentSlug ? (
          <div>
            <div className="badge badge-success" style={{ marginBottom: 12 }}>Live</div>
            <p className="text-body" style={{ marginBottom: 8 }}>Your registration form is live at:</p>
            <a
              href={`https://${currentSlug}.${rootDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-mono"
              style={{ color: 'var(--info)', fontSize: 15, display: 'block', marginBottom: 20 }}
            >
              {currentSlug}.{rootDomain} ↗
            </a>
            <button className="btn btn-ghost" onClick={handleUnpublish}>
              Unpublish
            </button>
          </div>
        ) : (
          <form onSubmit={handlePublish}>
            <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Choose a slug for your public registration form. It will be accessible at <strong>{slug || 'your-slug'}.{rootDomain}</strong>
            </p>

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="input-label">Slug</label>
                <input
                  className="input text-mono"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. lymun"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={publishing || !slug}>
                {publishing ? <span className="spinner" /> : 'Publish'}
              </button>
            </div>

            <p className="text-caption" style={{ color: 'var(--text-dim)', marginTop: 8 }}>
              Lowercase letters, numbers, and hyphens only
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
