
import api from './axios';

// Register a new user.
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Log in and receive the JWT.
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);

  const { access_token } = response.data;

  localStorage.setItem('campusbite_token', access_token);

  return response.data;
};

// Retrieve the currently authenticated user's profile.
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Log out the current user.
export const logoutUser = () => {
  localStorage.removeItem('campusbite_token');
};
