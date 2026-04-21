import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import * as shopsApi from "@/api/shops";
import type { Shop } from "@/types";
import { useAuth } from "./AuthContext";

const ACTIVE_SLUG_KEY = "ait_active_shop";

type ShopContextValue = {
  shops: Shop[];
  activeShop: Shop | null;
  loading: boolean;
  setActiveSlug: (slug: string) => void;
  refresh: () => Promise<void>;
};

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeSlug, setActiveSlugState] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_SLUG_KEY),
  );
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await shopsApi.listShops();
      setShops(list);
      if (list.length > 0 && !list.some((s) => s.slug === activeSlug)) {
        setActiveSlugState(list[0].slug);
        localStorage.setItem(ACTIVE_SLUG_KEY, list[0].slug);
      }
    } finally {
      setLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    if (status === "authenticated") {
      void refresh();
    } else if (status === "guest") {
      setShops([]);
    }
  }, [status, refresh]);

  const setActiveSlug = useCallback((slug: string) => {
    setActiveSlugState(slug);
    localStorage.setItem(ACTIVE_SLUG_KEY, slug);
  }, []);

  const activeShop = useMemo(
    () => shops.find((s) => s.slug === activeSlug) ?? null,
    [shops, activeSlug],
  );

  const value = useMemo(
    () => ({ shops, activeShop, loading, setActiveSlug, refresh }),
    [shops, activeShop, loading, setActiveSlug, refresh],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShops(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShops must be used inside <ShopProvider>");
  return ctx;
}
