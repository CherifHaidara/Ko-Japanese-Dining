import React, { useMemo, useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminRouteGuard from './components/AdminRouteGuard';
import AdminLoginPage from './pages/AdminLoginPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';
import Cart from './components/Cart';
import { CartProvider, useCart } from './context/CartContext';

function createDishImage(title, accent) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1a1a1a" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
        <radialGradient id="glow" cx="72%" cy="28%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="640" height="420" fill="url(#bg)" />
      <circle cx="492" cy="96" r="150" fill="url(#glow)" opacity="0.3" />
      <circle cx="452" cy="218" r="100" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
      <circle cx="452" cy="218" r="66" fill="${accent}" opacity="0.8" />
      <path d="M390 218c44-32 80-36 124 0" stroke="rgba(255,255,255,0.6)" stroke-width="4" fill="none" stroke-linecap="round" />
      <text x="44" y="296" fill="#ffffff" font-size="38" font-family="Georgia, serif" font-weight="700">${title}</text>
      <text x="44" y="332" fill="rgba(255,255,255,0.5)" font-size="14" font-family="Segoe UI, sans-serif" letter-spacing="4">KO JAPANESE DINING</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  return { theme, toggle };
}

function Navbar({ theme, toggleTheme }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src="/Ko_logo.png" alt="Ko Japanese Dining" className="navbar-logo" />
          <span className="navbar-name">Ko Japanese Dining</span>
        </Link>
        <div className="navbar-actions">
          <Link to="/admin/login" className="nav-admin-link">Admin</Link>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
}

const MENU_TYPES = ['Dinner', 'Lunch', 'Brunch'];
const ACCENT_COLORS = ['#7a1212','#b31717','#8f1010','#d61414','#6d0f0f','#941515','#a01818','#c01010'];

function MenuPage() {
  const { addItem } = useCart();
  const [selectedItem, setSelectedItem]   = useState(null);
  const [selectedTab,  setSelectedTab]    = useState(null);
  const [menuType,     setMenuType]       = useState('Dinner');
  const [menuData,     setMenuData]       = useState({});
  const [loading,      setLoading]        = useState(true);
  const [fetchError,   setFetchError]     = useState(false);

  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    setSelectedTab(null);
    fetch(`/api/menu/full?menu=${menuType}`)
      .then(res => {
        if (!res.ok) throw new Error('Server error');
        return res.json();
      })
      .then(data => {
        const transformed = {};
        data.sections.forEach(section => {
          transformed[section.section] = section.items.map((item, i) => ({
            ...item,
            image: item.image_url || createDishImage(item.name, ACCENT_COLORS[i % ACCENT_COLORS.length])
          }));
        });
        setMenuData(transformed);
        setSelectedTab(Object.keys(transformed)[0] || null);
        setLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }, [menuType]);

  const menu     = menuData;
  const sections = Object.keys(menu);

  const featuredItems = useMemo(
    () => Object.values(menu).flat().filter(item => item.is_featured),
    [menu]
  );

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">Ko Japanese Dining</p>
          <h1 className="hero-title">Authentic Japanese cuisine, elevated.</h1>
          <p className="hero-subtitle">
            From hand-pressed nigiri to slow-simmered ramen — every dish is crafted with care and served with intention.
          </p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => document.querySelector('.menu-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Browse Menu
            </button>
            <button className="btn-outline" onClick={() => setSelectedTab("Sashimi")}>
              View Sashimi
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-header">
            <span className="hero-panel-label">Tonight's Highlights</span>
            <span className="hero-panel-dot" />
          </div>
          <div className="featured-list">
            {featuredItems.map((item, i) => (
              <button key={i} className="featured-card" onClick={() => setSelectedItem(item)}>
                <img src={item.image} alt={item.name} />
                <div className="featured-card-copy">
                  <span className="featured-tag">Featured</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
                <span className="featured-price">${item.price}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu */}
      <section className="menu-section">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Our Menu</p>
            <h2 className="section-title">{selectedTab}</h2>
          </div>
          <p className="section-subtitle">Tap any dish to view details and add it to your order.</p>
        </div>

        {/* Menu Type Selector */}
        <div className="menu-type-tabs" role="tablist" aria-label="Menu type">
          {MENU_TYPES.map(type => (
            <button
              key={type}
              className={type === menuType ? "menu-type-tab is-active" : "menu-type-tab"}
              onClick={() => setMenuType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Section Tabs + Grid */}
        {loading ? (
          <div className="menu-loading">Loading menu…</div>
        ) : fetchError ? (
          <div className="menu-loading">Could not load menu. Make sure the backend server is running on port 5000.</div>
        ) : (
          <>
            <div className="tabs" role="tablist">
              {sections.map(tab => (
                <button
                  key={tab}
                  className={tab === selectedTab ? "tab is-active" : "tab"}
                  onClick={() => setSelectedTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="menu-grid">
              {(menu[selectedTab] || []).map((item, i) => (
                <button key={i} className="menu-card" onClick={() => setSelectedItem(item)}>
                  <img src={item.image} alt={item.name} />
                  <div className="menu-card-body">
                    <div className="menu-card-topline">
                      <h3>{item.name}</h3>
                      <span className="menu-card-price">${item.price}</span>
                    </div>
                    <p className="menu-card-desc">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="footer-strip">
        <div className="footer-brand">
          <img src="/Ko_logo.png" alt="Ko" className="footer-logo" />
          <span className="footer-name">Ko Japanese Dining</span>
        </div>
        <span className="footer-copy">© {new Date().getFullYear()} Ko Japanese Dining. All rights reserved.</span>
      </footer>

      {/* Item Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>✕</button>
            <img className="modal-image" src={selectedItem.image} alt={selectedItem.name} />
            <div className="modal-body">
              <div className="modal-topline">
                <h2>{selectedItem.name}</h2>
                <span className="modal-price">${selectedItem.price}</span>
              </div>
              <p className="modal-desc">{selectedItem.description}</p>
              <button
                className="modal-add-btn"
                onClick={() => { addItem(selectedItem); setSelectedItem(null); }}
              >
                Add to Cart — ${selectedItem.price}
              </button>
              <div className="modal-columns">
                <div className="detail-panel">
                  <h4>Modifiers</h4>
                  <ul>
                    {selectedItem.modifiers?.map((mod, i) => <li key={i}>{mod}</li>)}
                  </ul>
                </div>
                <div className="detail-panel">
                  <h4>Allergens</h4>
                  <ul>
                    {selectedItem.allergens?.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppShell() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggle} />
      <Cart />
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:id" element={<OrderStatusPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={
          <AdminRouteGuard>
            <AdminDashboard />
          </AdminRouteGuard>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
