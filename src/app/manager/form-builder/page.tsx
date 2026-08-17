'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

type FieldType = 'SHORT_TEXT' | 'PARAGRAPH' | 'EMAIL' | 'NUMBER' | 'DROPDOWN' | 'RADIO' | 'CHECKBOX' | 'DATE';

interface FormField {
  id?: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[] | null;
  order: number;
  isLocked: boolean;
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  SHORT_TEXT: 'Short Text',
  PARAGRAPH: 'Paragraph',
  EMAIL: 'Email',
  NUMBER: 'Number',
  DROPDOWN: 'Dropdown',
  RADIO: 'Multiple Choice',
  CHECKBOX: 'Checkboxes',
  DATE: 'Date',
};

const NEEDS_OPTIONS: FieldType[] = ['DROPDOWN', 'RADIO', 'CHECKBOX'];

export default function FormBuilderPage() {
  const { toast } = useToast();
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/manager/form-fields');
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields);
      }
      setLoading(false);
    }
    load();
  }, []);

  function addField() {
    setFields([...fields, {
      label: '',
      type: 'SHORT_TEXT',
      required: false,
      options: null,
      order: fields.length,
      isLocked: false,
    }]);
  }

  function updateField(index: number, updates: Partial<FormField>) {
    setFields(fields.map((f, i) => i === index ? { ...f, ...updates } : f));
  }

  function removeField(index: number) {
    if (fields[index].isLocked) return;
    setFields(fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })));
  }

  function moveField(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields.map((f, i) => ({ ...f, order: i })));
  }

  async function handleSave() {
    // Validate
    for (const field of fields) {
      if (!field.label.trim()) {
        toast('All fields must have a label', 'error');
        return;
      }
      if (NEEDS_OPTIONS.includes(field.type) && (!field.options || field.options.length === 0)) {
        toast(`"${field.label}" needs at least one option`, 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/manager/form-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields);
        toast('Form saved', 'success');
      } else {
        const data = await res.json();
        toast(data.error || 'Save failed', 'error');
      }
    } catch { toast('Network error', 'error'); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 24 }}><div className="spinner" /></div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="text-headline">Form Builder</h1>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Build your event registration form
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" /> : 'Save Form'}
        </button>
      </div>

      <div style={{ maxWidth: 640 }}>
        {fields.map((field, index) => (
          <div key={field.id || index} className="card" style={{ padding: 20, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {field.isLocked && <span className="badge badge-info">Locked</span>}
                <span className="text-overline" style={{ color: 'var(--text-muted)' }}>
                  {FIELD_TYPE_LABELS[field.type]}
                </span>
              </div>
              {!field.isLocked && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveField(index, -1)} disabled={index === 0}>↑</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveField(index, 1)} disabled={index === fields.length - 1}>↓</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => removeField(index)}>✕</button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                <div>
                  <label className="input-label">Label</label>
                  <input
                    className="input"
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder="Field label"
                    disabled={field.isLocked}
                  />
                </div>
                {!field.isLocked && (
                  <div>
                    <label className="input-label">Type</label>
                    <select
                      className="select"
                      value={field.type}
                      onChange={(e) => updateField(index, {
                        type: e.target.value as FieldType,
                        options: NEEDS_OPTIONS.includes(e.target.value as FieldType) ? [''] : null,
                      })}
                    >
                      {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {NEEDS_OPTIONS.includes(field.type) && (
                <div>
                  <label className="input-label">Options</label>
                  {(field.options || []).map((opt, optIdx) => (
                    <div key={optIdx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <input
                        className="input"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(field.options || [])];
                          newOpts[optIdx] = e.target.value;
                          updateField(index, { options: newOpts });
                        }}
                        placeholder={`Option ${optIdx + 1}`}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--error)' }}
                        onClick={() => {
                          const newOpts = (field.options || []).filter((_, i) => i !== optIdx);
                          updateField(index, { options: newOpts });
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => updateField(index, { options: [...(field.options || []), ''] })}
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {!field.isLocked && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    style={{ accentColor: 'var(--color-secondary)' }}
                  />
                  <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>Required</span>
                </label>
              )}
            </div>
          </div>
        ))}

        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={addField}>
          + Add Field
        </button>
      </div>
    </div>
  );
}
