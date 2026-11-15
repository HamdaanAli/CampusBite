import api from './axios';

// Get only deliveries assigned to the currently logged-in delivery partner.
// Backend: GET /api/v1/orders/delivery
export const getMyDeliveries = async () => {
  const response = await api.get('/orders/delivery');
  return response.data;
};

// Update an assigned delivery through the permitted backend lifecycle.
// ASSIGNED -> OUT_FOR_DELIVERY -> DELIVERED
// Backend: PATCH /api/v1/orders/{order_id}/delivery-status
export const updateDeliveryStatus = async (orderId, status) => {
  const response = await api.patch(`/orders/${orderId}/delivery-status`, {
    status,
  });
  return response.data;
};
