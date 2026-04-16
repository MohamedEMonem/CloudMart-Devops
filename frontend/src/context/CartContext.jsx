import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/axios";

// CartContext shares cart state and actions across the entire component tree
// without prop-drilling through every component
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add a product to the cart via the backend API
  const addToCart = useCallback(async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const { data } = await api.post("/cart", { productId, quantity });
      setCart(data.cart);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove an item from the cart
  const removeFromCart = useCallback(async (productId) => {
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      setCart(data.cart);
    } catch (err) {
      console.error("Failed to remove from cart:", err);
    }
  }, []);

  // Change the quantity of an existing cart item
  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const { data } = await api.put(`/cart/${productId}`, { quantity });
      setCart(data.cart);
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  }, []);

  // Derived values — calculated from the cart array
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    .toFixed(2);

  return (
    <CartContext.Provider
      value={{ cart, loading, addToCart, removeFromCart, updateQuantity, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook — components call useCart() instead of importing CartContext directly
export function useCart() {
  return useContext(CartContext);
}
