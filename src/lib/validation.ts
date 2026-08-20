import { z } from 'zod';

// ── Auth ──

export const loginSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain a number'),
});

// ── Events ──

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(200),
  venue: z.string().min(1, 'Venue is required').max(500),
  eventDate: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  logoFileId: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#0F172A'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#F59E0B'),
  fontFamily: z.string().default('Inter'),
  managerEmail: z.string().email('Valid manager email is required'),
});

export const updateEventSchema = createEventSchema.partial().omit({ managerEmail: true });

// ── Event Manager Settings ──

export const managerSettingsSchema = z.object({
  accountNumber: z.string().max(100).optional().nullable(),
  paymentPhone: z.string().max(30).optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  fontFamily: z.string().optional().nullable(),
});

// ── Form Fields ──

export const fieldTypeEnum = z.enum([
  'SHORT_TEXT', 'PARAGRAPH', 'EMAIL', 'NUMBER',
  'DROPDOWN', 'RADIO', 'CHECKBOX', 'DATE',
]);

export const formFieldSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, 'Label is required').max(200),
  type: fieldTypeEnum,
  required: z.boolean().default(false),
  options: z.array(z.string()).optional().nullable(),
  order: z.number().int().min(0),
  isLocked: z.boolean().default(false),
});

export const saveFormFieldsSchema = z.object({
  fields: z.array(formFieldSchema).min(1, 'At least one field is required'),
});

// ── Publish ──

export const publishSlugSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

// ── Public Form Submission ──

export const publicSubmissionSchema = z.object({
  responses: z.record(z.string(), z.any()),
  email: z.string().email('Valid email is required'),
});

// ── Gates ──

export const createGateSchema = z.object({
  name: z.string().min(1, 'Gate name is required').max(100),
  type: z.enum(['ENTRY', 'EXIT']),
});

// ── Gate OTP ──

export const gateOtpSchema = z.object({
  otpCode: z.string().min(1, 'OTP is required'),
});

// ── Scan ──

export const scanSchema = z.object({
  qrToken: z.string().min(1, 'QR token is required'),
});
