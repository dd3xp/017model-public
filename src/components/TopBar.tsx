import { useState, useRef } from 'react';
import { useTranslation } from 'next-i18next';
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
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLElement | null>(null);

  return (
    <header className={styles.header}>
      <button
        ref={buttonRef as React.RefObject<HTMLButtonElement>}
        className={styles.menuIconButton}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open menu"
      >
        <div className={styles.menuIcon}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      <MenuTemplate open={isOpen} anchorRef={buttonRef} onClose={() => setIsOpen(false)}>
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            className={styles.menuItem}
            onClick={() => {
              item.onClick();
              setIsOpen(false);
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
        <button className={styles.avatarButton}>
          <div className={styles.avatar}>
            {username.charAt(0).toUpperCase()}
          </div>
        </button>
      </div>
    </header>
  );
} 