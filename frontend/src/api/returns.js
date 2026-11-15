
import api from './axios';

// ==================== FETCH CUSTOMER REFUND REQUESTS ====================
// Backend: GET /api/v1/returns/my
export const getMyReturnRequests = async () => {
  const response = await api.get('/returns/my');
  return response.data;
};

// ==================== SUBMIT A REFUND REQUEST ====================
// Backend: POST /api/v1/returns/orders/{order_id}
export const createReturnRequest = async (orderId, reason) => {
  const response = await api.post(`/returns/orders/${orderId}`, {
    reason,
  });

  return response.data;
};