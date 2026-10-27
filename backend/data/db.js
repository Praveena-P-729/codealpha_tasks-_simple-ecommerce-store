const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper to safely read JSON files
function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

// Helper to safely write JSON files atomically
function writeJSON(filePath, data) {
  try {
    const tempFile = `${filePath}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, filePath);
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
  }
}

// Products operations
const db = {
  getAllProducts: () => {
    return readJSON(PRODUCTS_FILE);
  },

  getProductById: (id) => {
    const products = readJSON(PRODUCTS_FILE);
    return products.find(p => p.id === parseInt(id, 10));
  },

  getCategories: () => {
    const products = readJSON(PRODUCTS_FILE);
    const categoryMap = {};
    products.forEach(p => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });
    return Object.keys(categoryMap).map(name => ({
      name,
      count: categoryMap[name]
    }));
  },

  updateProductStock: (id, quantityDeduction) => {
    const products = readJSON(PRODUCTS_FILE);
    const product = products.find(p => p.id === parseInt(id, 10));
    if (!product) return false;

    if (product.stock < quantityDeduction) {
      return false; // Insufficient stock
    }

    product.stock -= quantityDeduction;
    writeJSON(PRODUCTS_FILE, products);
    return true;
  },

  // Orders operations
  getAllOrders: () => {
    return readJSON(ORDERS_FILE);
  },

  getOrderById: (orderId) => {
    const orders = readJSON(ORDERS_FILE);
    const normalized = String(orderId).trim().toUpperCase();
    return orders.find(o => o.id.toUpperCase() === normalized);
  },

  createOrder: (orderPayload) => {
    const orders = readJSON(ORDERS_FILE);
    const products = readJSON(PRODUCTS_FILE);

    // Verify stock and calculate exact server-side pricing
    let subtotal = 0;
    const validatedItems = [];

    for (const item of orderPayload.items) {
      const prod = products.find(p => p.id === parseInt(item.id, 10));
      if (!prod) {
        throw new Error(`Product with ID ${item.id} not found.`);
      }
      if (prod.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${prod.title}". Only ${prod.stock} available.`);
      }

      subtotal += prod.price * item.quantity;
      validatedItems.push({
        id: prod.id,
        title: prod.title,
        price: prod.price,
        quantity: item.quantity,
        image: prod.image,
        category: prod.category
      });
    }

    // Coupon discount logic
    let discount = 0;
    const couponCode = (orderPayload.couponCode || '').trim().toUpperCase();
    if (couponCode === 'SAVE10') {
      discount = subtotal * 0.10; // 10% off
    } else if (couponCode === 'DISCOUNT20') {
      discount = subtotal * 0.20; // 20% off
    } else if (couponCode === 'FREESHIP') {
      discount = 0; // handled in shipping
    }

    // Shipping logic (Free if subtotal >= 50 or coupon FREESHIP or pickup)
    let shipping = 0;
    if (orderPayload.shippingMethod === 'express') {
      shipping = 14.99;
    } else {
      shipping = (subtotal >= 50 || couponCode === 'FREESHIP') ? 0 : 5.99;
    }

    // Tax calculation (8%)
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = +(taxableAmount * 0.08).toFixed(2);
    const total = +(taxableAmount + shipping + tax).toFixed(2);

    // Deduct stock for all items
    for (const item of orderPayload.items) {
      const prod = products.find(p => p.id === parseInt(item.id, 10));
      prod.stock -= item.quantity;
    }
    writeJSON(PRODUCTS_FILE, products);

    // Generate unique order ID
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-${new Date().getFullYear()}-${randomHex}`;

    const newOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      customer: orderPayload.customer,
      items: validatedItems,
      pricing: {
        subtotal: +subtotal.toFixed(2),
        discount: +discount.toFixed(2),
        shipping: +shipping.toFixed(2),
        tax: tax,
        total: total,
        couponApplied: couponCode || null
      },
      payment: {
        method: orderPayload.paymentMethod || 'card',
        cardLast4: orderPayload.paymentDetails?.cardLast4 || '8888',
        status: 'Paid'
      },
      shippingMethod: orderPayload.shippingMethod || 'standard',
      status: 'Processing',
      tracking: {
        carrier: 'Standard Ground Express',
        trackingNumber: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    };

    orders.unshift(newOrder);
    writeJSON(ORDERS_FILE, orders);

    return newOrder;
  },

  // Users operations
  getUserByEmail: (email) => {
    const users = readJSON(USERS_FILE);
    const normalized = (email || '').trim().toLowerCase();
    return users.find(u => u.email.toLowerCase() === normalized);
  },

  getUserById: (id) => {
    const users = readJSON(USERS_FILE);
    return users.find(u => u.id === parseInt(id, 10));
  },

  createUser: (userData) => {
    const users = readJSON(USERS_FILE);
    const normalizedEmail = (userData.email || '').trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email address already exists.');
    }

    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      name: userData.name.trim(),
      email: normalizedEmail,
      password: userData.password, // In demo/simple store, stored as plaintext or simple hash
      phone: userData.phone || '',
      address: userData.address || '',
      city: userData.city || '',
      state: userData.state || '',
      zip: userData.zip || '',
      country: userData.country || 'United States',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    // Return safe user without password
    const { password, ...safeUser } = newUser;
    return safeUser;
  }
};

module.exports = db;
