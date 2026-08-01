import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

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

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('cart', JSON.stringify(items));
  };

  const addToCart = (product, qty = 1, selectedPackage = null, selectedDevice = null, selectedActivation = null) => {
    const orderQty = parseInt(qty);
    
    const packageName = selectedPackage ? selectedPackage.duration : '';
    const selectedDeviceVal = selectedDevice || '';
    const selectedActivationVal = selectedActivation || '';
    const priceToUse = selectedPackage ? parseFloat(selectedPackage.price) : parseFloat(product.price);
    
    const activeStock = selectedPackage && selectedPackage.stock !== undefined && selectedPackage.stock !== null && selectedPackage.stock !== ''
      ? parseInt(selectedPackage.stock)
      : product.stock;

    const cartKey = `${product.id}_${packageName}_${selectedDeviceVal}_${selectedActivationVal}`;

    const existingIndex = cartItems.findIndex((item) => item.cart_key === cartKey);

    if (existingIndex > -1) {
      const updated = [...cartItems];
      const newQty = updated[existingIndex].quantity + orderQty;
      
      if (newQty > activeStock) {
        toast.error(`Cannot add more. Only ${activeStock} items available in stock.`);
        return false;
      }
      
      updated[existingIndex].quantity = newQty;
      saveCart(updated);
    } else {
      if (orderQty > activeStock) {
        toast.error(`Cannot add. Only ${activeStock} items available in stock.`);
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
        stock: activeStock
      }]);
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'ecommerce': null }); // Clear previous ecommerce object
    window.dataLayer.push({
      event: "add_to_cart",
      event_id: `add_to_cart_${product.id}_${Date.now()}`,
      ecommerce: {
        currency: "BDT",
        value: Number(priceToUse) * orderQty,
        items: [
          {
            item_id: String(product.id),
            item_name: product.name,
            price: Number(priceToUse),
            quantity: orderQty
          }
        ]
      }
    });

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
