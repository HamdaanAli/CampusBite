import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'campusbite_cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : { restaurant: null, items: [] };
    } catch {
      return { restaurant: null, items: [] };
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const addItem = (restaurant, menuItem) => {
    setCart((current) => {
      // A single order belongs to one restaurant. Start a fresh cart if the
      // customer switches restaurants, and explain this behavior in the UI.
      const sameRestaurant = current.restaurant?.id === restaurant.id;
      const currentItems = sameRestaurant ? current.items : [];
      const existing = currentItems.find((item) => item.id === menuItem.id);
      const items = existing
        ? currentItems.map((item) => item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 } : item)
        : [...currentItems, {
            id: menuItem.id,
            name: menuItem.name,
            price: Number(menuItem.price),
            image_url: menuItem.image_url,
            quantity: 1,
          }];
      return { restaurant, items };
    });
  };

  const changeQuantity = (itemId, quantity) => {
    setCart((current) => {
      const items = quantity <= 0
        ? current.items.filter((item) => item.id !== itemId)
        : current.items.map((item) => item.id === itemId ? { ...item, quantity } : item);
      return { restaurant: items.length ? current.restaurant : null, items };
    });
  };

  const removeItem = (itemId) => changeQuantity(itemId, 0);
  const clearCart = () => setCart({ restaurant: null, items: [] });

  const value = useMemo(() => ({
    cart, itemCount, total, addItem, changeQuantity, removeItem, clearCart,
  }), [cart, itemCount, total]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
};
