
import api from './axios';

// ==========================================
// CUSTOMER ORDER ENDPOINTS
// ==========================================

// Get orders placed by the logged-in customer.
export const getMyOrders = async () =>
  (await api.get('/orders/my')).data;

// Cancel an order. Backend allows cancellation only
// when the order status is PLACED.
export const cancelMyOrder = async (orderId) =>
  (await api.patch(`/orders/${orderId}/cancel`)).data;


// ==========================================
// OWNER MENU ENDPOINTS
// ==========================================

// Owner-only endpoints. Backend performs the authoritative ownership checks.
export const getOwnerMenuItems = async (restaurantId) =>
  (await api.get(`/restaurants/${restaurantId}/menu/owner`)).data;

export const createMenuItem = async (restaurantId, data) =>
  (await api.post(`/restaurants/${restaurantId}/menu/`, data)).data;

export const updateMenuItem = async (restaurantId, itemId, data) =>
  (await api.put(`/restaurants/${restaurantId}/menu/${itemId}`, data)).data;


// ==========================================
// OWNER ORDER ENDPOINTS
// ==========================================

export const getOwnerOrders = async (params = {}) =>
  (await api.get('/orders/owner', { params })).data;

export const updateOwnerOrderStatus = async (orderId, status) =>
  (await api.patch(`/orders/${orderId}/status`, { status })).data;

export const getDeliveryPartners = async () =>
  (await api.get('/orders/delivery-partners')).data;

export const assignDeliveryPartner = async (orderId, deliveryPartnerId) =>
  (await api.patch(`/orders/${orderId}/assign-delivery`, {
    delivery_partner_id: Number(deliveryPartnerId),
  })).data;


// ==========================================
// OWNER REFUND ENDPOINTS
// ==========================================

export const getOwnerRefunds = async () =>
  (await api.get('/returns/owner')).data;

export const reviewOwnerRefund = async (requestId, status, owner_response) =>
  (await api.patch(`/returns/${requestId}/review`, { status, owner_response })).data;


// ==========================================
// OWNER STATISTICS AND REMINDERS
// ==========================================

export const getOwnerStatistics = async () =>
  (await api.get('/statistics/owner')).data;

export const getOwnerReminders = async () =>
  (await api.get('/reminders/my')).data;
