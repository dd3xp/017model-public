import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import styles from '@/styles/Dashboard.module.css';
import TopBar from '@/components/TopBar';

export default function Dashboard() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [username, setUsername] = useState('U');

  const handleCreateWork = () => {
    router.push('/create');
  };

  const handleViewWork = () => {
    router.push('/dashboard/works');
  };

  return (
    <div className={styles.container}>
      <TopBar 
        username={username}
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