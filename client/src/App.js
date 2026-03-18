import React, { useState } from 'react';

function App() {
  const menu = {
    Appetizers: [
      { name: "Edamame", price: 5, image: "https://via.placeholder.com/80" }
    ],
    Sashimi: [
      { name: "Salmon Sashimi", price: 12, image: "https://via.placeholder.com/80" }
    ],
    Rolls: [
      { name: "California Roll", price: 8, image: "https://via.placeholder.com/80" }
    ],
    Nigiri: [
      { name: "Tuna Nigiri", price: 6, image: "https://via.placeholder.com/80" }
    ],
    Ramen: [
      { name: "Tonkotsu Ramen", price: 14, image: "https://via.placeholder.com/80" }
    ],
    "Rice Dishes": [
      { name: "Chicken Teriyaki Bowl", price: 11, image: "https://via.placeholder.com/80" }
    ]
  };

  const [selectedTab, setSelectedTab] = useState("Appetizers");

  return (
    <div className="App">
      <h1>Ko Japanese Dining</h1>

      {/* Tabs */}
      <div>
        {Object.keys(menu).map((tab) => (
          <button key={tab} onClick={() => setSelectedTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div>
        {menu[selectedTab].map((item, index) => (
          <div key={index} style={{ marginTop: "20px" }}>
            <img src={item.image} alt={item.name} />
            <h3>{item.name}</h3>
            <p>${item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
