import { useLanguage } from "../hooks/useLanguage";
import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { X } from "lucide-react";
export function Modal({
  title,
  children,
  onClose,
  initialFocusRef,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
}) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const dialog = ref.current;
    if (!viewport || !dialog) return;

    const updateViewport = () => {
      dialog.style.setProperty("--viewport-height", `${viewport.height}px`);
      dialog.style.setProperty("--viewport-top", `${viewport.offsetTop}px`);
    };
    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
    };
  }, []);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    initialFocusRef?.current?.focus({ preventScroll: true });
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, [initialFocusRef]);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t("Закрыть окно")}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
