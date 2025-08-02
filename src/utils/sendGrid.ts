import sgMail from '@sendgrid/mail';
import { ENV } from '../config/env';

sgMail.setApiKey(ENV.SEND_GRID);

export const sendgridClient = sgMail;
export const sendgridFromEmail =
  process.env.SENDGRID_FROM_EMAIL || 'jplaniran01@gmail.com';
