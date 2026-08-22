'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Ticket,
  MapPin,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Send,
  AlertCircle,
  Camera,
  Upload,
  UserCheck,
  Users,
  Layers,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  order: number;
}

interface CustomField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  order: number;
}

interface ParticipantType {
  id: string;
  name: string;
  description: string | null;
  fee: number;
  isGroupType: boolean;
  minGroupSize: number;
  maxGroupSize: number;
  customFields: CustomField[];
}

interface ParticipantGroup {
  id: string;
  name: string;
  institution: string | null;
}

interface EventInfo {
  id: string;
  name: string;
  slug: string;
  venue: string;
  eventDate: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  customFontFileUrl?: string;
  customFontUrl?: string;
  eventType?: 'NORMAL' | 'MUN';
}

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [participantTypes, setParticipantTypes] = useState<ParticipantType[]>([]);
  const [participantGroups, setParticipantGroups] = useState<ParticipantGroup[]>([]);
  const [payment, setPayment] = useState<{ accountNumber?: string; paymentPhone?: string }>({});
  
  // Selection states
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [groupName, setGroupName] = useState('');
  const [institution, setInstitution] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Answers & Form state
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [email, setEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/public/${slug}/form`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setEvent(data.event);
        setFields(data.fields || []);
        setParticipantTypes(data.participantTypes || []);
        setParticipantGroups(data.participantGroups || []);
        setPayment(data.payment || {});

        if (data.participantTypes && data.participantTypes.length > 0) {
          setSelectedTypeId(data.participantTypes[0].id);
        }
      } catch {
        // Handled silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const selectedType = participantTypes.find((t) => t.id === selectedTypeId);

  async function handlePhotoUpload(file: File) {
    if (!file) return;
    setUploadingPhoto(true);
    setError('');

    // Preview locally
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      // Fetch ImageKit auth signatures
      const authRes = await fetch('/api/imagekit/auth');
      if (!authRes.ok) throw new Error('Failed to get upload authorization');
      const authData = await authRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `mun_photo_${Date.now()}_${file.name}`);
      formData.append('publicKey', authData.publicKey || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '');
      formData.append('signature', authData.signature);
      formData.append('expire', authData.expire);
      formData.append('token', authData.token);
      formData.append('folder', '/mun_badges');

      const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Image upload failed');
      const uploadData = await uploadRes.json();
      setPhotoUrl(uploadData.url);
    } catch {
      // Fallback: store base64 string if upload fails or env missing
      const base64Reader = new FileReader();
      base64Reader.onloadend = () => {
        setPhotoUrl(base64Reader.result as string);
      };
      base64Reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (event?.eventType === 'MUN') {
      if (!photoUrl && !photoPreview) {
        setError('A high-resolution delegate photo is required for physical ID pass verification.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          email,
          photoUrl: photoUrl || photoPreview,
          participantTypeId: selectedTypeId || null,
          groupId: selectedGroupId || null,
          groupName: groupName || null,
          institution: institution || null,
          answers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch {
      setError('Network communication error');
    } finally {
      setSubmitting(false);
    }
  }

  function updateResponse(fieldId: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  }

  function updateAnswer(fieldId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card variant="glass" className="max-w-md w-full p-8 text-center border-slate-800">
          <h1 className="text-xl font-bold text-white mb-2">Event Not Found</h1>
          <p className="text-sm text-slate-400">
            This event pass registration page is either unavailable or has expired.
          </p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <ThemeProvider
        primaryColor={event.primaryColor}
        secondaryColor={event.secondaryColor}
        accentColor={event.accentColor}
        fontFamily={event.fontFamily}
        customFontFileUrl={event.customFontFileUrl}
        customFontUrl={event.customFontUrl}
      >
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 antialiased">
          <Card variant="glass" className="max-w-lg w-full p-8 text-center border-slate-800 shadow-2xl space-y-6">

            {event.logoUrl ? (
              <img
                src={event.logoUrl}
                alt={event.name}
                className="w-20 h-20 rounded-2xl object-cover mx-auto border border-slate-700 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <Ticket className="w-8 h-8" />
              </div>
            )}

            <div>
              <Badge variant="green" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                Registration Submitted
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight mt-3 mb-2">
                Registration Complete!
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Your registration for <strong className="text-white">{event.name}</strong> has been received.
                Your digital pass and security QR code will be issued upon review.
              </p>
            </div>

            {(payment.accountNumber || payment.paymentPhone) && (
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-4">
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                  Payment & Verification Instructions
                </h3>

                {payment.accountNumber && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Bank Account / IBAN
                    </span>
                    <div className="flex items-center justify-between mt-1 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="font-mono text-sm font-semibold text-white">
                        {payment.accountNumber}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        onClick={() => {
                          navigator.clipboard.writeText(payment.accountNumber || '');
                          setCopiedAcc(true);
                          setTimeout(() => setCopiedAcc(false), 2000);
                        }}
                      >
                        {copiedAcc ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                )}

                {payment.paymentPhone && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Send Receipt To
                    </span>
                    <div className="flex items-center justify-between mt-1 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                      <span className="font-mono text-sm font-semibold text-amber-300">
                        {payment.paymentPhone}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        onClick={() => {
                          navigator.clipboard.writeText(payment.paymentPhone || '');
                          setCopiedPhone(true);
                          setTimeout(() => setCopiedPhone(false), 2000);
                        }}
                      >
                        {copiedPhone ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      primaryColor={event.primaryColor}
      secondaryColor={event.secondaryColor}
      accentColor={event.accentColor}
      fontFamily={event.fontFamily}
      customFontFileUrl={event.customFontFileUrl}
      customFontUrl={event.customFontUrl}
    >
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 antialiased">
        <div className="max-w-xl w-full space-y-6">
          {/* Top Brand Banner */}
          <div className="text-center space-y-4">

            <div className="pt-2">
              {event.logoUrl && (
                <img
                  src={event.logoUrl}
                  alt={event.name}
                  className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border border-slate-700 shadow-xl"
                />
              )}
              <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
                {event.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs font-medium text-slate-300">
                <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{event.venue}</span>
                </span>
                {event.eventDate && (
                  <span className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                )}
                {event.eventType === 'MUN' && (
                  <span className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-500/20 font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Official Model UN</span>
                  </span>
                )}
              </div>

              {event.description && (
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-3 leading-relaxed">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          {/* Registration Form Card */}
          <Card variant="glass" className="p-6 sm:p-8 border-slate-800 shadow-2xl">
            <div className="border-b border-slate-800 pb-4 mb-6">
              <h2 className="text-base font-bold text-white">
                {event.eventType === 'MUN' ? 'MUN Participant Registration' : 'Attendee Pass Registration'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Please fill out all required details to issue your official event entry pass.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* MUN Specific - Step 1: Select Participant Type */}
              {event.eventType === 'MUN' && participantTypes.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Select Registration Category *</span>
                  </label>

                  <div className="grid grid-cols-1 gap-2.5">
                    {participantTypes.map((t) => {
                      const isSelected = selectedTypeId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTypeId(t.id)}
                          className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600/15 border-indigo-500 text-white'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{t.name}</span>
                              {t.isGroupType && (
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded">
                                  Group Delegation
                                </span>
                              )}
                            </div>
                            {t.description && (
                              <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-400 block">
                              {t.fee > 0 ? `$${t.fee}` : 'Free'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MUN Specific - Delegate Headshot Photo Upload */}
              {event.eventType === 'MUN' && (
                <div className="space-y-2 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    <span>Delegate ID Photo Upload *</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    High-resolution clear headshot required for physical identity verification at entrance gates.
                  </p>

                  <div className="flex items-center gap-4 pt-2">
                    {photoPreview || photoUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-500 shrink-0">
                        <img src={photoPreview || photoUrl} alt="Delegate preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0">
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-[9px]">Photo</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{uploadingPhoto ? 'Processing...' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]);
                          }}
                        />
                      </label>
                      {photoUrl && <p className="text-[10px] text-emerald-400 font-semibold mt-1">Photo attached successfully</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Group Delegation Selection / Input if applicable */}
              {event.eventType === 'MUN' && selectedType?.isGroupType && (
                <div className="space-y-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Delegation Group Details</span>
                  </label>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Delegation / School Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Aitchison College Delegation"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Institution</label>
                    <input
                      type="text"
                      placeholder="e.g. Aitchison College"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-sm text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Standard Event Form Fields */}
              {fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {field.label} {field.required && <span className="text-amber-400">*</span>}
                  </label>

                  {field.type === 'EMAIL' ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        updateResponse(field.id, e.target.value);
                      }}
                      required={field.required}
                      placeholder="your.email@example.com"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base text-white placeholder-slate-500 rounded-xl px-4 py-3 transition outline-none"
                    />
                  ) : field.type === 'SHORT_TEXT' ? (
                    <input
                      type="text"
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base text-white placeholder-slate-500 rounded-xl px-4 py-3 transition outline-none"
                    />
                  ) : field.type === 'PARAGRAPH' ? (
                    <textarea
                      rows={3}
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base text-white placeholder-slate-500 rounded-xl p-4 transition outline-none resize-y"
                    />
                  ) : field.type === 'NUMBER' ? (
                    <input
                      type="number"
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base text-white placeholder-slate-500 rounded-xl px-4 py-3 transition outline-none"
                    />
                  ) : field.type === 'DATE' ? (
                    <input
                      type="date"
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base text-white placeholder-slate-500 rounded-xl px-4 py-3 transition outline-none"
                    />
                  ) : field.type === 'DROPDOWN' ? (
                    <select
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-base text-white rounded-xl px-4 py-3 transition outline-none"
                    >
                      <option value="">-- Choose Option --</option>
                      {(field.options || []).map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'RADIO' ? (
                    <div className="space-y-2 pt-1">
                      {(field.options || []).map((opt, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer text-sm text-slate-200">
                          <input
                            type="radio"
                            name={field.id}
                            value={opt}
                            checked={responses[field.id] === opt}
                            onChange={() => updateResponse(field.id, opt)}
                            required={field.required}
                            className="w-4 h-4 accent-indigo-500 cursor-pointer"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'CHECKBOX' ? (
                    <div className="space-y-2 pt-1">
                      {(field.options || []).map((opt, i) => (
                        <label key={i} className="flex items-center gap-3 cursor-pointer text-sm text-slate-200">
                          <input
                            type="checkbox"
                            checked={((responses[field.id] as string[]) || []).includes(opt)}
                            onChange={(e) => {
                              const cur = (responses[field.id] as string[]) || [];
                              updateResponse(
                                field.id,
                                e.target.checked ? [...cur, opt] : cur.filter((v: string) => v !== opt)
                              );
                            }}
                            className="w-4 h-4 accent-indigo-500 cursor-pointer"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {/* Type-Specific Custom Questions */}
              {selectedType && selectedType.customFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Category Specific Information ({selectedType.name})
                  </h3>

                  {selectedType.customFields.map((f) => (
                    <div key={f.id} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        {f.label} {f.required && <span className="text-amber-400">*</span>}
                      </label>
                      {f.type === 'DROPDOWN' ? (
                        <select
                          value={(answers[f.id] as string) || ''}
                          onChange={(e) => updateAnswer(f.id, e.target.value)}
                          required={f.required}
                          className="w-full bg-slate-950/80 border border-slate-800 text-sm text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500"
                        >
                          <option value="">-- Select {f.label} --</option>
                          {(f.options || []).map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={(answers[f.id] as string) || ''}
                          onChange={(e) => updateAnswer(f.id, e.target.value)}
                          required={f.required}
                          placeholder={`Enter ${f.label.toLowerCase()}...`}
                          className="w-full bg-slate-950/80 border border-slate-800 text-sm text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                rightIcon={<Send className="w-4 h-4" />}
                className="w-full mt-4"
              >
                Submit Event Registration
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
}
