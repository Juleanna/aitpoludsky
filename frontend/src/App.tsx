import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth, RequireGuest } from "@/components/RequireAuth";
import { Shell } from "@/components/Shell";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { CatalogPage } from "@/pages/CatalogPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DiscountsPage } from "@/pages/DiscountsPage";
import { InboxPage } from "@/pages/InboxPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { ShopsPage } from "@/pages/ShopsPage";
import { SignupPage } from "@/pages/SignupPage";
import { StorefrontAdminPage } from "@/pages/StorefrontAdminPage";
import { StorefrontPublicPage } from "@/pages/StorefrontPublicPage";

export function App() {
  return (
    <BrowserRouter>
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
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/discounts" element={<DiscountsPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/storefront" element={<StorefrontAdminPage />} />
              <Route path="/shops" element={<ShopsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
