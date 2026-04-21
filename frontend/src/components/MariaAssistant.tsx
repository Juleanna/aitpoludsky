import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Icon } from "./Icon";

// AI-помічниця Марія — плаваюча кнопка + panel з mock-чатом.
// Поки без реального AI-бекенду: відповіді генеруються з локалізованих шаблонів.
// У майбутньому замінюється на запит до endpoint-у типу /api/ai/maria/.

type Message = { role: "user" | "assistant"; text: string };

export function MariaAssistant() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: "assistant", text: t("maria.welcome") },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  // Автоскрол до останнього повідомлення.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Глобальна подія ait:toggle-maria (надсилається з хоткея ⌘/).
  useEffect(() => {
    const handler = () => setOpen((o) => !o);
    window.addEventListener("ait:toggle-maria", handler);
    return () => window.removeEventListener("ait:toggle-maria", handler);
  }, []);

  // Якщо мова змінилась — оновлюємо початкове welcome-повідомлення.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const [first, ...rest] = prev;
      if (first.role !== "assistant") return prev;
      return [{ role: "assistant", text: t("maria.welcome") }, ...rest];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t("maria.welcome")]);

  function addExchange(userText: string, replyKey = "maria.mockReply") {
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText },
      { role: "assistant", text: t(replyKey, { topic: userText }) },
    ]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    addExchange(text);
    setInput("");
  }

  const promptKeys = ["sales", "lowStock", "newCustomers", "bestSeller"] as const;

  return (
    <>
      {/* Тригер-pill у топбарі: аватар "М" + імʼя. Клік відкриває панель чату. */}
      <button
        type="button"
        className="maria-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("maria.openLabel")}
        title={t("maria.openLabel")}
      >
        <span className="maria-avatar-sm">М</span>
        <span className="maria-trigger-name">{t("maria.name")}</span>
      </button>

      {open && (
        <aside className="maria-panel" role="dialog" aria-label="Maria AI">
          <header className="maria-head">
            <div className="maria-head-avatar">М</div>
            <div style={{ flex: 1 }}>
              <div className="maria-head-title">{t("maria.name")}</div>
              <div className="maria-head-sub">{t("maria.subtitle")}</div>
            </div>
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => setOpen(false)}
              aria-label={t("common.close")}
            >
              ×
            </button>
          </header>

          <div className="maria-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`maria-bubble ${m.role}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="maria-prompts">
            {promptKeys.map((k) => {
              const label = t(`maria.prompts.${k}`);
              return (
                <button
                  key={k}
                  type="button"
                  className="maria-chip"
                  onClick={() => addExchange(label, `maria.replies.${k}`)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="maria-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("maria.inputPlaceholder")}
              className="maria-input"
            />
            <button type="submit" className="btn accent" disabled={!input.trim()}>
              <Icon name="arrow_right" size={14} />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
