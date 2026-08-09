/* ============================================================
   Transactional email (Phase 6).
   Uses Resend when RESEND_API_KEY is set; otherwise logs the email
   as a mock line so the flow is testable in development. Swapping in
   a key enables real delivery with no code changes.
   ============================================================ */

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM || '9Th-Grade AI <onboarding@resend.dev>'

export interface EmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(input: EmailInput): Promise<void> {
  if (!resend) {
    console.log(JSON.stringify({ type: 'email:mock', to: input.to, subject: input.subject }))
    return
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? { html: input.html } : {}),
    })
  } catch (err) {
    console.error('Email send failed:', err)
  }
}
