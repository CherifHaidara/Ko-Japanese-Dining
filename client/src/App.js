import { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminRouteGuard from './components/AdminRouteGuard';
import AdminLoginPage from './pages/AdminLoginPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AccountReservationsPage from './pages/AccountReservationsPage';
import ReservationPage from './pages/ReservationPage';
import Cart from './components/Cart';
import Contact from './pages/Contact';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import AboutPage from './pages/AboutPage';
import HoursLocationPage from './pages/HoursLocationPage';
import MenuPage from './pages/MenuPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  return { theme, toggle };
}

function AppShell() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const isReservationPage = location.pathname.startsWith('/reservations');
  const showSiteFooter = ['/', '/japanese-menu', '/contact', '/about', '/hours-location'].includes(location.pathname);

  return (
    <>
      <Navbar
        locationPath={location.pathname}
        theme={theme}
        toggleTheme={toggle}
        isReservationPage={isReservationPage}
      />
      <Cart />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/hours-location" element={<HoursLocationPage />} />
        <Route path="/japanese-menu" element={<MenuPage />} />
        <Route path="/reservations" element={<ReservationPage />} />
        <Route path="/account" element={<AccountReservationsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:id" element={<OrderStatusPage />} />
        <Route path="/login" element={<AuthPage defaultTab="login" />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={(
            <AdminRouteGuard>
              <AdminDashboard />
            </AdminRouteGuard>
          )}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showSiteFooter ? <Footer /> : null}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
