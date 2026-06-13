import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';

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

  const addToCart = (product, qty = 1, selectedPackage = null, selectedDevice = null, selectedActivation = null) => {
    const orderQty = parseInt(qty);
    
    // Resolve values
    const packageName = selectedPackage ? selectedPackage.duration : '';
    const selectedDeviceVal = selectedDevice || '';
    const selectedActivationVal = selectedActivation || '';
    const priceToUse = selectedPackage ? parseFloat(selectedPackage.price) : parseFloat(product.price);
    
    // Create a unique cart key for this combination
    const cartKey = `${product.id}_${packageName}_${selectedDeviceVal}_${selectedActivationVal}`;

    const existingIndex = cartItems.findIndex((item) => item.cart_key === cartKey);

    if (existingIndex > -1) {
      const updated = [...cartItems];
      const newQty = updated[existingIndex].quantity + orderQty;
      
      // Enforce product stock limit
      if (newQty > product.stock) {
        toast.error(`Cannot add more. Only ${product.stock} items available in stock.`);
        return false;
      }
      
      updated[existingIndex].quantity = newQty;
      saveCart(updated);
    } else {
      if (orderQty > product.stock) {
        toast.error(`Cannot add. Only ${product.stock} items available in stock.`);
        return false;
      }
      saveCart([...cartItems, {
        cart_key: cartKey,
        product_id: product.id,
        name: product.name,
        package_name: packageName || null,
        selected_device: selectedDeviceVal || null,
        selected_activation: selectedActivationVal || null,
        price: priceToUse,
        image_url: product.image_url,
        quantity: orderQty,
        stock: product.stock
      }]);
    }
    return true;
  };

  const removeFromCart = (cartKey) => {
    const filtered = cartItems.filter((item) => item.cart_key !== cartKey);
    saveCart(filtered);
  };

  const updateQuantity = (cartKey, qty) => {
    const quantity = parseInt(qty);
    if (quantity <= 0) {
      removeFromCart(cartKey);
      return;
    }

    const updated = cartItems.map((item) => {
      if (item.cart_key === cartKey) {
        if (quantity > item.stock) {
          toast.error(`Cannot increase quantity. Only ${item.stock} items available in stock.`);
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
