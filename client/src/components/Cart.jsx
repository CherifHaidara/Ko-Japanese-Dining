import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

const TAX_RATE = 0.0875;

export default function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  const tax = totalPrice * TAX_RATE;
  const orderTotal = totalPrice + tax;

  return (
    <>
      <button className="cart-btn" onClick={() => setIsOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        Cart
        {totalItems > 0 && (
          <span className="cart-btn-count">{totalItems}</span>
        )}
      </button>

      {isOpen && (
        <div className="cart-overlay" onClick={() => setIsOpen(false)}>
          <div className="cart-panel" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="cart-header">
              <div className="cart-header-left">
                <h2>Your Order</h2>
                {totalItems > 0 && (
                  <span className="cart-item-count">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                )}
              </div>
              <button className="cart-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {/* Empty State */}
            {items.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">🍱</div>
                <p className="cart-empty-title">Your cart is empty</p>
                <p className="cart-empty-sub">Add items from the menu to get started</p>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="cart-items">
                  {items.map(item => (
                    <div key={item.name} className="cart-item">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-img"
                      />
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-unit-price">${item.price.toFixed(2)} each</p>
                        <div className="cart-item-controls">
                          <button className="cart-qty-btn" onClick={() => updateQuantity(item.name, item.quantity - 1)}>−</button>
                          <span className="cart-qty">{item.quantity}</span>
                          <button className="cart-qty-btn" onClick={() => updateQuantity(item.name, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <div className="cart-item-right">
                        <p className="cart-item-line-total">${(item.price * item.quantity).toFixed(2)}</p>
                        <button className="cart-remove" onClick={() => removeItem(item.name)} aria-label="Remove item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="cart-footer">
                  <div className="cart-summary">
                    <div className="cart-summary-row">
                      <span>Subtotal</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="cart-summary-row">
                      <span>Tax (8.75%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="cart-summary-divider" />
                    <div className="cart-summary-row cart-summary-total">
                      <span>Order Total</span>
                      <span>${orderTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button className="cart-checkout-btn" onClick={() => { setIsOpen(false); navigate('/checkout'); }}>Proceed to Checkout</button>
                  <button className="cart-clear-btn" onClick={clearCart}>Clear cart</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
