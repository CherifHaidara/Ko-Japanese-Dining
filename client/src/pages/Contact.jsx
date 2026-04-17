import React, { useState } from 'react';
import './SitePages.css';
import { RESTAURANT_INFO, WEEKLY_HOURS } from '../data/siteContent';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: '',
  });
  const [formMessage, setFormMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage('');
    const { name, email, phone, message } = formData;

    if (!name || !email || !phone || !message) {
      setIsError(true);
      setFormMessage('Please fill out all fields.');
      return;
    }

    setIsError(false);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setFormMessage('Thank you! Your message has been sent.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: 'general',
          message: '',
        });
      } else {
        setIsError(true);
        setFormMessage(data.error || 'Something went wrong. Try again.');
      }
    } catch (err) {
      setIsError(true);
      setFormMessage(err.message || 'Server error. Try again later.');
    }
  };

  return (
    <div className="site-page">
      <div className="site-page__shell">
        <section
          className="site-hero"
          style={{ backgroundImage: "url('/images/KoJapaneseParallaxBackground.jpg')" }}
        >
          <div className="site-hero__content">
            <p className="site-eyebrow">Contact Us</p>
            <h1>Reach out for reservations, catering questions, and special dining requests.</h1>
            <p>
              We&apos;re happy to help with directions, private dining questions, and planning for
              larger groups or tasting-menu visits.
            </p>
          </div>
        </section>

        <section className="site-section">
          <div className="site-split">
            <div className="site-info-stack">
              <article className="site-info-card">
                <p className="site-eyebrow">Visit</p>
                <h3>{RESTAURANT_INFO.addressLine1}</h3>
                <p>{RESTAURANT_INFO.cityStateZip}</p>
              </article>

              <article className="site-info-card">
                <p className="site-eyebrow">Call or Email</p>
                <p>
                  <a href={RESTAURANT_INFO.phoneHref}>{RESTAURANT_INFO.phoneDisplay}</a>
                </p>
                <p>
                  <a href={`mailto:${RESTAURANT_INFO.email}`}>{RESTAURANT_INFO.email}</a>
                </p>
              </article>

              <article className="site-info-card">
                <p className="site-eyebrow">Hours</p>
                <div className="site-hours-grid">
                  {WEEKLY_HOURS.map((entry) => (
                    <div key={entry.day} className="site-hours-row">
                      <strong>{entry.day}</strong>
                      <span>{entry.hours}</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <article className="site-info-card">
              <p className="site-eyebrow">Send a Message</p>
              <h3>We&apos;ll get back to you as soon as we can.</h3>

              <form className="site-form" onSubmit={handleSubmit}>
                <div className="site-form__row">
                  <label htmlFor="name">
                    Name
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name"
                    />
                  </label>

                  <label htmlFor="email">
                    Email
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                    />
                  </label>
                </div>

                <div className="site-form__row">
                  <label htmlFor="phone">
                    Phone
                    <input
                      type="text"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your Phone Number"
                    />
                  </label>

                  <label htmlFor="subject">
                    Subject
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={handleChange}
                    >
                      <option value="general">General Inquiry</option>
                      <option value="catering">Catering</option>
                      <option value="comments">Feedback / Comments</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                </div>

                <label htmlFor="message">
                  Message
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help?"
                  />
                </label>

                <button type="submit" className="site-form__submit">
                  Send Message
                </button>

                {formMessage ? (
                  <p className={isError ? 'site-form__message is-error' : 'site-form__message is-success'}>
                    {formMessage}
                  </p>
                ) : null}
              </form>
            </article>
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
};

export default Contact;
