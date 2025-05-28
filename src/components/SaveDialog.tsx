import { useTranslation } from 'next-i18next';
import styles from '@/styles/SaveDialog.module.css';

interface SaveDialogProps {
  isOpen: boolean;
  saveName: string;
  isSaving: boolean;
  onSaveNameChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function SaveDialog({
  isOpen,
  saveName,
  isSaving,
  onSaveNameChange,
  onSave,
  onCancel
}: SaveDialogProps) {
  const { t } = useTranslation('common');

  if (!isOpen) return null;

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialog}>
        <h3>{t('create.save.dialog.title')}</h3>
        <input
          type="text"
          value={saveName}
          onChange={(e) => onSaveNameChange(e.target.value)}
          placeholder={t('create.save.dialog.placeholder')}
          className={styles.dialogInput}
        />
        <div className={styles.dialogButtons}>
          <button
            type="button"
            onClick={onSave}
            disabled={!saveName.trim() || isSaving}
            className={styles.dialogConfirmButton}
          >
            {isSaving ? t('create.save.saving') : t('create.save.dialog.confirm')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className={styles.dialogCancelButton}
          >
            {t('create.save.dialog.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
} 