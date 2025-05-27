import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '@/styles/Dashboard.module.css';
import TopBar from '@/components/TopBar';

export default function Dashboard() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const decoded = jwtDecode<{ id: number; email: string }>(token);
      setUserEmail(decoded.email);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const handleCreateWork = () => {
    router.push('/create');
  };

  const handleViewWork = () => {
    router.push('/works');
  };

  if (!userEmail) {
    return null;
  }

  return (
    <div className={styles.container}>
      <TopBar 
        username={userEmail}
        menuItems={[
          { label: t('dashboard.menu.newWork'), onClick: handleCreateWork },
          { label: t('dashboard.menu.myWork'), onClick: handleViewWork }
        ]}
      />
      <main className={styles.main}>
        <h2>{t('dashboard.welcome')}</h2>
        <p>{t('dashboard.description')}</p>
      </main>
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