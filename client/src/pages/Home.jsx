import {useRef} from "react";
import "./Home.css";
import "../components/Footer.css";

function Home() {
  const menuRef = useRef(null);

  

  const toggleMenu = (e) => {
    e.preventDefault();
    menuRef.current.classList.toggle("show");
  };

  return (
    <>

      {/* Hero Section */}
      <div
        className="parallax"
        style={{
          backgroundImage:
            "url('/images/KoJapaneseParallaxBackground.jpg')",
        }}
      >
        <div className="overlay"></div>
        <div className="content">
          <h1>Ko Japanese</h1>
          <p>Fine Dining Experience Like Never Before</p>
        </div>
      </div>

      {/* About */}
      <div className="section">
        <h2>About Ko Japanese</h2>
        <p>
          Experience the essence of Japan in the heart of DC. At Ko Japanese Dining, 
          we serve classic Japanese dishes prepared with care and tradition. 
          From crisp tempura to popular katsu and karaage, every plate is made fresh each day.
          Our menu brings classic Japanese cooking to life with a delicious range of dishes. 
          Enjoy fresh sashimi, crisp fried items, and comforting rice and noodle plates. 
          Many guests love our karaage, tempura, and chicken katsu, each made to order. 
          Want an elevated experience? 
        </p>
        <br />
        <a href="/japanese-menu" className="button">
          Explore menu
        </a>
      </div>

      {/* Sabai */}
      <div
        className="parallax"
        style={{
          backgroundImage:
            "url('/images/SabaiParallaxBackground.png')",
        }}
      >
        <div className="overlay"></div>
        <div className="content">
          <h1>Sabai Thai-Lao</h1>
          <p>Fine Dining Experience Like Never Before</p>
        </div>
      </div>

      <div className="section">
        <h2>About Sabai Thai-Lao</h2>
        <p>
          Located in the heart of Dupont Circle, Sabai Thai–Lao Dining brings the vibrant, authentic flavors of Thailand and Laos to Washington, 
          D.C. Our family-run restaurant celebrates the dishes we grew up with — from savory larb and papaya salad to rich curries and 
          grilled skewers — all made with traditional herbs and spices. 
          We take pride in sharing the warmth of Thai–Lao hospitality while adding our own creative twist to classic recipes. 
        </p>
        <br />
        <a href="https://sabaithai-laodining.com" className="button">
          Explore menu
        </a>
      </div>

      {/* Bar */}
      <div
        className="parallax"
        style={{
          backgroundImage: "url('/images/StolenBarImage.jpg')",
        }}
      >
        <div className="overlay"></div>
        <div className="content">
          <h1>Ko Bar</h1>
          <p>Fine Dining Experience Like Never Before</p>
        </div>
      </div>

      <div className="section">
        <h2>About Ko Bar</h2>
        <p>
          Located in the heart of Dupont Circle, Sabai Thai–Lao Dining brings the vibrant, authentic flavors of Thailand and Laos to Washington, 
          D.C. Our family-run restaurant celebrates the dishes we grew up with — from savory larb and papaya salad to rich curries and 
          grilled skewers — all made with traditional herbs and spices. 
          We take pride in sharing the warmth of Thai–Lao hospitality while adding our own creative twist to classic recipes. 
        </p>
        <br />
        <a href="#Bar" className="button">
          Explore menu
        </a>
      </div>

      {/* Final Parallax */}
      <div
        className="parallax"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1544025162-d76694265947')",
        }}
      >
        <div className="overlay"></div>
        <div className="content">
          <h1>Fresh Ingredients</h1>
          <p>Only the best, sourced locally and globally</p>
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
              1610 20th St NW, 2nd Floor
              <br />
              Washington, DC 20009
            </p>
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
    </>
  );
}

export default Home;