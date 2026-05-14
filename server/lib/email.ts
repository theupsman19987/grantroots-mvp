import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const url = `${process.env.CLIENT_URL}/auth/verify?token=${token}`
  await transporter.sendMail({
    from: `Urban Grantroots <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your Urban Grantroots account',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#6B0F1A;margin-bottom:8px">Welcome to Urban Grantroots!</h2>
        <p style="color:#4a2e09">Click the button below to verify your email address:</p>
        <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#6B0F1A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Verify Email
        </a>
        <p style="color:#888;font-size:13px">Link expires in 24 hours. If you did not create an account, you can ignore this email.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`
  await transporter.sendMail({
    from: `Urban Grantroots <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your Urban Grantroots password',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#6B0F1A;margin-bottom:8px">Password Reset Request</h2>
        <p style="color:#4a2e09">Click the button below to set a new password:</p>
        <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#6B0F1A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px">Link expires in 1 hour. If you did not request this, ignore this email.</p>
      </div>
    `,
  })
}
