import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

// Спільний Confirm-діалог. Замінює браузерний confirm() — керується через
// useConfirm() хук, що повертає Promise<boolean>. Дизайн — центроване
// модальне вікно з фоном-затемненням, ESC/клік поза вікном = cancel.

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

type PendingState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);
  const { t } = useTranslation();
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const handleClose = useCallback(
    (value: boolean) => {
      if (!pending) return;
      pending.resolve(value);
      setPending(null);
    },
    [pending],
  );

  // ESC → cancel, Enter → confirm (якщо фокус на кнопці — вона сама клікається).
  useEffect(() => {
    if (!pending) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, handleClose]);

  // Автофокус на кнопці підтвердження при відкритті.
  useEffect(() => {
    if (pending) {
      requestAnimationFrame(() => confirmBtnRef.current?.focus());
    }
  }, [pending]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            // Закриваємо тільки при кліку саме по фону — не по вмісту.
            if (e.target === e.currentTarget) handleClose(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal">
            <div className="modal-head">
              <h3 className="modal-title">{pending.title}</h3>
            </div>
            {pending.message && <div className="modal-body">{pending.message}</div>}
            <div className="modal-foot">
              <button type="button" className="btn ghost" onClick={() => handleClose(false)}>
                {pending.cancelLabel ?? t("common.cancel")}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                className={`btn ${pending.tone === "danger" ? "danger" : "accent"}`}
                onClick={() => handleClose(true)}
              >
                {pending.confirmLabel ?? t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm() має використовуватись всередині <ConfirmProvider>");
  return ctx;
}
