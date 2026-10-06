/**
 * lib/email.ts — Nodemailer transport using Gmail SMTP.
 *
 * Uses Gmail App Password (szrj nezd cdkx jooo) for quickcashproo@gmail.com.
 * All emails come from quickcashproo@gmail.com with the QuickCash Kenya branding.
 *
 * Required env vars:
 *   GMAIL_USER=quickcashproo@gmail.com
 *   GMAIL_APP_PASSWORD=szrj nezd cdkx jooo
 *
 * If env vars are missing, emails are silently skipped (no crash) so
 * development without email works.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  welcomeEmailTemplate,
  activationSuccessTemplate,
  withdrawalInitiatedTemplate,
} from '@/lib/email-templates';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn('[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — emails will be skipped');
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return transporter;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email. Returns { success, error } — never throws.
 */
async function sendEmail(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  const t = getTransporter();
  if (!t) return { success: false, error: 'Email not configured' };
  try {
    const info = await t.sendMail({
      from: `"QuickCash Kenya" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`[email] sent to ${to}: messageId=${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[email] send failed to ${to}:`, err.message || err);
    return { success: false, error: err.message || String(err) };
  }
}

// ============================================================
// Public send functions — each returns SendResult
// ============================================================

export async function sendVerificationEmail(to: string, code: string, username: string): Promise<SendResult> {
  const t = emailVerificationTemplate({ code, username, email: to });
  return sendEmail(to, t.subject, t.html, t.text);
}

export async function sendPasswordResetEmail(to: string, code: string, username: string): Promise<SendResult> {
  const t = passwordResetTemplate({ code, username, email: to });
  return sendEmail(to, t.subject, t.html, t.text);
}

export async function sendWelcomeEmail(to: string, username: string, tier: string, activationFee: number, referralCode: string): Promise<SendResult> {
  const t = welcomeEmailTemplate({ username, tier, activationFee, referralCode });
  return sendEmail(to, t.subject, t.html, t.text);
}

export async function sendActivationSuccessEmail(to: string, username: string, tier: string): Promise<SendResult> {
  const t = activationSuccessTemplate({ username, tier });
  return sendEmail(to, t.subject, t.html, t.text);
}

export async function sendWithdrawalInitiatedEmail(to: string, username: string, amount: number, phone: string): Promise<SendResult> {
  const t = withdrawalInitiatedTemplate({ username, amount, phone });
  return sendEmail(to, t.subject, t.html, t.text);
}

/**
 * Generate a 6-digit verification code.
 */
export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
