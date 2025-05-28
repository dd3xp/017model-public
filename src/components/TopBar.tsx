import { useState, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import styles from '../styles/TopBar.module.css';
import MenuTemplate from './MenuTemplate';

interface MenuItem {
  label: string;
  onClick: () => void;
}

interface TopBarProps {
  username: string;
  menuItems: MenuItem[];
}

export default function TopBar({ username, menuItems }: TopBarProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLElement | null>(null);
  const userButtonRef = useRef<HTMLElement | null>(null);

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.replace('/login');
  };

  return (
    <header className={styles.header}>
      <button
        ref={menuButtonRef as React.RefObject<HTMLButtonElement>}
        className={styles.menuIconButton}
        onClick={() => setIsMenuOpen((v) => !v)}
        aria-label="Open menu"
      >
        <div className={styles.menuIcon}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      <MenuTemplate open={isMenuOpen} anchorRef={menuButtonRef} onClose={() => setIsMenuOpen(false)}>
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className={styles.menuItem}
            onClick={() => {
              item.onClick();
              setIsMenuOpen(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </MenuTemplate>
      <div className={styles.logo}>
        <h1>{t('login.brand.title')}</h1>
      </div>
      <div className={styles.userSection}>
        <button 
          ref={userButtonRef as React.RefObject<HTMLButtonElement>}
          className={styles.avatarButton}
          onClick={() => setIsUserMenuOpen((v) => !v)}
        >
          <div className={styles.avatar}>
            {username.charAt(0).toUpperCase()}
          </div>
        </button>
        <MenuTemplate open={isUserMenuOpen} anchorRef={userButtonRef} onClose={() => setIsUserMenuOpen(false)}>
          <button
            className={styles.menuItem}
            onClick={() => {
              handleLogout();
              setIsUserMenuOpen(false);
            }}
          >
            {t('userMenu.logout')}
          </button>
        </MenuTemplate>
      </div>
    </header>
  );
} 