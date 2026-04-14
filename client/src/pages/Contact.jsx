import React, { useState } from "react";

import "./Contact.css";
import "../components/Footer.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: "",
  });


  
  const [formMessage, setFormMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage("");
    const { name, email, phone, subject, message } = formData;

    if (!name || !email || !phone || !message) {
      setIsError(true);
      setFormMessage("Please fill out all fields.");
      return;
    }

    setIsError(false);

    try {
      const res = await fetch("http://localhost:5050/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setFormMessage("Thank you! Your message has been sent.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "general",
          message: "",
        });
      } else {
        setIsError(true);
        setFormMessage(data.error ||"Something went wrong. Try again.");
      }
    } catch (err) {
      setIsError(true);
      setFormMessage(err.message || "Server error. Try again later.");
    }
  };

  /*
  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, email, phone, message } = formData;

    if (!name || !email || !phone || !message) {
      setIsError(true);
      setFormMessage("Please fill out all fields.");
      return;
    }

    setIsError(false);
    setFormMessage("Thank you! Your message has been sent. An email has been sent");
    
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "general",
      message: "",
    });
  };
  */

  return (
    <>
      <div className="container">
        <div className="contact-grid">
          {/* Contact Info */}
          <div className="contact-info">
            <h2>Reach Out to Us—We’re Always Happy to Help</h2>

            <div className="info-item">
              <strong>📍 Address:</strong><br />
              1610 20th St NW, 2nd Floor<br />
              Washington, DC 20009
            </div>

            <div className="info-item">
              <strong>📞 Phone:</strong><br />
              +1 (771)-772-3358
            </div>

            <div className="info-item">
              <strong>✉️ Email:</strong><br />
              ko@kojapanesedining.com
            </div>

            <div className="info-item">
              <strong>🕒 Hours:</strong><br />
              Mon: Closed<br />
              Tue - Thur: 11:30am - 3pm & 5pm - 9pm<br />
              Fri: 11:30am - 3pm & 5pm - 10pm<br />
              Sat: 11:30am - 10pm<br />
              Sun: 11:30am - 9pm<br />
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form">
            <h2 style={{ textAlign: "center" }}>Contact Us</h2>
            <p style={{ textAlign: "center" }}>
              We will get back to you as soon as possible
            </p>

            <form onSubmit={handleSubmit}>
              <label className="required-label">Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
              />

              <label className="required-label">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your Email"
              />

              <label className="required-label">Phone #</label>
              <input
                type="text"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Your Phone Number"
              />

              <label className="required-label">Subject</label>
              <select
                id="subject"
                value={formData.subject}
                onChange={handleChange}
              >
                <option value="general">General Inquiry</option>
                <option value="catering">Catering</option>
                <option value="comments">Feedback/Comments</option>
                <option value="other">Other</option>
              </select>

              <label className="required-label">Message</label>
              <textarea
                id="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your message..."
              ></textarea>

              <button type="submit" className="send-button">
                Send Message
              </button>

              <p style={{ color: isError ? "red" : "limegreen" }}>
                {formMessage}
              </p>
            </form>
          </div>
        </div>

        {/* Map */}
        <div className="map-wrapper">
          <div className="map">
            <iframe
              title="map"
              src="https://maps.google.com/maps?q=38.911635,-77.047625&z=15&output=embed"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-col">
            <h3>Ko Dining</h3>
            <p>Experience elevated dining in the heart of the city.</p>
          </div>

          <div className="footer-col">
            <h4>Location</h4>
            <p>
              1610 20th St NW, 2nd Floor<br />
              Washington, DC 20009
            </p>
          </div>

          <div className="footer-col">
            <h4>Hours</h4>
            <p>
              Mon: Closed<br />
              Tue - Thur: 11:30am - 3pm & 5pm - 9pm<br />
              Fri: 11:30am - 3pm & 5pm - 10pm<br />
              Sat: 11:30am - 10pm<br />
              Sun: 11:30am - 9pm
            </p>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><a href="#">Restaurants</a></li>
              <li><a href="#">About</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Ko Dining | Privacy Policy</p>
        </div>
      </footer>
    </>
  );
};

export default Contact;