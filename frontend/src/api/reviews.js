
import api from './axios';

// ==================== FETCH CUSTOMER REVIEWS ====================
// Backend: GET /api/v1/reviews/my
// Returns reviews written by the currently logged-in customer.
export const getMyReviews = async () => {
  const response = await api.get('/reviews/my');
  return response.data;
};

// ==================== SUBMIT CUSTOMER REVIEW ====================
// Backend: POST /api/v1/reviews/orders/{order_id}
// Rating must be between 1 and 5.
// Comment is optional.
export const createReview = async (orderId, rating, comment) => {
  const response = await api.post(`/reviews/orders/${orderId}`, {
    rating,
    comment: comment.trim() || null,
  });

  return response.data;
};
