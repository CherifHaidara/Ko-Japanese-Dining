import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { DIETARY_FILTER_TAGS } from '../data/siteContent';
import ReviewSection from '../components/ReviewSection';

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

const MENU_TYPES = ['Dinner', 'Lunch', 'Brunch'];
const ACCENT_COLORS = ['#7a1212', '#b31717', '#8f1010', '#d61414', '#6d0f0f', '#941515', '#a01818', '#c01010'];

function formatPrice(price) {
  return Number(price).toFixed(2);
}

export default function MenuPage() {
  const { addItem } = useCart();
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null);
  const [menuType, setMenuType] = useState('Dinner');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    let cancelled = false;

    async function loadMenuItems() {
      setLoading(true);
      setFetchError('');

      try {
        const params = new URLSearchParams();
        params.set('menu', menuType);

        if (deferredSearch.trim()) {
          params.set('search', deferredSearch.trim());
        }

        activeTags.forEach((tag) => params.append('tags', tag));

        const response = await fetch(`/api/menu/items?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Could not load menu items.');
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const nextItems = Array.isArray(data.items) ? data.items : [];

        setItems(nextItems.map((item, index) => ({
          ...item,
          image: item.image_url || createDishImage(item.name, ACCENT_COLORS[index % ACCENT_COLORS.length]),
        })));
      } catch (error) {
        if (!cancelled) {
          setFetchError('Could not load menu. Make sure the backend server is running on the configured API port.');
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMenuItems();

    return () => {
      cancelled = true;
    };
  }, [activeTags, deferredSearch, menuType]);

  const groupedMenu = useMemo(() => items.reduce((accumulator, item) => {
    if (!accumulator[item.section_name]) {
      accumulator[item.section_name] = [];
    }

    accumulator[item.section_name].push(item);
    return accumulator;
  }, {}), [items]);

  const sections = Object.keys(groupedMenu);
  const featuredItems = items.filter((item) => item.is_featured);
  const visibleItems = selectedTab ? groupedMenu[selectedTab] || [] : [];

  useEffect(() => {
    if (!sections.length) {
      setSelectedTab(null);
      return;
    }

    if (!selectedTab || !sections.includes(selectedTab)) {
      setSelectedTab(sections[0]);
    }
  }, [sections, selectedTab]);

  const toggleTag = (tag) => {
    setActiveTags((previous) => (
      previous.includes(tag)
        ? previous.filter((item) => item !== tag)
        : [...previous, tag]
    ));
  };

  const clearFilters = () => {
    setSearch('');
    setActiveTags([]);
  };

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">Ko Japanese Dining</p>
          <h1 className="hero-title">Browse the menu with search, dietary filters, and chef highlights.</h1>
          <p className="hero-subtitle">
            Explore lunch, dinner, and brunch selections in one place, then narrow the menu by
            keyword or dietary tags as you type.
          </p>
          <div className="hero-cta">
            <button
              className="btn-primary"
              onClick={() => document.querySelector('.menu-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Browse Menu
            </button>
            <Link className="btn-outline" to="/reservations">
              Reserve a Table
            </Link>
            <button className="btn-outline" onClick={() => toggleTag('Vegetarian')}>
              Filter Vegetarian
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <div className="hero-panel-header">
            <span className="hero-panel-label">Chef Highlights</span>
            <span className="hero-panel-dot" />
          </div>
          <div className="featured-list">
            {featuredItems.length === 0 ? (
              <div className="menu-empty-note">Featured dishes will appear here as menu data loads.</div>
            ) : (
              featuredItems.map((item) => (
                <button key={item.id} className="featured-card" onClick={() => setSelectedItem(item)}>
                  <img src={item.image} alt={item.name} />
                  <div className="featured-card-copy">
                    <span className="featured-tag">Featured</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className="featured-price">${formatPrice(item.price)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="menu-section">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Our Menu</p>
            <h2 className="section-title">{selectedTab || 'Filtered Menu'}</h2>
          </div>
          <p className="section-subtitle">
            Search across dish names and descriptions, then refine by dietary tags.
          </p>
        </div>

        <div className="menu-type-tabs" role="tablist" aria-label="Menu type">
          {MENU_TYPES.map((type) => (
            <button
              key={type}
              className={type === menuType ? 'menu-type-tab is-active' : 'menu-type-tab'}
              onClick={() => setMenuType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="menu-toolbar">
          <label className="menu-search" htmlFor="menu-search">
            <span className="menu-search__label">Search</span>
            <input
              id="menu-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by item name or description"
            />
          </label>

          <div className="menu-filter-group" aria-label="Dietary filters">
            {DIETARY_FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={activeTags.includes(tag) ? 'menu-filter-chip is-active' : 'menu-filter-chip'}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          {(search || activeTags.length > 0) ? (
            <button type="button" className="menu-clear-filters" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="menu-results-summary">
          <span>{items.length} matching items</span>
          {activeTags.length > 0 ? (
            <div className="menu-active-tags">
              {activeTags.map((tag) => (
                <span key={tag} className="menu-active-tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="menu-loading">Loading menu…</div>
        ) : fetchError ? (
          <div className="menu-loading">{fetchError}</div>
        ) : items.length === 0 ? (
          <div className="menu-empty-state">
            <h3>No menu items match those filters.</h3>
            <p>Try a different keyword, clear a tag, or switch to another menu type.</p>
          </div>
        ) : (
          <>
            <div className="tabs" role="tablist" aria-label="Menu sections">
              {sections.map((tab) => (
                <button
                  key={tab}
                  className={tab === selectedTab ? 'tab is-active' : 'tab'}
                  onClick={() => setSelectedTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="menu-grid">
              {visibleItems.map((item) => (
                <button key={item.id} className="menu-card" onClick={() => setSelectedItem(item)}>
                  <img src={item.image} alt={item.name} />
                  <div className="menu-card-body">
                    <div className="menu-card-topline">
                      <h3>{item.name}</h3>
                      <span className="menu-card-price">${formatPrice(item.price)}</span>
                    </div>
                    <p className="menu-card-desc">{item.description}</p>
                    {item.tags?.length ? (
                      <div className="menu-card-meta">
                        {item.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>✕</button>
            <img className="modal-image" src={selectedItem.image} alt={selectedItem.name} />
            <div className="modal-body">
              <div className="modal-topline">
                <h2>{selectedItem.name}</h2>
                <span className="modal-price">${formatPrice(selectedItem.price)}</span>
              </div>
              <p className="modal-desc">{selectedItem.description}</p>
              <button
                className="modal-add-btn"
                onClick={() => {
                  addItem(selectedItem);
                  setSelectedItem(null);
                }}
              >
                Add to Cart — ${formatPrice(selectedItem.price)}
              </button>
              <div className="modal-columns">
                <div className="detail-panel">
                  <h4>Menu Details</h4>
                  <ul>
                    <li>{selectedItem.menu_name}</li>
                    <li>{selectedItem.section_name}</li>
                    <li>{selectedItem.is_available ? 'Currently available' : 'Currently unavailable'}</li>
                  </ul>
                </div>
                <div className="detail-panel">
                  <h4>Dietary Tags</h4>
                  <ul>
                    {(selectedItem.tags?.length ? selectedItem.tags : ['No dietary tags listed']).map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <ReviewSection itemId={selectedItem.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
