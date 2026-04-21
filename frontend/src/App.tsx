import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth, RequireGuest } from "@/components/RequireAuth";
import { Shell } from "@/components/Shell";
import { TweaksButton } from "@/components/TweaksPanel";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { TweaksProvider } from "@/context/TweaksContext";
import { CatalogPage } from "@/pages/CatalogPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { ComingSoonPage } from "@/pages/ComingSoonPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DiscountsPage } from "@/pages/DiscountsPage";
import { InboxPage } from "@/pages/InboxPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { NewProductPage } from "@/pages/NewProductPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { ShopsPage } from "@/pages/ShopsPage";
import { SignupPage } from "@/pages/SignupPage";
import { StorefrontAdminPage } from "@/pages/StorefrontAdminPage";
import { StorefrontPublicPage } from "@/pages/StorefrontPublicPage";

export function App() {
  return (
    <BrowserRouter>
      <TweaksProvider>
        <AuthProvider>
          <ShopProvider>
            <Routes>
              {/* Публічні роути — лендинг, storefront, форми входу */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/s/:shopSlug" element={<StorefrontPublicPage />} />
              <Route
                path="/login"
                element={
                  <RequireGuest>
                    <LoginPage />
                  </RequireGuest>
                }
              />
              <Route
                path="/signup"
                element={
                  <RequireGuest>
                    <SignupPage />
                  </RequireGuest>
                }
              />

              {/* Приватна частина (потребує авторизації + обгорнута у Shell) */}
              <Route
                element={
                  <RequireAuth>
                    <Shell />
                  </RequireAuth>
                }
              >
                {/* Онбординг — 5-кроковий setup нового магазину */}
                <Route path="/onboarding" element={<OnboardingPage />} />

                {/* OVERVIEW */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  path="/analytics"
                  element={<ComingSoonPage titleKey="nav.analytics" descKey="comingSoon.analyticsDesc" iconName="chart" />}
                />
                <Route
                  path="/calendar"
                  element={<ComingSoonPage titleKey="nav.calendar" descKey="comingSoon.calendarDesc" iconName="calendar" />}
                />

                {/* ПРОДАЖ */}
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/catalog/new" element={<NewProductPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/discounts" element={<DiscountsPage />} />
                <Route
                  path="/garden"
                  element={<ComingSoonPage titleKey="nav.garden" descKey="comingSoon.gardenDesc" iconName="leaf" />}
                />

                {/* ОПЕРАЦІЇ */}
                <Route
                  path="/shipping"
                  element={<ComingSoonPage titleKey="nav.shipping" descKey="comingSoon.shippingDesc" iconName="truck" />}
                />
                <Route
                  path="/locations"
                  element={<ComingSoonPage titleKey="nav.locations" descKey="comingSoon.locationsDesc" iconName="store" />}
                />
                <Route
                  path="/payments"
                  element={<ComingSoonPage titleKey="nav.payments" descKey="comingSoon.paymentsDesc" iconName="credit" />}
                />
                <Route path="/inventory" element={<InventoryPage />} />

                {/* КАНАЛИ */}
                <Route path="/storefront" element={<StorefrontAdminPage />} />
                <Route
                  path="/pos"
                  element={<ComingSoonPage titleKey="nav.pos" descKey="comingSoon.posDesc" iconName="grid" />}
                />
                <Route path="/inbox" element={<InboxPage />} />

                {/* Налаштування (доступ через user-меню футера) */}
                <Route path="/shops" element={<ShopsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Tweaks-кнопка доступна на всьому сайті, включно з лендингом */}
            <TweaksButton />
          </ShopProvider>
        </AuthProvider>
      </TweaksProvider>
    </BrowserRouter>
  );
}
