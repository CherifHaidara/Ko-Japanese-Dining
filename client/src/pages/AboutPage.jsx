import { Link } from 'react-router-dom';
import './SitePages.css';
import {
  ABOUT_PHOTOS,
  ABOUT_STORY_SECTIONS,
} from '../data/siteContent';

export default function AboutPage() {
  return (
    <div className="site-page">
      <div className="site-page__shell">
        <section
          className="site-hero"
          style={{ backgroundImage: "url('/images/StolenBarImage.jpg')" }}
        >
          <div className="site-hero__content">
            <p className="site-eyebrow">About Ko Japanese Dining</p>
            <h1>A family-run restaurant shaped by Japanese tradition and personal hospitality.</h1>
            <p>
              Ko was built to bring the warmth, pacing, and detail of traditional Japanese dining
              into an intimate Dupont Circle setting where guests can feel both welcomed and cared
              for.
            </p>
            <div className="site-hero__actions">
              <Link to="/reservations" className="site-hero__primary">
                Reserve a Table
              </Link>
              <Link to="/japanese-menu">View Menu</Link>
            </div>
          </div>
        </section>

        <section className="site-section">
          <div className="site-section__header">
            <div>
              <p className="site-eyebrow">The Story</p>
              <h2>Built on culture, craft, and a sense of welcome.</h2>
            </div>
            <p>
              The restaurant story, the chef&apos;s perspective, and the cuisine philosophy all feed the
              same goal: to make each visit feel grounded in tradition without losing warmth.
            </p>
          </div>

          <div className="site-card-grid">
            {ABOUT_STORY_SECTIONS.map((section) => (
              <article key={section.title} className="site-card">
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="site-section">
          <div className="site-section__header">
            <div>
              <p className="site-eyebrow">Interior</p>
              <h2>An atmosphere designed to feel calm, intimate, and occasion-worthy.</h2>
            </div>
            <p>
              These visual moments help set expectations for the experience: polished but not stiff,
              celebratory without losing the comfort of a neighborhood dining room.
            </p>
          </div>

          <div className="site-photo-grid">
            {ABOUT_PHOTOS.map((photo) => (
              <figure key={photo.caption} className="site-photo-card">
                <img src={photo.src} alt={photo.alt} />
                <figcaption>{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="site-cta-band">
          <p className="site-eyebrow">Experience It In Person</p>
          <h3>See how the setting, service, and menu work together once you&apos;re in the room.</h3>
          <p>
            Whether you are coming for a standard reservation or a more ceremonial tasting menu,
            the goal is the same: a meal that feels considered from the first bite to the final
            course.
          </p>
          <div className="site-cta-band__actions">
            <Link to="/hours-location" className="btn-outline">
              Hours & Location
            </Link>
            <Link to="/contact" className="btn-primary">
              Contact the Team
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
