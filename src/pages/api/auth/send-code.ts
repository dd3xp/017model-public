import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import VerificationCode from '@/models/VerificationCode';
import sequelize from '@/lib/db';
import { withDatabase } from '@/middleware/db';

let i18nInitialized = false;

async function initI18n() {
  if (!i18nInitialized) {
    await i18next
      .use(Backend)
      .init({
        lng: 'zh',
        fallbackLng: 'zh',
        ns: ['common'],
        defaultNS: 'common',
        backend: {
          loadPath: path.join(process.cwd(), 'public/locales/{{lng}}/{{ns}}.json'),
        },
        interpolation: { escapeValue: false },
      });
    i18nInitialized = true;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await withDatabase(req, res, async () => {
    try {
      if (!sequelize) {
        throw new Error('Database connection not initialized');
      }

      await initI18n();
      const { email, locale = 'zh' } = req.body;

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 5 * 60 * 1000);

      await VerificationCode.destroy({
        where: { email }
      });

      await VerificationCode.create({
        email,
        code,
        expires
      });

      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Missing email server configuration');
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const t = i18next.getFixedT(locale, 'common');
      const subject = t('email.verificationCode.subject');
      const content = t('email.verificationCode.content', { code });

      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject,
        text: content,
      });

      res.status(200).json({ message: t('login.verificationCode.send') });
    } catch (error: unknown) {
      console.error('Failed to send verification code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: 'Failed to send verification code',
        error: errorMessage
      });
    }
  });
} 