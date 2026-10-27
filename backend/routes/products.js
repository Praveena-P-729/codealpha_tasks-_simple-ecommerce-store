const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET /api/categories - Get category list with counts
router.get('/categories', (req, res) => {
  try {
    const categories = db.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products - Get all products with search, filter, and sort
router.get('/', (req, res) => {
  try {
    let products = db.getAllProducts();
    const { category, search, sort, featured, minPrice, maxPrice } = req.query;

    // Filter by Category
    if (category && category.toLowerCase() !== 'all') {
      products = products.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by Featured
    if (featured === 'true') {
      products = products.filter(p => p.featured === true);
    }

    // Filter by Search keyword (matches title, description, or category)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      products = products.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    // Filter by Price range
    if (minPrice) {
      products = products.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      products = products.filter(p => p.price <= parseFloat(maxPrice));
    }

    // Sorting
    if (sort) {
      switch (sort) {
        case 'price-asc':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          products.sort((a, b) => b.rating - a.rating);
          break;
        case 'name-asc':
          products.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'newest':
        default:
          products.sort((a, b) => b.id - a.id);
          break;
      }
    }

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id/related - Get related products in the same category
router.get('/:id/related', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const allProducts = db.getAllProducts();
    const related = allProducts
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);

    res.json({ success: true, data: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id - Get single product details
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
