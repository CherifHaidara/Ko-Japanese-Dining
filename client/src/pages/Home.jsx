import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import "./Home.css";
import "../components/Footer.css";

function Home() {
  const { addItem, isCartOpen } = useCart();

  const [showTop,      setShowTop]      = useState(false);
  const [previewItems, setPreviewItems] = useState([]);
  const [toast,        setToast]        = useState('');

  const FEATURED_NAMES = ["Karaage", "Tonkatsu", "Spicy Tuna Roll", "Mochi Ice Cream"];


  useEffect(() => {
    fetch('/api/menu/full?menu=Dinner')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const allItems = data.sections.flatMap(s => s.items);
        const featured = FEATURED_NAMES
          .map(name => allItems.find(i => i.name === name))
          .filter(Boolean)
          .map(item => ({
            item_id:     item.item_id,
            name:        item.name,
            price:       item.price,
            description: item.description,
            image:       item.image_url || `/images/menu/${item.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          }));
        setPreviewItems(featured);
      })
      .catch(() => {
        setPreviewItems(FEATURED_NAMES.map(name => ({
          name,
          image: `/images/menu/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          price: null,
        })));
      });
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleAddToCart = (item) => {
    if (!item.price) return;
    addItem({ item_id: item.item_id, name: item.name, price: item.price });
    setToast(item.name);
    setTimeout(() => setToast(''), 2000);
  };

  return (
    <>
      {/* ── Hero ── */}
      <div
        className="parallax parallax--hero"
        style={{ backgroundImage: "url('/images/KoJapaneseParallaxBackground.jpg')" }}
      >
        <div className="overlay"></div>
        <div className="content">
          <h1>Ko Japanese</h1>
          <p>Fine Dining Experience Like Never Before</p>
        </div>
      </div>

      {/* ── Ko Japanese ── */}
      <div id="ko-japanese" className="section">
        <h2>About Ko Japanese</h2>
        <p>
          Experience the essence of Japan in the heart of DC. At Ko Japanese Dining,
          we serve classic Japanese dishes prepared with care and tradition.
          From crisp tempura to popular katsu and karaage, every plate is made fresh each day.
          Enjoy fresh sashimi, crisp fried items, and comforting rice and noodle plates —
          each made to order.
        </p>

        <div className="menu-preview-section">
          <h3>Popular Dishes</h3>
          <div className="menu-preview-grid">
            {previewItems.map((item, i) => (
              <div
                key={i}
                className="menu-preview-card"
                onClick={() => handleAddToCart(item)}
                title={item.price ? `Add ${item.name} to cart` : ''}
              >
                <div className="menu-preview-img-wrap">
                  <img src={item.image} alt={item.name} />
                  {item.price && (
                    <div className="menu-preview-hover-overlay">
                      <span>+ Add to Cart</span>
                    </div>
                  )}
                </div>
                <div className="menu-preview-card-footer">
                  <p className="menu-preview-name">{item.name}</p>
                  {item.price && (
                    <p className="menu-preview-price">${parseFloat(item.price).toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <a href="/japanese-menu" className="button">View Full Menu</a>
        </div>
      </div>

      {/* ── Sabai ── */}
      <div
        className="parallax"
        style={{ backgroundImage: "url('/images/SabaiParallaxBackground.png')" }}
      >
        <div className="overlay"></div>
        <div className="content">
          <h1>Sabai Thai-Lao</h1>
          <p>Fine Dining Experience Like Never Before</p>
        </div>
      </div>

      <div id="sabai" className="section">
        <h2>About Sabai Thai-Lao</h2>
        <p>
          Located in the heart of Dupont Circle, Sabai Thai–Lao Dining brings the vibrant,
          authentic flavors of Thailand and Laos to Washington, D.C. Our family-run restaurant
          celebrates the dishes we grew up with — from savory larb and papaya salad to rich
          curries and grilled skewers — all made with traditional herbs and spices.
        </p>
        <br />
        <a href="https://sabaithai-laodining.com" className="button">Explore menu</a>
      </div>

      {/* ── Ko Bar ── */}
      <div
        className="parallax"
        style={{ backgroundImage: "url('/images/StolenBarImage.jpg')" }}
      >
        <div className="overlay"></div>
        <div className="content">
          <h1>Ko Bar</h1>
          <p>Fine Dining Experience Like Never Before</p>
        </div>
      </div>

      <div id="ko-bar" className="section">
        <h2>About Ko Bar</h2>
        <p>
          Located in the heart of Dupont Circle, Ko Bar offers an elevated lounge experience
          with craft cocktails and a refined atmosphere. The perfect complement to a night of
          exceptional dining — whether you're starting the evening or ending it in style.
        </p>
        <br />
        <a href="#ko-bar" className="button">Explore menu</a>
      </div>

      {/* ── Final Parallax ── */}
      <div
        className="parallax"
        style={{ backgroundImage: "url('/images/menu/sashimi-tempura-kaiseki.png')" }}
      >
        <div className="overlay"></div>
        <div className="content">
          <h1>Fresh Ingredients</h1>
          <p>Only the best, sourced locally and globally</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-col">
            <h3>Ko Dining</h3>
            <p>Experience elevated dining in the heart of the city.</p>
          </div>
          <div className="footer-col">
            <h4>Location</h4>
            <p>1610 20th St NW, 2nd Floor<br />Washington, DC 20009</p>
          </div>
          <div className="footer-col">
            <h4>Hours</h4>
            <p>Mon: Closed<br />Tue - Sun: See website</p>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><a href="#">Restaurants</a></li>
              <li><a href="#">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Ko Dining | Privacy Policy</p>
        </div>
      </footer>

      {showTop && !isCartOpen && (
        <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top">↑</button>
      )}

      {toast && (
        <div className="cart-toast">{toast} added to cart!</div>
      )}
    </>
  );
}

export default Home;
