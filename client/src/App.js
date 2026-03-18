import React, { useState } from 'react';

function App() {
  const menu = {
    Appetizers: [
      {
        name: "Edamame",
        price: 5,
        image: "https://via.placeholder.com/80",
        description: "Steamed soybeans with sea salt",
        modifiers: ["Extra salt", "No salt"],
        allergens: ["Soy"]
      }
    ],
    Sashimi: [
      {
        name: "Salmon Sashimi",
        price: 12,
        image: "https://via.placeholder.com/80",
        description: "Fresh sliced salmon",
        modifiers: ["Extra wasabi"],
        allergens: ["Fish"],
        is_featured: true
      }
    ],
    Rolls: [
      {
        name: "California Roll",
        price: 8,
        image: "https://via.placeholder.com/80",
        description: "Crab, avocado, and cucumber",
        modifiers: ["Extra spicy", "No rice"],
        allergens: ["Shellfish"]
      }
    ],
    Nigiri: [
      {
        name: "Tuna Nigiri",
        price: 6,
        image: "https://via.placeholder.com/80",
        description: "Fresh tuna over rice",
        modifiers: ["Extra rice"],
        allergens: ["Fish"],
        is_featured: true
      }
    ],
    Ramen: [
      {
        name: "Tonkotsu Ramen",
        price: 14,
        image: "https://via.placeholder.com/80",
        description: "Pork broth ramen with noodles",
        modifiers: ["Extra noodles", "Spicy"],
        allergens: ["Wheat"]
      }
    ],
    "Rice Dishes": [
      {
        name: "Chicken Teriyaki Bowl",
        price: 11,
        image: "https://via.placeholder.com/80",
        description: "Grilled chicken with teriyaki sauce over rice",
        modifiers: ["Extra sauce"],
        allergens: ["Soy"],
        is_featured: true
      }
    ]
  };

  const [selectedTab, setSelectedTab] = useState("Appetizers");
  const [selectedItem, setSelectedItem] = useState(null);
  const featuredItems = Object.values(menu)
  .flat()
  .filter(item => item.is_featured);

  return (
    <div className="App">
      <h1>Ko Japanese Dining</h1>

      {/* Featured Items */}
      <h2>Featured Items</h2>
  
      <div>
        {featuredItems.map((item, index) => (
          <div
            key={index}
            onClick={() => setSelectedItem(item)}
            style={{
              cursor: "pointer",
              marginTop: "10px",
              border: "2px solid gold",
              padding: "10px"
            }}
          >
            <img src={item.image} alt={item.name} />
            <h3>{item.name}</h3>
            <p>${item.price}</p>
          </div>
        ))}
      </div>
  
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
          <div
            key={index}
            onClick={() => setSelectedItem(item)}
            style={{ cursor: "pointer", marginTop: "20px" }}
          >
            <img src={item.image} alt={item.name} />
            <h3>{item.name}</h3>
            <p>${item.price}</p>
          </div>
        ))}
      </div>

      {/*MODAL */}
      {selectedItem && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)"
        }}>
          <div style={{
            background: "white",
            margin: "10% auto",
            padding: "20px",
            width: "300px"
          }}>
            <button onClick={() => setSelectedItem(null)}>Close</button>

            <img src={selectedItem.image} alt={selectedItem.name} />
            <h2>{selectedItem.name}</h2>
            <p>${selectedItem.price}</p>

            <p>{selectedItem.description}</p>

            <h4>Modifiers:</h4>
            <ul>
              {selectedItem.modifiers?.map((mod, i) => (
                <li key={i}>{mod}</li>
              ))}
            </ul>

            <h4>Allergens:</h4>
            <ul>
              {selectedItem.allergens?.map((allergen, i) => (
                <li key={i}>{allergen}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
