import api from './axios';

// Publicly available active restaurants for the customer homepage.
export const getRestaurants = async () => {
  const response = await api.get('/restaurants/');
  return response.data;
};

// Available menu items for a selected restaurant.
export const getRestaurantMenu = async (restaurantId) => {
  const response = await api.get(`/restaurants/${restaurantId}/menu/`);
  return response.data;
};

// Place an order using the backend's dummy payment workflow.
export const placeRestaurantOrder = async (restaurantId, orderData) => {
  const response = await api.post(`/orders/restaurants/${restaurantId}`, orderData);
  return response.data;
};
