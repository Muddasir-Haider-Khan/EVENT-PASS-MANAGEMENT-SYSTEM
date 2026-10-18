'use client';

import { useEffect, useState } from 'react';
import { PageHead } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, CheckCircle2, AlertCircle, Users, Tags, Building, Filter } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

export default function ManagerBroadcastPage() {
  const [targetType, setTargetType] = useState<'all' | 'participant_type' | 'group' | 'submission_status'>('all');
  const [participantTypeId, setParticipantTypeId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'DECLINED'>('APPROVED');
  
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [types, setTypes] = useState<Option[]>([]);
  const [groups, setGroups] = useState<Option[]>([]);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string; totalRecipients?: number; sentCount?: number } | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [tRes, gRes] = await Promise.all([
          fetch('/api/manager/participant-types'),
          fetch('/api/manager/groups'),
        ]);
        if (tRes.ok) {
          const tData = await tRes.json();
          setTypes(tData.participantTypes || []);
        }
        if (gRes.ok) {
          const gData = await gRes.json();
          setGroups(gData.groups || []);
        }
      } catch {
        // Handled silently
      }
    }
    loadOptions();
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    if (!confirm('Are you sure you want to broadcast this email to targeted participants?')) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/manager/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          targetType,
          participantTypeId: targetType === 'participant_type' ? participantTypeId : undefined,
          groupId: targetType === 'group' ? groupId : undefined,
          statusFilter: targetType === 'submission_status' ? statusFilter : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, totalRecipients: data.totalRecipients, sentCount: data.sentCount });
        setSubject('');
        setBody('');
      } else {
        setResult({ error: data.error || 'Failed to send broadcast' });
      }
    } catch {
      setResult({ error: 'Network request error' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4 max-w-[980px]">
      <PageHead
        title={<>Email<br />Broadcast</>}
        description="Send announcements, schedule changes or gate instructions to everyone, or to a category, delegation or entry status."
      />

      {result && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            result.success
              ? 'bg-positive-500/10 border border-positive-500/20 text-positive-400'
              : 'bg-negative-500/10 border border-negative-500/20 text-negative-400'
          }`}
        >
          {result.success ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Broadcast dispatched! Successfully sent {result.sentCount} of {result.totalRecipients} emails.</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>{result.error}</span>
            </>
          )}
        </div>
      )}

      <Card variant="glass" className="p-6 border-ink-800 space-y-6">
        {/* Recipient Targeting Selector */}
        <div className="space-y-4">
          <label className="input-label">
            1. Select Recipient Audience
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { id: 'all', label: 'All Attendees', icon: Users },
              { id: 'participant_type', label: 'By Category', icon: Tags },
              { id: 'group', label: 'By Delegation', icon: Building },
              { id: 'submission_status', label: 'By Status', icon: Filter },
            ].map((option) => {
              const Icon = option.icon;
              const active = targetType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTargetType(option.id as 'all' | 'participant_type' | 'group' | 'submission_status')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    active
                      ? 'bg-accent-600/20 border-accent-500 text-ink-50 shadow-lg'
                      : 'bg-ink-950/60 border-ink-800 text-ink-400 hover:text-ink-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${active ? 'text-accent-400' : 'text-ink-400'}`} />
                  <span className="text-xs font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>

          {/* Conditional Target Filters */}
          {targetType === 'participant_type' && (
            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1">
                Choose Participant Category
              </label>
              <select
                value={participantTypeId}
                onChange={(e) => setParticipantTypeId(e.target.value)}
                className="select"
              >
                <option value="">-- Select Category --</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'group' && (
            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1">
                Choose Delegation / Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="select"
              >
                <option value="">-- Select Delegation --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'submission_status' && (
            <div>
              <label className="block text-xs font-semibold text-ink-300 mb-1">
                Filter Submissions by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'PENDING' | 'APPROVED' | 'DECLINED')}
                className="select"
              >
                <option value="APPROVED">Approved Pass Holders</option>
                <option value="PENDING">Pending Review Submissions</option>
                <option value="DECLINED">Declined Submissions</option>
              </select>
            </div>
          )}
        </div>

        {/* Email Content Editor */}
        <form onSubmit={handleSend} className="space-y-4 pt-4 border-t border-ink-800">
          <label className="input-label">
            2. Compose Email Content
          </label>

          <div>
            <label className="block text-xs font-semibold text-ink-300 mb-1">
              Email Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="e.g. Important Announcement: Committee Schedule Updated"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-300 mb-1">
              Message Body *
            </label>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              placeholder="Write your broadcast message here..."
              className="input"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={sending}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Send Broadcast Email
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
