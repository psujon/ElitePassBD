import React, { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Load cart on start
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (e) {
        console.error('Failed to parse cart storage', e);
      }
    }
  }, []);

  // Sync cart to localStorage
  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const addToCart = (product, qty = 1) => {
    const existingIndex = cartItems.findIndex((item) => item.product_id === product.id);
    const orderQty = parseInt(qty);

    if (existingIndex > -1) {
      const updated = [...cartItems];
      const newQty = updated[existingIndex].quantity + orderQty;
      
      // Enforce product stock limit
      if (newQty > product.stock) {
        alert(`Cannot add more. Only ${product.stock} items available in stock.`);
        return false;
      }
      
      updated[existingIndex].quantity = newQty;
      saveCart(updated);
    } else {
      if (orderQty > product.stock) {
        alert(`Cannot add. Only ${product.stock} items available in stock.`);
        return false;
      }
      saveCart([...cartItems, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: orderQty,
        stock: product.stock
      }]);
    }
    return true;
  };

  const removeFromCart = (productId) => {
    const filtered = cartItems.filter((item) => item.product_id !== productId);
    saveCart(filtered);
  };

  const updateQuantity = (productId, qty) => {
    const quantity = parseInt(qty);
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updated = cartItems.map((item) => {
      if (item.product_id === productId) {
        if (quantity > item.stock) {
          alert(`Cannot increase quantity. Only ${item.stock} items available in stock.`);
          return item;
        }
        return { ...item, quantity };
      }
      return item;
    });
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
