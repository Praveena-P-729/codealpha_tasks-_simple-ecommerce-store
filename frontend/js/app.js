/**
 * Simple E-Commerce Store - Main Application Controller
 * Handles product catalog rendering, search, category filter, sorting & Quick View modal
 */

class StoreApp {
  constructor() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.sortBy = 'newest';
    this.products = [];
    this.debounceTimer = null;

    this.initElements();
    this.bindEvents();
    this.init();
  }

  initElements() {
    this.productsGrid = document.getElementById('productsGrid');
    this.categoryPills = document.getElementById('categoryPills');
    this.sortSelect = document.getElementById('sortSelect');
    this.searchInput = document.getElementById('searchInput');
    this.searchClear = document.getElementById('searchClear');
    this.emptyState = document.getElementById('emptyState');
    this.resetFiltersBtn = document.getElementById('resetFiltersBtn');
    this.catalogTitle = document.getElementById('catalogTitle');
    this.catalogResults = document.getElementById('catalogResults');

    // Quick View Modal
    this.quickViewModal = document.getElementById('quickViewModal');
    this.quickViewContent = document.getElementById('quickViewContent');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
  }

  bindEvents() {
    // Search input with debounce
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        clearTimeout(this.debounceTimer);
        const val = e.target.value.trim();
        if (this.searchClear) {
          this.searchClear.style.display = val ? 'block' : 'none';
        }
        this.debounceTimer = setTimeout(() => {
          this.searchQuery = val;
          this.fetchProducts();
        }, 280);
      });
    }

    // Clear search button
    if (this.searchClear) {
      this.searchClear.addEventListener('click', () => {
        if (this.searchInput) {
          this.searchInput.value = '';
          this.searchClear.style.display = 'none';
          this.searchQuery = '';
          this.fetchProducts();
        }
      });
    }

    // Sort select change
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.fetchProducts();
      });
    }

    // Reset filters button
    if (this.resetFiltersBtn) {
      this.resetFiltersBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }

    // Quick view modal close
    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeQuickView());
    }

    if (this.quickViewModal) {
      this.quickViewModal.addEventListener('click', (e) => {
        if (e.target === this.quickViewModal) {
          this.closeQuickView();
        }
      });
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.quickViewModal && this.quickViewModal.classList.contains('active')) {
        this.closeQuickView();
      }
    });
  }

  async init() {
    await this.fetchCategories();
    await this.fetchProducts();
  }

  async fetchCategories() {
    try {
      const response = await api.getCategories();
      if (response && response.success) {
        this.renderCategories(response.data);
      }
    } catch (err) {
      console.warn('Could not load categories:', err);
    }
  }

  renderCategories(categories) {
    if (!this.categoryPills) return;

    const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

    let pillsHtml = `
      <button class="category-pill ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all" onclick="app.setCategory('all')">
        All Products <span class="pill-count">${totalCount}</span>
      </button>
    `;

    categories.forEach(cat => {
      const isActive = this.currentCategory.toLowerCase() === cat.name.toLowerCase();
      pillsHtml += `
        <button class="category-pill ${isActive ? 'active' : ''}" data-category="${cat.name}" onclick="app.setCategory('${cat.name}')">
          ${cat.name} <span class="pill-count">${cat.count}</span>
        </button>
      `;
    });

    this.categoryPills.innerHTML = pillsHtml;
  }

  setCategory(category) {
    this.currentCategory = category;

    // Update active pill styling
    const pills = this.categoryPills.querySelectorAll('.category-pill');
    pills.forEach(pill => {
      if (pill.getAttribute('data-category').toLowerCase() === category.toLowerCase()) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    if (this.catalogTitle) {
      this.catalogTitle.textContent = category === 'all' ? 'Explore Catalog' : `${category} Collection`;
    }

    this.fetchProducts();
  }

  async fetchProducts() {
    if (this.catalogResults) {
      this.catalogResults.textContent = 'Searching items...';
    }

    try {
      const query = {
        category: this.currentCategory,
        search: this.searchQuery,
        sort: this.sortBy
      };

      const response = await api.getProducts(query);
      if (response && response.success) {
        this.products = response.data;
        this.renderProducts(this.products);
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      if (this.productsGrid) {
        this.productsGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #fff; border-radius: 12px; border: 1px solid #fee2e2;">
            <p style="color: #ef4444; font-weight: 600; margin-bottom: 0.5rem;">⚠️ Unable to reach backend server</p>
            <p style="color: #64748b; font-size: 0.9rem;">Make sure the Express backend is running on <code>http://localhost:5000</code>.</p>
          </div>
        `;
      }
    }
  }

  renderProducts(products) {
    if (!this.productsGrid) return;

    if (products.length === 0) {
      this.productsGrid.style.display = 'none';
      if (this.emptyState) this.emptyState.style.display = 'block';
      if (this.catalogResults) this.catalogResults.textContent = '0 items found';
      return;
    }

    this.productsGrid.style.display = 'grid';
    if (this.emptyState) this.emptyState.style.display = 'none';
    if (this.catalogResults) {
      this.catalogResults.textContent = `Showing ${products.length} product${products.length > 1 ? 's' : ''}`;
    }

    this.productsGrid.innerHTML = products.map(product => {
      const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
      const badgeHtml = product.badge ? `<span class="badge ${product.badge.toLowerCase().includes('sale') ? 'sale' : 'bestseller'}">${product.badge}</span>` : '';
      const originalPriceHtml = product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : '';
      const discountPillHtml = product.discountPercentage ? `<span class="discount-pill">-${product.discountPercentage}%</span>` : '';

      return `
        <article class="product-card" data-id="${product.id}">
          <div class="card-media">
            ${badgeHtml}
            <a href="product.html?id=${product.id}">
              <img class="card-img" src="${product.image}" alt="${product.title}" loading="lazy" onerror="this.onerror=null;this.src='images/placeholder.svg';">
            </a>
            <button type="button" class="card-quick-view" onclick="app.openQuickView(${product.id})">
              👁️ Quick View
            </button>
          </div>

          <div class="card-body">
            <span class="card-category">${product.category}</span>
            <h3 class="card-title">
              <a href="product.html?id=${product.id}" title="${product.title}">${product.title}</a>
            </h3>

            <div class="card-rating">
              <span class="stars">${stars}</span>
              <span class="rating-count">(${product.rating} · ${product.reviewCount || 42})</span>
            </div>

            <div class="card-price-row">
              <span class="price">$${product.price.toFixed(2)}</span>
              ${originalPriceHtml}
              ${discountPillHtml}
            </div>

            <div class="card-actions">
              <button type="button" class="btn-add-cart" onclick="app.addToCart(${product.id})">
                <span>🛒</span>
                <span>Add to Cart</span>
              </button>
              <a href="product.html?id=${product.id}" class="btn-view-details" title="View Full Details">
                ➔
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    if (window.cartManager) {
      window.cartManager.addItem(product, 1);
    }
  }

  async openQuickView(productId) {
    if (!this.quickViewModal || !this.quickViewContent) return;

    // Show loading skeleton inside modal
    this.quickViewContent.innerHTML = `
      <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
        <p>Loading product details...</p>
      </div>
    `;
    this.quickViewModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
      const response = await api.getProduct(productId);
      if (!response || !response.success) {
        throw new Error('Product not found');
      }

      const p = response.data;
      const gallery = p.gallery && p.gallery.length ? p.gallery : [p.image];
      const stars = '★'.repeat(Math.floor(p.rating)) + '☆'.repeat(5 - Math.floor(p.rating));

      let stockBadgeClass = 'in-stock';
      let stockText = `In Stock (${p.stock} available)`;
      if (p.stock <= 0) {
        stockBadgeClass = 'out-of-stock';
        stockText = 'Out of Stock';
      } else if (p.stock < 5) {
        stockBadgeClass = 'low-stock';
        stockText = `Low Stock (${p.stock} remaining)`;
      }

      this.quickViewContent.innerHTML = `
        <div class="product-detail-layout">
          <div class="detail-gallery">
            <img id="qvMainImg" class="detail-main-img" src="${gallery[0]}" alt="${p.title}">
            <div class="detail-thumbs">
              ${gallery.map((imgUrl, i) => `
                <img class="thumb-img ${i === 0 ? 'active' : ''}" src="${imgUrl}" alt="Thumbnail ${i + 1}" onclick="app.switchQuickViewImage('${imgUrl}', this)">
              `).join('')}
            </div>
          </div>

          <div class="detail-info">
            <span class="detail-category">${p.category}</span>
            <h2 class="detail-title">${p.title}</h2>

            <div class="card-rating" style="margin-bottom: 0.75rem;">
              <span class="stars">${stars}</span>
              <span class="rating-count">(${p.rating} / 5.0 from ${p.reviewCount || 100} verified buyers)</span>
            </div>

            <div class="detail-stock-badge ${stockBadgeClass}">
              <span>●</span>
              <span>${stockText}</span>
            </div>

            <div class="detail-price-box">
              <span class="detail-price">$${p.price.toFixed(2)}</span>
              ${p.originalPrice ? `<span class="original-price" style="font-size: 1.15rem;">$${p.originalPrice.toFixed(2)}</span>` : ''}
              ${p.discountPercentage ? `<span class="discount-pill">Save ${p.discountPercentage}%</span>` : ''}
            </div>

            <p class="detail-description">${p.description}</p>

            ${p.features && p.features.length ? `
              <div class="detail-features">
                <h4 class="detail-features-title">Highlights:</h4>
                <ul class="detail-feature-list">
                  ${p.features.slice(0, 3).map(f => `<li class="detail-feature-item">${f}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <div class="detail-actions">
              <div class="detail-qty-picker">
                <button type="button" onclick="app.decrementQvQty()">-</button>
                <input type="text" id="qvQtyInput" value="1" readonly>
                <button type="button" onclick="app.incrementQvQty(${p.stock})">+</button>
              </div>

              <button type="button" class="btn btn-primary btn-lg" style="flex: 1;" onclick="app.addQuickViewToCart(${p.id})">
                <span>🛒</span>
                <span>Add to Cart</span>
              </button>
            </div>

            <div style="margin-top: 1.5rem; text-align: center;">
              <a href="product.html?id=${p.id}" style="color: var(--primary); font-weight: 600; font-size: 0.9rem; text-decoration: underline;">
                View Full Product Specs & Reviews ➔
              </a>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      this.quickViewContent.innerHTML = `
        <div style="padding: 3rem; text-align: center; color: var(--danger);">
          <p>⚠️ Failed to load product details: ${err.message}</p>
        </div>
      `;
    }
  }

  switchQuickViewImage(imgUrl, thumbEl) {
    const mainImg = document.getElementById('qvMainImg');
    if (mainImg) mainImg.src = imgUrl;

    const allThumbs = this.quickViewContent.querySelectorAll('.thumb-img');
    allThumbs.forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  }

  incrementQvQty(maxStock = 99) {
    const input = document.getElementById('qvQtyInput');
    if (input) {
      let val = parseInt(input.value, 10) || 1;
      if (val < maxStock) {
        input.value = val + 1;
      } else {
        showToast(`Maximum stock reached (${maxStock})`, 'info');
      }
    }
  }

  decrementQvQty() {
    const input = document.getElementById('qvQtyInput');
    if (input) {
      let val = parseInt(input.value, 10) || 1;
      if (val > 1) {
        input.value = val - 1;
      }
    }
  }

  addQuickViewToCart(productId) {
    const input = document.getElementById('qvQtyInput');
    const qty = input ? parseInt(input.value, 10) || 1 : 1;
    const product = this.products.find(p => p.id === productId);

    if (product && window.cartManager) {
      window.cartManager.addItem(product, qty);
      this.closeQuickView();
    }
  }

  closeQuickView() {
    if (this.quickViewModal) {
      this.quickViewModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  resetFilters() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.sortBy = 'newest';

    if (this.searchInput) {
      this.searchInput.value = '';
    }
    if (this.searchClear) {
      this.searchClear.style.display = 'none';
    }
    if (this.sortSelect) {
      this.sortSelect.value = 'newest';
    }

    const pills = this.categoryPills.querySelectorAll('.category-pill');
    pills.forEach(pill => {
      if (pill.getAttribute('data-category') === 'all') {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    if (this.catalogTitle) {
      this.catalogTitle.textContent = 'Explore Catalog';
    }

    this.fetchProducts();
  }
}

// Instantiate Store App
document.addEventListener('DOMContentLoaded', () => {
  window.app = new StoreApp();
});
