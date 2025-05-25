import { useTranslation } from 'next-i18next';
import styles from '../styles/TopBar.module.css';

interface TopBarProps {
  username: string;
}

export default function TopBar({ username }: TopBarProps) {
  const { t } = useTranslation('common');

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>{t('login.brand.title')}</h1>
      </div>
      <div className={styles.userSection}>
        <button className={styles.avatarButton}>
          <div className={styles.avatar}>
            {username.charAt(0).toUpperCase()}
          </div>
        </button>
      </div>
    </header>
  );
} 