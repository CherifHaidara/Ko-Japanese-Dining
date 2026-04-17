import { Link } from 'react-router-dom';
import './SitePages.css';
import {
  HOLIDAY_HOURS,
  PARKING_DETAILS,
  RESTAURANT_INFO,
  WEEKLY_HOURS,
} from '../data/siteContent';

export default function HoursLocationPage() {
  return (
    <div className="site-page">
      <div className="site-page__shell">
        <section
          className="site-hero"
          style={{ backgroundImage: "url('/images/SabaiParallaxBackground.png')" }}
        >
          <div className="site-hero__content">
            <p className="site-eyebrow">Hours & Location</p>
            <h1>Know when we&apos;re serving and how to reach us before you arrive.</h1>
            <p>
              Ko Japanese Dining is located in Dupont Circle on the second floor, with lunch and
              dinner service scheduled across the week and more flexible timing for special events
              and large parties.
            </p>
            <div className="site-hero__actions">
              <a href={RESTAURANT_INFO.mapDirectionsUrl} target="_blank" rel="noreferrer" className="site-hero__primary">
                Get Directions
              </a>
              <Link to="/reservations">Book a Table</Link>
            </div>
          </div>
        </section>

        <section className="site-section">
          <div className="site-split">
            <article className="site-info-card">
              <p className="site-eyebrow">Weekly Hours</p>
              <h3>Regular service schedule</h3>
              <div className="site-hours-grid">
                {WEEKLY_HOURS.map((entry) => (
                  <div key={entry.day} className="site-hours-row">
                    <strong>{entry.day}</strong>
                    <span>{entry.hours}</span>
                  </div>
                ))}
              </div>
            </article>

            <div className="site-info-stack">
              <article className="site-info-card">
                <p className="site-eyebrow">Address</p>
                <h3>{RESTAURANT_INFO.addressLine1}</h3>
                <p>{RESTAURANT_INFO.cityStateZip}</p>
                <p>
                  <a href={RESTAURANT_INFO.phoneHref}>{RESTAURANT_INFO.phoneDisplay}</a>
                </p>
              </article>

              <article className="site-info-card">
                <p className="site-eyebrow">Parking & Access</p>
                <div className="site-feature-list">
                  {PARKING_DETAILS.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="site-section">
          <div className="site-section__header">
            <div>
              <p className="site-eyebrow">Holiday Notes</p>
              <h2>Special scheduling guidance</h2>
            </div>
            <p>
              Hours can adjust around holidays, chef-led tasting events, and private bookings, so
              this page gives guests a clearer view of what to expect before they visit.
            </p>
          </div>

          <div className="site-card-grid">
            {HOLIDAY_HOURS.map((note) => (
              <article key={note.title} className="site-card">
                <h3>{note.title}</h3>
                <p>{note.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="site-section">
          <div className="site-map">
            <iframe
              title="Ko Japanese Dining map"
              src={RESTAURANT_INFO.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
