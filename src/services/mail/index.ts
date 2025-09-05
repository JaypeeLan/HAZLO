import nodemailer from 'nodemailer';
import { ENV } from '../../config/env';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: ENV.GMAIL_USER,
    pass: ENV.GMAIL_PASS,
  },
});

const mailOptions = {
  from: ENV.GMAIL_USER,
};

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

  const updatedMailOptions = {
    ...mailOptions,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(updatedMailOptions);
    console.log('Email sent: ', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};
