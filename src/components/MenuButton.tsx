import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import styles from '../styles/MenuButton.module.css';

interface MenuButtonProps {
  onCreateWork: () => void;
  onViewWork: () => void;
}

export default function MenuButton({ onCreateWork, onViewWork }: MenuButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation('common');

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button className={styles.menuButton} onClick={toggleMenu}>
        <div className={styles.menuIcon}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {isOpen && (
        <div className={styles.menuOverlay} onClick={toggleMenu}>
          <div className={styles.menu}>
            <button className={styles.menuItem} onClick={onCreateWork}>
              {t('dashboard.menu.newWork')}
            </button>
            <button className={styles.menuItem} onClick={onViewWork}>
              {t('dashboard.menu.myWork')}
            </button>
          </div>
        </div>
      )}
    </>
  );
} 