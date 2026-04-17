import { Link } from 'react-router-dom';
import './SitePages.css';
import {
  HOME_HIGHLIGHTS,
  MENU_PREVIEW_ITEMS,
  RESTAURANT_INFO,
} from '../data/siteContent';

export default function Home() {
  return (
    <div className="site-page">
      <div className="site-page__shell">
        <section
          className="site-hero"
          style={{ backgroundImage: "url('/images/KoJapaneseParallaxBackground.jpg')" }}
        >
          <div className="site-hero__content">
            <p className="site-eyebrow">Dupont Circle • Traditional Japanese Dining</p>
            <h1>Japanese tradition, family warmth, and a dinner worth slowing down for.</h1>
            <p>
              Ko Japanese Dining brings together chef-led tasting experiences, comforting classics,
              and an intimate atmosphere designed for everything from a casual lunch to a full
              celebratory evening.
            </p>
            <div className="site-hero__actions">
              <Link to="/japanese-menu" className="site-hero__primary">
                Explore the Menu
              </Link>
              <Link to="/reservations">Reserve a Table</Link>
              <Link to="/about">Our Story</Link>
            </div>
          </div>
        </section>

        <section className="site-section">
          <div className="site-section__header">
            <div>
              <p className="site-eyebrow">Why Guests Come Back</p>
              <h2>Built around hospitality, precision, and pace.</h2>
            </div>
            <p>
              The current Ko experience blends intimate service with classic Japanese dishes,
              giving the restaurant room to feel both refined and welcoming.
            </p>
          </div>

          <div className="site-card-grid">
            {HOME_HIGHLIGHTS.map((highlight) => (
              <article key={highlight.title} className="site-card">
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="site-section">
          <div className="site-section__header">
            <div>
              <p className="site-eyebrow">From the Kitchen</p>
              <h2>Signature dishes that anchor the menu.</h2>
            </div>
            <p>
              Start with the favorites that already define the restaurant, then move into the
              larger lunch, dinner, and tasting selections.
            </p>
          </div>

          <div className="site-preview-grid">
            {MENU_PREVIEW_ITEMS.map((item) => (
              <article key={item.name} className="site-preview-card">
                <img src={item.image} alt={item.name} />
                <div className="site-preview-card__body">
                  <p>{item.name}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="site-section">
          <div className="site-split">
            <article className="site-info-card">
              <p className="site-eyebrow">Visit Ko</p>
              <h3>Second-floor dining in the heart of Dupont Circle.</h3>
              <p>
                Find us at {RESTAURANT_INFO.addressLine1}, {RESTAURANT_INFO.cityStateZip}. The
                room is intimate by design, which makes reservations especially helpful during
                dinner hours and tasting-menu evenings.
              </p>
              <div className="site-hero__actions">
                <Link to="/hours-location" className="site-hero__primary">
                  Hours & Location
                </Link>
                <a href={RESTAURANT_INFO.mapDirectionsUrl} target="_blank" rel="noreferrer">
                  Get Directions
                </a>
              </div>
            </article>

            <div className="site-photo-card">
              <img src="/images/StolenBarImage.jpg" alt="Ko Japanese Dining ambience" />
              <figcaption>
                A warm, intimate setting that makes a quick dinner feel personal and a special
                occasion feel memorable.
              </figcaption>
            </div>
          </div>
        </section>

        <section className="site-cta-band">
          <p className="site-eyebrow">Plan Your Visit</p>
          <h3>Come for lunch, stay for dinner, and return for the chef-led experience.</h3>
          <p>
            Explore the full menu, book a reservation, or get in touch for group dining and
            special requests.
          </p>
          <div className="site-cta-band__actions">
            <Link to="/reservations" className="btn-primary">
              Reserve Now
            </Link>
            <Link to="/contact" className="btn-outline">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
