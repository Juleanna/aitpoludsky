import { FormEvent, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import * as inboxApi from "@/api/inbox";
import { Icon } from "@/components/Icon";
import { useShops } from "@/context/ShopContext";
import type { InboxChannel, InboxThread } from "@/types";
import { formatRelative } from "@/utils/format";

const CHANNELS: InboxChannel[] = ["web", "ig", "tg", "viber", "manual"];

export function InboxPage() {
  const { t } = useTranslation();
  const { activeShop } = useShops();
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const slug = activeShop?.slug ?? null;

  const reload = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const list = await inboxApi.listThreads(slug);
      setThreads(list);
      setActiveId((prev) => prev ?? list[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const active = threads.find((th) => th.id === activeId) ?? null;

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!slug || !active || !replyDraft.trim()) return;
    setSending(true);
    try {
      await inboxApi.replyToThread(slug, active.id, replyDraft);
      setReplyDraft("");
      await reload();
    } finally {
      setSending(false);
    }
  }

  if (!activeShop) {
    return (
      <div className="content">
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <p>{t("shops.firstNeedShop")}</p>
          <Link to="/shops" className="btn accent">
            {t("shops.goShops")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t("inbox.title")}</h1>
          <p className="page-sub">{t("inbox.subtitle")}</p>
        </div>
        <button className="btn accent" onClick={() => setShowCreate(true)}>
          <Icon name="plus" size={14} /> {t("inbox.newThread")}
        </button>
      </div>

      <div
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          height: "calc(100vh - 220px)",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div style={{ borderRight: "1px solid var(--line)", overflowY: "auto" }}>
          {loading && threads.length === 0 && (
            <div style={{ padding: 24, color: "var(--text-3)" }}>{t("common.loading")}</div>
          )}
          {!loading && threads.length === 0 && (
            <div style={{ padding: 24, color: "var(--text-3)", textAlign: "center" }}>{t("inbox.empty")}</div>
          )}
          {threads.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setActiveId(th.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: 14,
                borderBottom: "1px solid var(--line)",
                background: th.id === activeId ? "var(--bg-sunken)" : th.unread ? "var(--accent-soft)" : "transparent",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{th.customer_name || t("common.none")}</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--text-3)" }}>
                  {formatRelative(th.updated_at)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {th.last_message?.body || th.subject || "—"}
              </div>
              <span className="chip mono" style={{ alignSelf: "flex-start", fontSize: 9 }}>
                {t(`inbox.channels.${th.channel}`)}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {!active ? (
            <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-3)" }}>
              {t("inbox.empty")}
            </div>
          ) : (
            <>
              <header style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
                <div style={{ fontWeight: 500 }}>{active.customer_name || active.subject || `#${active.id}`}</div>
                <span className="chip mono" style={{ fontSize: 10, marginTop: 4 }}>
                  {t(`inbox.channels.${active.channel}`)}
                </span>
              </header>
              <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.direction === "out" ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                      padding: "10px 14px",
                      borderRadius: 14,
                      background: m.direction === "out" ? "var(--accent)" : "var(--bg-sunken)",
                      color: m.direction === "out" ? "white" : "var(--text)",
                      border: m.direction === "out" ? "none" : "1px solid var(--line)",
                      fontSize: 13,
                    }}
                  >
                    {m.body}
                  </div>
                ))}
              </div>
              <form onSubmit={handleReply} style={{ padding: 14, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
                <input
                  placeholder={t("inbox.reply")}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r-sm)",
                    background: "var(--bg)",
                    color: "var(--text)",
                    fontSize: 14,
                  }}
                />
                <button type="submit" className="btn accent" disabled={sending || !replyDraft.trim()}>
                  {sending ? "…" : t("inbox.send")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showCreate && slug && (
        <CreateThreadDrawer
          shopSlug={slug}
          onClose={() => setShowCreate(false)}
          onCreated={async (id) => {
            setShowCreate(false);
            await reload();
            setActiveId(id);
          }}
        />
      )}
    </div>
  );
}

function CreateThreadDrawer({
  shopSlug,
  onClose,
  onCreated,
}: {
  shopSlug: string;
  onClose: () => void;
  onCreated: (id: number) => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [channel, setChannel] = useState<InboxChannel>("manual");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const thread = await inboxApi.createThread(shopSlug, { channel, subject: subject || undefined });
      if (body.trim()) {
        await inboxApi.replyToThread(shopSlug, thread.id, body);
      }
      await onCreated(thread.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <h2 className="serif" style={{ margin: 0, fontSize: 24, fontStyle: "italic" }}>
            {t("inbox.newThread")}
          </h2>
          <button className="btn ghost icon" onClick={onClose} aria-label={t("common.close")}>
            ×
          </button>
        </header>
        <form onSubmit={handleSubmit} className="drawer-body">
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)" }}>
              {t("orders.channel").toUpperCase()}
            </span>
            <select value={channel} onChange={(e) => setChannel(e.target.value as InboxChannel)} style={inputStyle}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {t(`inbox.channels.${c}`)}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)" }}>
              {t("discounts.name").toUpperCase()}
            </span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)" }}>
              {t("inbox.reply").toUpperCase()}
            </span>
            <textarea value={body} rows={4} onChange={(e) => setBody(e.target.value)} style={inputStyle} />
          </label>
          <footer className="drawer-foot">
            <button type="button" className="btn" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn accent" disabled={busy}>
              {busy ? t("common.creating") : t("common.create")}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 11px",
  border: "1px solid var(--line)",
  borderRadius: "var(--r-sm)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 14,
  width: "100%",
};
