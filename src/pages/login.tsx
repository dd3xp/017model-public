import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '@/styles/Login.module.css';

export default function Login() {
  const { t, i18n } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert(t('login.email.invalid'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          locale: i18n.language
        }),
      });

      if (response.ok) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert(t('login.verificationCode.sendFailed'));
      }
    } catch (error) {
      alert(t('login.verificationCode.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode) {
      alert(t('login.submit.incomplete'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        alert(t('login.submit.invalidCode'));
      }
    } catch (error) {
      alert(t('login.submit.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.brandSection}>
          <h1>{t('login.brand.title')}</h1>
          <p>{t('login.brand.description')}</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder={t('login.email.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className={styles.inputGroupRow}>
            <input
              type="text"
              placeholder={t('login.verificationCode.placeholder')}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isLoading || countdown > 0}
              className={styles.sendCodeButton}
            >
              {countdown > 0
                ? t('login.verificationCode.resend', { count: countdown })
                : t('login.verificationCode.send')}
            </button>
          </div>
          <button type="submit" disabled={isLoading} className={styles.loginButton}>
            {isLoading ? t('login.submit.loading') : t('login.submit.default')}
          </button>
        </form>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale = 'zh' }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
} 