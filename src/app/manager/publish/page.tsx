'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { PageHead } from '@/components/AppShell';
import { Copy, ExternalLink, Globe, Link2 } from 'lucide-react';

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

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast('Registration link copied', 'success');
    } catch {
      toast('Could not copy — select the link manually', 'error');
    }
  }

  if (loading) {
    return (
      <div className="p-14 flex items-center justify-center gap-3 text-muted text-[13px]">
        <span className="spinner" /> Loading…
      </div>
    );
  }

  const publicUrl = currentSlug ? `/event/${currentSlug}` : null;
  const absoluteUrl = currentSlug && typeof window !== 'undefined' ? `${window.location.origin}/event/${currentSlug}` : publicUrl;

  return (
    <>
      <PageHead
        title={<>Registration<br />Form</>}
        description="Publish the public form under a short link and share it with attendees."
      />

      <section className="card p-[18px] max-w-[760px]">
        {currentSlug ? (
          <>
            <div className="card-head mb-4">
              <h2 className="card-title">Public link</h2>
              <span className="badge badge-success">
                <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                Live
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-tile bg-well p-3.5">
              <Link2 className="w-4 h-4 text-muted flex-none" />
              <a href={publicUrl || '#'} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-[15px] font-semibold underline underline-offset-2 decoration-line-2 hover:decoration-fg">
                {absoluteUrl}
              </a>
              <button className="ibtn ibtn--sm" onClick={() => absoluteUrl && copyUrl(absoluteUrl)} aria-label="Copy registration link" title="Copy link">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[13px] text-muted mt-3">The form is accepting registrations. Submissions land in the review queue.</p>

            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-line">
              <a href={publicUrl || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <ExternalLink className="w-4 h-4" /> Open form
              </a>
              <button className="btn btn-ghost sm:ml-auto" onClick={handleUnpublish}>
                Unpublish
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handlePublish}>
            <div className="card-head mb-4">
              <h2 className="card-title">Choose a link</h2>
              <span className="badge badge-neutral">Not published</span>
            </div>

            <label className="input-label" htmlFor="slug">Link name</label>
            <div className="flex items-stretch rounded-field border border-line-2 bg-surface focus-within:border-fg focus-within:ring-[3px] focus-within:ring-line">
              <span className="flex items-center pl-3.5 pr-1 text-[14px] text-muted select-none">/event/</span>
              <input
                id="slug"
                className="flex-1 min-w-0 h-11 bg-transparent border-0 focus:ring-0 px-1 text-[14px] text-fg"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="gala-2026"
                required
                minLength={2}
                maxLength={50}
              />
            </div>
            <p className="text-[12.5px] text-muted mt-1.5">Lowercase letters, numbers and hyphens.</p>

            <button type="submit" className="btn btn-primary mt-5" disabled={publishing || !slug}>
              {publishing ? <span className="spinner !w-3.5 !h-3.5" /> : <Globe className="w-4 h-4" />}
              Publish form
            </button>
          </form>
        )}
      </section>
    </>
  );
}
