import React, { useMemo, useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminRouteGuard from './components/AdminRouteGuard';
import AdminLoginPage from './pages/AdminLoginPage';


function createDishImage(title, accent) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#050505" />
          <stop offset="55%" stop-color="#160909" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
        <radialGradient id="glow" cx="72%" cy="28%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.55)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="640" height="420" fill="url(#bg)" />
      <circle cx="492" cy="96" r="150" fill="url(#glow)" opacity="0.28" />
      <circle cx="452" cy="218" r="124" fill="rgba(255,255,255,0.06)" />
      <circle cx="452" cy="218" r="100" fill="rgba(0,0,0,0.42)" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
      <circle cx="452" cy="218" r="66" fill="${accent}" opacity="0.82" />
      <path d="M390 218c44-32 80-36 124 0" stroke="rgba(255,255,255,0.7)" stroke-width="4" fill="none" stroke-linecap="round" />
      <text x="44" y="296" fill="#ffffff" font-size="42" font-family="Georgia, serif" font-weight="700">${title}</text>
      <text x="44" y="336" fill="rgba(255,255,255,0.62)" font-size="18" font-family="Segoe UI, sans-serif" letter-spacing="4">KO JAPANESE DINING</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createDishPreview(accent) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#050505" />
          <stop offset="45%" stop-color="#140909" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
        <radialGradient id="glow" cx="74%" cy="22%" r="72%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="640" height="420" fill="url(#bg)" />
      <circle cx="470" cy="96" r="150" fill="url(#glow)" opacity="0.35" />
      <ellipse cx="320" cy="228" rx="170" ry="112" fill="rgba(255,255,255,0.08)" />
      <ellipse cx="320" cy="228" rx="136" ry="88" fill="rgba(0,0,0,0.42)" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
      <circle cx="276" cy="214" r="42" fill="${accent}" opacity="0.92" />
      <circle cx="356" cy="238" r="36" fill="rgba(255,255,255,0.85)" opacity="0.88" />
      <path d="M236 208c30-18 62-25 96-23 35 2 66 12 98 31" stroke="rgba(255,255,255,0.72)" stroke-width="4" fill="none" stroke-linecap="round" />
      <rect x="42" y="44" width="96" height="8" rx="4" fill="rgba(255,255,255,0.35)" />
      <rect x="42" y="62" width="142" height="8" rx="4" fill="rgba(255,255,255,0.18)" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function MenuPage() {
  const menu = useMemo(
    () => ({
      Appetizers: [
        {
          name: "Edamame",
          price: 5,
          previewImage: createDishPreview("#7a1212"),
          image: createDishImage("Edamame", "#7a1212"),
          description: "Steamed soybeans finished with sea salt and a clean citrus lift.",
          modifiers: ["Extra salt", "No salt"],
          allergens: ["Soy"]
        }
      ],
      Sashimi: [
        {
          name: "Salmon Sashimi",
          price: 12,
          previewImage: createDishPreview("#b31717"),
          image: createDishImage("Salmon Sashimi", "#b31717"),
          description: "Thick-cut Atlantic salmon served chilled with wasabi and soy.",
          modifiers: ["Extra wasabi"],
          allergens: ["Fish"],
          is_featured: true
        }
      ],
      Rolls: [
        {
          name: "California Roll",
          price: 8,
          previewImage: createDishPreview("#8f1010"),
          image: createDishImage("California Roll", "#8f1010"),
          description: "Crab, avocado, and cucumber wrapped for a crisp, balanced bite.",
          modifiers: ["Extra spicy", "No rice"],
          allergens: ["Shellfish"]
        }
      ],
      Nigiri: [
        {
          name: "Tuna Nigiri",
          price: 6,
          previewImage: createDishPreview("#d61414"),
          image: createDishImage("Tuna Nigiri", "#d61414"),
          description: "Fresh tuna over seasoned rice with a soft soy glaze.",
          modifiers: ["Extra rice"],
          allergens: ["Fish"],
          is_featured: true
        }
      ],
      Ramen: [
        {
          name: "Tonkotsu Ramen",
          price: 14,
          previewImage: createDishPreview("#6d0f0f"),
          image: createDishImage("Tonkotsu Ramen", "#6d0f0f"),
          description: "Rich pork broth, springy noodles, and layered umami toppings.",
          modifiers: ["Extra noodles", "Spicy"],
          allergens: ["Wheat"]
        }
      ],
      "Rice Dishes": [
        {
          name: "Chicken Teriyaki Bowl",
          price: 11,
          previewImage: createDishPreview("#941515"),
          image: createDishImage("Chicken Teriyaki Bowl", "#941515"),
          description: "Grilled chicken with glossy teriyaki over hot steamed rice.",
          modifiers: ["Extra sauce"],
          allergens: ["Soy"],
          is_featured: true
        }
      ]
    }),
    []
  );

  const [selectedTab, setSelectedTab] = useState("Appetizers");
  const [selectedItem, setSelectedItem] = useState(null);

  const categories = Object.keys(menu);
  const featuredItems = useMemo(
    () => Object.values(menu).flat().filter((item) => item.is_featured),
    [menu]
  );

  return (
    <div className="app-shell">
      <div className="app-glow app-glow-left" />
      <div className="app-glow app-glow-right" />

      <main className="app">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Ko Japanese Dining</p>
            <h1>Bold Japanese comfort with a darker, sharper atmosphere.</h1>
            <p className="hero-text">
              A refined black-and-red menu experience built to feel more like a late-night dining room than a default starter app.
            </p>
            <div className="hero-stats">
              <div className="stat-card">
                <span className="stat-value">{categories.length}</span>
                <span className="stat-label">Menu Sections</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{featuredItems.length}</span>
                <span className="stat-label">Chef Picks</span>
              </div>
            </div>
            <div className="hero-actions">
              <Link className="hero-action hero-action-primary" to="/admin/login">
                Admin Access
              </Link>
              <button
                className="hero-action hero-action-secondary"
                onClick={() => setSelectedTab("Rice Dishes")}
              >
                View Popular Dishes
              </button>
            </div>
            <div className="signature-note">
              <span className="signature-kicker">Late Night Mood</span>
              <p>
                Charred reds, polished blacks, and a cleaner editorial layout that feels closer to a modern dining brand.
              </p>
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-inner">
              <span className="hero-panel-label">Tonight&apos;s Highlights</span>
              <div className="featured-list">
                {featuredItems.map((item, index) => (
                  <button
                    key={index}
                    className="featured-card"
                    onClick={() => setSelectedItem(item)}
                  >
                    <img src={item.previewImage} alt={item.name} />
                    <div className="featured-card-copy">
                      <span className="featured-tag">Featured</span>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <span className="price">${item.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="menu-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Explore The Menu</p>
              <h2>{selectedTab}</h2>
            </div>
            <p className="section-text">
              Choose a category and tap any dish to view modifiers, allergens, and details.
            </p>
          </div>

          <div className="tabs" role="tablist" aria-label="Menu categories">
            {categories.map((tab) => (
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
            {menu[selectedTab].map((item, index) => (
              <button
                key={index}
                className="menu-card"
                onClick={() => setSelectedItem(item)}
              >
                <img src={item.previewImage} alt={item.name} />
                <div className="menu-card-body">
                  <div className="menu-card-topline">
                    <h3>{item.name}</h3>
                    <span className="price">${item.price}</span>
                  </div>
                  <p>{item.description}</p>
                  <div className="meta-row">
                    <span>{item.modifiers?.length || 0} modifiers</span>
                    <span>{item.allergens?.join(", ")}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="service-strip">
            <div className="service-card">
              <span className="service-label">Dining Room</span>
              <strong>Open late with a darker lounge feel</strong>
            </div>
            <div className="service-card">
              <span className="service-label">Chef Focus</span>
              <strong>Sashimi, nigiri, ramen, and rice bowls</strong>
            </div>
            <div className="service-card">
              <span className="service-label">Experience</span>
              <strong>Tap any dish for details, modifiers, and allergens</strong>
            </div>
          </div>
        </section>
      </main>

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>
              Close
            </button>

            <img className="modal-image" src={selectedItem.image} alt={selectedItem.name} />

            <div className="modal-header">
              <div>
                <p className="eyebrow">Dish Details</p>
                <h2>{selectedItem.name}</h2>
              </div>
              <span className="price">${selectedItem.price}</span>
            </div>

            <p className="modal-description">{selectedItem.description}</p>

            <div className="modal-columns">
              <div className="detail-panel">
                <h4>Modifiers</h4>
                <ul>
                  {selectedItem.modifiers?.map((mod, i) => (
                    <li key={i}>{mod}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-panel">
                <h4>Allergens</h4>
                <ul>
                  {selectedItem.allergens?.map((allergen, i) => (
                    <li key={i}>{allergen}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={
          <AdminRouteGuard>
            <AdminDashboard />
          </AdminRouteGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}


export default App;
