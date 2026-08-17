import nodemailer from 'nodemailer';
import { ENV } from '../../config/env';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: ENV.GMAIL_USER,
    pass: ENV.GMAIL_PASS,
  },
});

type CodeEmailKind = 'welcome' | 'verify' | 'reset';

const copyByKind: Record<
  CodeEmailKind,
  { subject: (code: string) => string; intro: string; expiry: string }
> = {
  welcome: {
    subject: (code) => `Your Hazlo code: ${code}`,
    intro: 'Thanks for creating a Hazlo account. Enter this code in the app to finish signup.',
    expiry: 'This code expires in 24 hours.',
  },
  verify: {
    subject: (code) => `Your Hazlo code: ${code}`,
    intro: 'Enter this code in the Hazlo app to verify your account.',
    expiry: 'This code expires in 24 hours.',
  },
  reset: {
    subject: (code) => `Your Hazlo password reset code: ${code}`,
    intro: 'Enter this code in the Hazlo app to reset your password.',
    expiry: 'This code expires in 1 hour.',
  },
};

const buildCodeHtml = (code: string, intro: string, expiry: string) => `
  <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5; max-width: 520px;">
    <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">Hazlo</p>
    <p>${intro}</p>
    <p style="font-size: 28px; letter-spacing: 4px; font-weight: 700; margin: 24px 0;">${code}</p>
    <p>${expiry}</p>
    <p>If you did not request this, you can ignore this email.</p>
    <p style="color: #666; font-size: 12px; margin-top: 24px;">Hazlo</p>
  </div>
`;

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  if (!to || !subject || (!text && !html)) {
    throw new Error(
      'Missing required fields: to, subject, and either text or html must be provided'
    );
  }

  if (!ENV.GMAIL_USER || !ENV.GMAIL_PASS) {
    throw new Error('Gmail SMTP credentials are not configured');
  }

  try {
    const info = await transporter.sendMail({
      from: `"Hazlo" <${ENV.GMAIL_USER}>`,
      replyTo: ENV.GMAIL_USER,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent: ', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};

export const sendCodeEmail = async ({
  to,
  code,
  kind,
}: {
  to: string;
  code: string;
  kind: CodeEmailKind;
}) => {
  const copy = copyByKind[kind];
  const text = `Hazlo\n\n${copy.intro}\n\n${code}\n\n${copy.expiry}\n\nIf you did not request this, you can ignore this email.`;

  return sendEmail({
    to,
    subject: copy.subject(code),
    text,
    html: buildCodeHtml(code, copy.intro, copy.expiry),
  });
};
