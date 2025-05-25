import { ReactNode, useRef, useEffect, useState, RefObject } from 'react';

interface MenuTemplateProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
}

export default function MenuTemplate({ open, anchorRef, onClose, children }: MenuTemplateProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (open && anchorRef.current && menuRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const menu = menuRef.current;
      const menuWidth = menu.offsetWidth;
      let x = rect.left;
      const y = rect.bottom + 8;
      if (window.innerWidth - rect.left < menuWidth) {
        x = rect.right - menuWidth;
      }
      setMenuPosition({ x, y });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: menuPosition.x,
        top: menuPosition.y,
        zIndex: 2000,
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: 200,
        padding: 8,
      }}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  );
} 