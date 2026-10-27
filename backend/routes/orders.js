const express = require('express');
const router = express.Router();
const db = require('../data/db');

// POST /api/orders/validate-cart - Pre-validate items stock and current prices
router.post('/validate-cart', (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    const products = db.getAllProducts();
    const validated = [];
    const errors = [];

    for (const item of items) {
      const prod = products.find(p => p.id === parseInt(item.id, 10));
      if (!prod) {
        errors.push(`Item ID ${item.id} is no longer available.`);
        continue;
      }
      if (prod.stock < item.quantity) {
        errors.push(`Only ${prod.stock} units left for "${prod.title}". Requested: ${item.quantity}.`);
      }
      validated.push({
        id: prod.id,
        title: prod.title,
        price: prod.price,
        stock: prod.stock,
        available: prod.stock >= item.quantity
      });
    }

    res.json({
      success: errors.length === 0,
      isValid: errors.length === 0,
      errors,
      items: validated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders - Process new checkout order
router.post('/', (req, res) => {
  try {
    const { customer, items, shippingMethod, paymentMethod, paymentDetails, couponCode } = req.body;

    // Basic Validation
    if (!customer || !customer.fullName || !customer.email || !customer.address || !customer.city || !customer.zip) {
      return res.status(400).json({
        success: false,
        message: 'All customer and shipping address fields are required.'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required to process checkout.'
      });
    }

    // Process order in database
    const createdOrder = db.createOrder({
      customer,
      items,
      shippingMethod: shippingMethod || 'standard',
      paymentMethod: paymentMethod || 'credit_card',
      paymentDetails,
      couponCode
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: createdOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error processing your order.'
    });
  }
});

// GET /api/orders/:id - Retrieve order for confirmation and tracking
router.get('/:id', (req, res) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `No order found with ID "${req.params.id}".`
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
