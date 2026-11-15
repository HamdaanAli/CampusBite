
import api from './axios';

// ==================== GET RESTAURANTS OWNED BY CURRENT OWNER ====================
// Backend: GET /api/v1/restaurants/my
export const getMyRestaurants = async () => {
  const response = await api.get('/restaurants/my');
  return response.data;
};

// ==================== UPDATE RESTAURANT DETAILS ====================
// Backend: PUT /api/v1/restaurants/{restaurant_id}
export const updateRestaurant = async (restaurantId, restaurantData) => {
  const response = await api.put(
    `/restaurants/${restaurantId}`,
    restaurantData
  );
  return response.data;
};

// ==================== CREATE A NEW RESTAURANT ====================
// Backend: POST /api/v1/restaurants/
export const createRestaurant = async (restaurantData) => {
  const response = await api.post('/restaurants/', restaurantData);
  return response.data;
};
