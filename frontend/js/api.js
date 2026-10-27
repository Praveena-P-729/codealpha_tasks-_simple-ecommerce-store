/**
 * Simple E-Commerce Store - Centralized API Service
 */

// If frontend is served directly by express on localhost:5000, base is '',
// otherwise fallback to http://localhost:5000 if opened from Live Server or file://
const API_BASE = (window.location.origin && window.location.origin.includes(':5000'))
  ? '' 
  : 'http://localhost:5000';

const api = {
  /**
   * Fetch all products with optional filters
   * @param {Object} query - { category, search, sort, featured }
   */
  async getProducts(query = {}) {
    const params = new URLSearchParams();
    if (query.category && query.category !== 'all') params.append('category', query.category);
    if (query.search) params.append('search', query.search);
    if (query.sort) params.append('sort', query.sort);
    if (query.featured) params.append('featured', query.featured);

    const url = `${API_BASE}/api/products${params.toString() ? '?' + params.toString() : ''}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API getProducts error, checking mock fallback:', err.message);
      throw err;
    }
  },

  /**
   * Fetch single product details by ID
   * @param {number|string} id
   */
  async getProduct(id) {
    const url = `${API_BASE}/api/products/${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Product not found (status: ${res.status})`);
    return await res.json();
  },

  /**
   * Fetch related products for product page
   * @param {number|string} id
   */
  async getRelatedProducts(id) {
    const url = `${API_BASE}/api/products/${id}/related`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch related products`);
    return await res.json();
  },

  /**
   * Fetch category list with counts
   */
  async getCategories() {
    const url = `${API_BASE}/api/products/categories`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch categories`);
    return await res.json();
  },

  /**
   * Validate cart items with server
   * @param {Array} items
   */
  async validateCart(items) {
    const url = `${API_BASE}/api/orders/validate-cart`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    return await res.json();
  },

  /**
   * Submit an order
   * @param {Object} orderData
   */
  async createOrder(orderData) {
    const url = `${API_BASE}/api/orders`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to place order');
    }
    return data;
  },

  /**
   * Track order by Order ID
   * @param {string} orderId
   */
  async getOrder(orderId) {
    const url = `${API_BASE}/api/orders/${encodeURIComponent(orderId)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Order not found');
    }
    return data;
  },

  /**
   * User login
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const url = `${API_BASE}/api/auth/login`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    return data;
  },

  /**
   * User registration
   * @param {Object} userData
   */
  async register(userData) {
    const url = `${API_BASE}/api/auth/register`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    return data;
  },

  /**
   * Get demo credentials
   */
  async getDemoCredentials() {
    const url = `${API_BASE}/api/auth/demo`;
    const res = await fetch(url);
    return await res.json();
  }
};

window.api = api;
