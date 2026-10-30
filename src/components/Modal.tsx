import type { ReactNode } from "react";
interface ModalProps {
  children: ReactNode;
  className?: string;
  labelledBy: string;
  onClose?: () => void;
}
import { useEffect, useRef } from "react";
export default function Modal({
  children,
  className = "",
  labelledBy,
  onClose,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose?.();
      }}
    >
      {children}
    </dialog>
  );
}
