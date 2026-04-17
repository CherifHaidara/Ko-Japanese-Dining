import { useMemo, useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminRouteGuard from './components/AdminRouteGuard';
import AdminLoginPage from './pages/AdminLoginPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountReservationsPage from './pages/AccountReservationsPage';
import ReservationPage from './pages/ReservationPage';
import OrderStatusPage from './pages/OrderStatusPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import Cart from './components/Cart';
import Contact from './pages/Contact';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';

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

function Navbar({ theme, toggleTheme, isReservationPage }) {
  const { user } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className={isReservationPage ? 'navbar navbar--reservation' : 'navbar'}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
          <img
            src="/Ko_logo.png"
            alt="Ko Japanese Dining"
            className="navbar-logo"
          />
          <span className="navbar-name">Ko Japanese Dining</span>
        </Link>

        <div className="navbar-actions">
          <Link to="/japanese-menu" className="nav-admin-link">Menu</Link>
          <Link to="/reservations" className="nav-admin-link">Reserve</Link>
          <Link to="/account" className="nav-admin-link">My Reservations</Link>
          <Link to="/admin/login" className="nav-admin-link">Admin</Link>
          <Link to="/contact" className="nav-admin-link">Contact</Link>
          {user ? (
            <Link to="/profile" className="nav-profile-link">
              {user.profile_picture ? (
                <img src={`/uploads/${user.profile_picture}`} alt="" className="nav-profile-avatar nav-profile-avatar--img" />
              ) : (
                <span className="nav-profile-avatar">{user.first_name?.[0]?.toUpperCase() || '?'}</span>
              )}
              <span>{user.first_name}</span>
            </Link>
          ) : (
            <Link to="/login" className="nav-login-link">Sign In</Link>
          )}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>

        <button className="navbar-mobile-cart" onClick={() => setIsCartOpen(true)} aria-label="Open cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {totalItems > 0 && <span className="navbar-mobile-cart-count">{totalItems}</span>}
        </button>

        <button
          className="navbar-hamburger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          <span className={mobileOpen ? 'hamburger-bar hamburger-bar--top-open' : 'hamburger-bar'} />
          <span className={mobileOpen ? 'hamburger-bar hamburger-bar--mid-open' : 'hamburger-bar'} />
          <span className={mobileOpen ? 'hamburger-bar hamburger-bar--bot-open' : 'hamburger-bar'} />
        </button>
      </div>

      {mobileOpen && (
        <div className="navbar-mobile-nav">
          <Link to="/japanese-menu" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Menu</Link>
          <Link to="/reservations" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Reserve</Link>
          <Link to="/account" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>My Reservations</Link>
          <Link to="/admin/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Admin</Link>
          <Link to="/contact" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Contact</Link>
          <div className="mobile-nav-bottom">
            {user ? (
              <Link to="/profile" className="mobile-nav-profile" onClick={() => setMobileOpen(false)}>
                {user.profile_picture ? (
                  <img src={`/uploads/${user.profile_picture}`} alt="" className="nav-profile-avatar nav-profile-avatar--img" />
                ) : (
                  <span className="nav-profile-avatar">{user.first_name?.[0]?.toUpperCase() || '?'}</span>
                )}
                <span>{user.first_name}</span>
              </Link>
            ) : (
              <Link to="/login" className="mobile-nav-link" style={{ borderBottom: 'none', padding: '0' }} onClick={() => setMobileOpen(false)}>Sign In</Link>
            )}
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      )}
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
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    document.body.style.overflow = selectedItem ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem) return;

    fetch(`/api/reviews/${selectedItem.id}`)
      .then(res => res.json())
      .then(data => setReviews(Array.isArray(data) ? data : []));
  }, [selectedItem]);

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

  async function submitReview() {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: selectedItem.id,
        rating,
        comment
      })
    });

    if (!response.ok) {
      console.error(await response.text());
      return;
    }

    const res = await fetch(`/api/reviews/${selectedItem.id}`);
    setReviews(await res.json());

    setComment('');
  }

  return (
    <div className="page">

      {/* ── Banner ── */}
      <section className="menu-banner" style={{ backgroundImage: `linear-gradient(135deg, rgba(10,0,0,0.82) 0%, rgba(20,4,4,0.75) 60%, rgba(30,6,6,0.70) 100%), url(${process.env.PUBLIC_URL}/images/menu/sashimi-set-b.png)` }}>
        <div className="menu-banner-inner">
          <p className="hero-eyebrow">Ko Japanese Dining</p>
          <h1 className="hero-title">Authentic Japanese cuisine,<br />elevated.</h1>
          <p className="hero-subtitle">
            From hand-pressed nigiri to slow-simmered ramen — every dish is crafted with care and served with intention.
          </p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => document.querySelector('.menu-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Browse Menu
            </button>
            <Link className="btn-outline btn-outline--light" to="/reservations">
              Reserve a Table
            </Link>
          </div>
        </div>
      </section>

      {/* ── Tonight's Highlights ── */}
      {!loading && featuredItems.length > 0 && (
        <section className="highlights-section">
          <div className="highlights-header">
            <p className="section-eyebrow">Chef's Selection</p>
            <h2 className="highlights-title">Tonight's Highlights</h2>
          </div>
          <div className="highlights-grid">
            {featuredItems.map((item, i) => (
              <button key={i} className="highlight-card" onClick={() => {console.log("clicked item:", item); setSelectedItem(item)}}>
                <div className="highlight-img-wrap">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="highlight-card-body">
                  <span className="highlight-badge">Chef's Pick</span>
                  <div className="highlight-card-top">
                    <h3>{item.name}</h3>
                    <span className="highlight-price">${item.price}</span>
                  </div>
                  <p className="highlight-desc">{item.description}</p>
                  <span className="highlight-cta">View &amp; Add to Cart →</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Menu ── */}
      <section className="menu-section">
        <div className="menu-section-header">
          <div>
            <p className="section-eyebrow">Our Menu</p>
            <h2 className="section-title">{selectedTab}</h2>
          </div>
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
        </div>

        {loading ? (
          <div className="menu-loading">Loading menu…</div>
        ) : fetchError ? (
          <div className="menu-loading">Could not load menu. Please make sure the backend server is running.</div>
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
                <button key={i} className="menu-card" onClick={() => {console.log("clicked item:", item); setSelectedItem(item)}}>
                  <div className="menu-card-img-wrap">
                    <img src={item.image} alt={item.name} />
                  </div>
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

      {/* ── Footer ── */}
      <footer className="footer-strip">
        <div className="footer-brand">
          <img src="/Ko_logo.png" alt="Ko" className="footer-logo" />
          <span className="footer-name">Ko Japanese Dining</span>
        </div>
        <span className="footer-copy">© {new Date().getFullYear()} Ko Japanese Dining. All rights reserved.</span>
      </footer>

      {/* ── Item Modal ── */}
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

              {(selectedItem.modifiers?.length > 0 || selectedItem.allergens?.length > 0) && (
                <div className="modal-columns">
                  {selectedItem.modifiers?.length > 0 && (
                    <div className="detail-panel">
                      <h4>Modifiers</h4>
                      <ul>{selectedItem.modifiers.map((mod, i) => <li key={i}>{mod}</li>)}</ul>
                    </div>
                  )}
                  {selectedItem.allergens?.length > 0 && (
                    <div className="detail-panel">
                      <h4>Allergens</h4>
                      <ul>{selectedItem.allergens.map((a, i) => <li key={i}>{a}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}

              <div className="reviews-section">
                <h4 className="reviews-title">Guest Reviews</h4>
                {reviews.length === 0 ? (
                  <p className="reviews-empty">No reviews yet. Be the first!</p>
                ) : (
                  <div className="reviews-list">
                    {reviews.map(r => (
                      <div key={r.review_id} className="review-item">
                        <div className="review-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < r.rating ? 'star star--filled' : 'star'}>★</span>
                          ))}
                        </div>
                        <p className="review-comment">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="review-form">
                  <p className="review-form-label">Leave a review</p>
                  <div className="review-rating-row">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        type="button"
                        className={n <= rating ? 'review-star-btn review-star-btn--on' : 'review-star-btn'}
                        onClick={() => setRating(n)}
                      >★</button>
                    ))}
                  </div>
                  <textarea
                    className="review-textarea"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience with this dish…"
                    rows={3}
                  />
                  <button className="review-submit-btn" onClick={submitReview}>
                    Submit Review
                  </button>
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
  const location = useLocation();
  const isReservationPage =
    location.pathname.startsWith('/reservations') ||
    location.pathname.startsWith('/account');
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminPage && <Navbar theme={theme} toggleTheme={toggle} isReservationPage={isReservationPage} />}
      {!isAdminPage && <Cart />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/japanese-menu" element={<MenuPage />} />
        <Route path="/reservations" element={<ReservationPage />} />
        <Route path="/account" element={<AccountReservationsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:id" element={<OrderStatusPage />} />
        <Route path="/login" element={<AuthPage defaultTab="login" />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={
          <AdminRouteGuard>
            <AdminDashboard />
          </AdminRouteGuard>
        } />
        <Route path="*" element={<NotFound />}/>
      </Routes>
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
