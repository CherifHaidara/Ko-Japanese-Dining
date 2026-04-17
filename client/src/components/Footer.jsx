import { Link } from 'react-router-dom';
import './Footer.css';
import {
  FOOTER_NAV_LINKS,
  RESTAURANT_INFO,
  SOCIAL_LINKS,
  WEEKLY_HOURS,
} from '../data/siteContent';

export default function Footer() {
  const todayHours = WEEKLY_HOURS.find(({ day }) => day === 'Friday');

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="site-footer__brand-mark">
            <img src="/Ko_logo.png" alt="Ko Japanese Dining" />
          </div>
          <div>
            <p className="site-footer__eyebrow">Ko Japanese Dining</p>
            <h2>{RESTAURANT_INFO.name}</h2>
            <p className="site-footer__lede">
              Traditional Japanese cuisine, family hospitality, and chef-led experiences in the heart of Dupont Circle.
            </p>
          </div>
        </div>

        <div className="site-footer__grid">
          <section className="site-footer__column">
            <h3>Visit</h3>
            <p>{RESTAURANT_INFO.addressLine1}</p>
            <p>{RESTAURANT_INFO.cityStateZip}</p>
            <p>
              <a href={RESTAURANT_INFO.phoneHref}>{RESTAURANT_INFO.phoneDisplay}</a>
            </p>
            <p>
              <a href={`mailto:${RESTAURANT_INFO.email}`}>{RESTAURANT_INFO.email}</a>
            </p>
          </section>

          <section className="site-footer__column">
            <h3>Hours</h3>
            <p>Today&apos;s featured service</p>
            <strong>{todayHours ? `Friday: ${todayHours.hours}` : 'See hours page for details'}</strong>
            <Link to="/hours-location" className="site-footer__link">
              View full weekly schedule
            </Link>
          </section>

          <section className="site-footer__column">
            <h3>Explore</h3>
            <nav className="site-footer__links" aria-label="Footer navigation">
              {FOOTER_NAV_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="site-footer__link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </section>

          <section className="site-footer__column">
            <h3>Follow</h3>
            <div className="site-footer__links">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="site-footer__link"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Ko Japanese Dining. All rights reserved.</span>
          <span>Crafted for lunch service, dinner service, and special tasting experiences.</span>
        </div>
      </div>
    </footer>
  );
}
