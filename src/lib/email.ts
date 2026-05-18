import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_123')

const FROM = process.env.EMAIL_FROM || 'Careme <noreply@careme.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

// ── Helpers ───────────────────────────────────────────────────────────────────
function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">Careme</h1>
            <p style="margin:4px 0 0;color:#bbf7d0;font-size:13px;">Trusted Caregiver Marketplace</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
              © ${new Date().getFullYear()} Careme. All rights reserved.<br>
              <a href="${APP_URL}" style="color:#16a34a;text-decoration:none;">Visit Careme</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Email Types ────────────────────────────────────────────────────────────────

export async function sendBookingConfirmationToPatient({
  patientEmail, patientName, caregiverName, startDate, endDate, bookingId,
}: {
  patientEmail: string; patientName: string; caregiverName: string;
  startDate: Date; endDate: Date; bookingId: string
}) {
  const body = `
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;">Booking Request Sent ✅</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${patientName}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">Your booking request for <strong>${caregiverName}</strong> has been received and payment confirmed. The caregiver will review and confirm shortly.</p>
    <table style="width:100%;background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Caregiver</td><td style="padding:6px 0;font-weight:600;color:#0f172a;font-size:14px;">${caregiverName}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Start</td><td style="padding:6px 0;font-weight:600;color:#0f172a;font-size:14px;">${startDate.toLocaleString()}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">End</td><td style="padding:6px 0;font-weight:600;color:#0f172a;font-size:14px;">${endDate.toLocaleString()}</td></tr>
    </table>
    <a href="${APP_URL}/dashboard/patient" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Track My Booking</a>
  `
  return resend.emails.send({ from: FROM, to: patientEmail, subject: 'Booking Confirmed — Careme', html: baseTemplate('Booking Confirmed', body) })
}

export async function sendBookingRequestToCaregiver({
  caregiverEmail, caregiverName, patientName, startDate, endDate, locationType, address, bookingId,
}: {
  caregiverEmail: string; caregiverName: string; patientName: string;
  startDate: Date; endDate: Date; locationType: string; address: string | null; bookingId: string
}) {
  const body = `
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;">New Booking Request 🔔</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${caregiverName}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">You have a new booking request from <strong>${patientName}</strong>.</p>
    <table style="width:100%;background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Patient</td><td style="padding:6px 0;font-weight:600;color:#0f172a;font-size:14px;">${patientName}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Start</td><td style="padding:6px 0;font-weight:600;color:#0f172a;font-size:14px;">${startDate.toLocaleString()}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">End</td><td style="padding:6px 0;font-weight:600;color:#0f172a;font-size:14px;">${endDate.toLocaleString()}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Location</td><td style="padding:6px 0;font-weight:600;color:#0f172a;font-size:14px;">${locationType === 'HOME' ? `Home — ${address}` : 'Hospital'}</td></tr>
    </table>
    <a href="${APP_URL}/dashboard/caregiver" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Review Booking</a>
  `
  return resend.emails.send({ from: FROM, to: caregiverEmail, subject: 'New Booking Request — Careme', html: baseTemplate('New Booking Request', body) })
}

export async function sendBookingAcceptedToPatient({
  patientEmail, patientName, caregiverName, startDate,
}: {
  patientEmail: string; patientName: string; caregiverName: string; startDate: Date
}) {
  const body = `
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;">Booking Accepted 🎉</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${patientName}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">Great news! <strong>${caregiverName}</strong> has accepted your booking starting <strong>${startDate.toLocaleString()}</strong>.</p>
    <a href="${APP_URL}/dashboard/patient" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">View Dashboard</a>
  `
  return resend.emails.send({ from: FROM, to: patientEmail, subject: 'Your Booking Was Accepted — Careme', html: baseTemplate('Booking Accepted', body) })
}

export async function sendBookingCancelledToPatient({
  patientEmail, patientName, caregiverName, reason,
}: {
  patientEmail: string; patientName: string; caregiverName: string; reason: string
}) {
  const body = `
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;">Booking Cancelled</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${patientName}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">Unfortunately your booking with <strong>${caregiverName}</strong> has been cancelled.</p>
    ${reason ? `<p style="color:#475569;line-height:1.6;"><strong>Reason:</strong> ${reason}</p>` : ''}
    <a href="${APP_URL}/caregivers" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Find Another Caregiver</a>
  `
  return resend.emails.send({ from: FROM, to: patientEmail, subject: 'Booking Cancelled — Careme', html: baseTemplate('Booking Cancelled', body) })
}

export async function sendCaregiverApprovedEmail({
  caregiverEmail, caregiverName,
}: {
  caregiverEmail: string; caregiverName: string
}) {
  const body = `
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;">Your Profile is Approved! 🎉</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${caregiverName}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">Congratulations! Your caregiver profile has been reviewed and approved. You are now live on the Careme marketplace and can start receiving booking requests.</p>
    <a href="${APP_URL}/dashboard/caregiver" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Go to My Dashboard</a>
  `
  return resend.emails.send({ from: FROM, to: caregiverEmail, subject: 'Profile Approved — You\'re Live on Careme!', html: baseTemplate('Profile Approved', body) })
}

export async function sendCaregiverRejectedEmail({
  caregiverEmail, caregiverName, reason,
}: {
  caregiverEmail: string; caregiverName: string; reason?: string
}) {
  const body = `
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;">Profile Review Update</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${caregiverName}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">After reviewing your profile, we are unable to approve it at this time.</p>
    ${reason ? `<p style="color:#475569;line-height:1.6;"><strong>Reason:</strong> ${reason}</p>` : ''}
    <p style="color:#475569;line-height:1.6;">Please update your profile and resubmit for review.</p>
    <a href="${APP_URL}/profile/caregiver" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Update My Profile</a>
  `
  return resend.emails.send({ from: FROM, to: caregiverEmail, subject: 'Profile Review Update — Careme', html: baseTemplate('Profile Review Update', body) })
}

export async function sendPasswordResetEmail({
  email, name, token,
}: {
  email: string; name: string; token: string
}) {
  const resetLink = `${APP_URL}/reset-password?token=${token}`
  const body = `
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 16px;">Reset Your Password</h2>
    <p style="color:#475569;line-height:1.6;">Hi <strong>${name}</strong>,</p>
    <p style="color:#475569;line-height:1.6;">We received a request to reset your password for your Careme account. Click the button below to set a new password. This link will expire in 1 hour.</p>
    <div style="margin:24px 0;">
      <a href="${resetLink}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Reset Password</a>
    </div>
    <p style="color:#64748b;font-size:12px;line-height:1.6;">If you didn't request a password reset, you can safely ignore this email.</p>
  `
  return resend.emails.send({ from: FROM, to: email, subject: 'Reset Your Password — Careme', html: baseTemplate('Reset Password', body) })
}
