/**
 * Simple E-Commerce Store - Product Details Page Controller
 */

class ProductPage {
  constructor() {
    this.productId = this.getProductIdFromUrl();
    this.product = null;
    this.quantity = 1;

    this.container = document.getElementById('productContainer');
    this.relatedGrid = document.getElementById('relatedProductsGrid');
    this.breadcrumbCategory = document.getElementById('breadcrumbCategory');
    this.breadcrumbTitle = document.getElementById('breadcrumbTitle');
    this.headerProductTitle = document.getElementById('headerProductTitle');

    this.init();
  }

  getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async init() {
    if (!this.productId) {
      this.renderNotFound('No product ID was specified in the URL.');
      return;
    }

    try {
      const response = await api.getProduct(this.productId);
      if (!response || !response.success || !response.data) {
        throw new Error('Product not found');
      }

      this.product = response.data;
      document.title = `${this.product.title} | Aura Store`;

      if (this.headerProductTitle) this.headerProductTitle.textContent = this.product.title;
      if (this.breadcrumbCategory) this.breadcrumbCategory.textContent = this.product.category;
      if (this.breadcrumbTitle) this.breadcrumbTitle.textContent = this.product.title;

      this.render();
      this.loadRelatedProducts();
    } catch (err) {
      console.error('Error fetching product:', err);
      this.renderNotFound(err.message);
    }
  }

  renderNotFound(msg) {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="empty-state" style="padding: 5rem 1rem;">
        <div class="empty-state-icon">🔍</div>
        <h2 class="empty-state-title">Product Not Found</h2>
        <p class="empty-state-text">${msg || 'The requested product could not be found or is unavailable.'}</p>
        <a href="index.html" class="btn btn-primary">Return to Catalog</a>
      </div>
    `;
  }

  render() {
    if (!this.container || !this.product) return;
    const p = this.product;
    const gallery = p.gallery && p.gallery.length ? p.gallery : [p.image];
    const stars = '★'.repeat(Math.floor(p.rating)) + '☆'.repeat(5 - Math.floor(p.rating));

    let stockBadgeClass = 'in-stock';
    let stockText = `In Stock (${p.stock} units available)`;
    if (p.stock <= 0) {
      stockBadgeClass = 'out-of-stock';
      stockText = 'Out of Stock';
    } else if (p.stock < 5) {
      stockBadgeClass = 'low-stock';
      stockText = `Low Stock (${p.stock} units left)`;
    }

    const specs = p.specifications || {};
    const specRows = Object.keys(specs).map(key => `
      <tr>
        <td>${key}</td>
        <td>${specs[key]}</td>
      </tr>
    `).join('');

    this.container.innerHTML = `
      <div class="product-detail-layout" style="background: #ffffff; border-radius: 16px; border: 1px solid var(--border); box-shadow: var(--shadow-sm);">
        <!-- Gallery Column -->
        <div class="detail-gallery">
          <img id="mainDetailImg" class="detail-main-img" src="${gallery[0]}" alt="${p.title}" onerror="this.onerror=null;this.src='images/placeholder.svg';">
          <div class="detail-thumbs">
            ${gallery.map((imgUrl, i) => `
              <img class="thumb-img ${i === 0 ? 'active' : ''}" src="${imgUrl}" alt="Gallery ${i + 1}" onclick="productPage.switchImage('${imgUrl}', this)" onerror="this.onerror=null;this.src='images/placeholder.svg';">
            `).join('')}
          </div>

          <div style="margin-top: 1.5rem; background: #f8fafc; border-radius: 10px; padding: 1rem; border: 1px solid var(--border);">
            <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--dark);">Guaranteed Safe & Secure Checkout</div>
            <div style="display: flex; gap: 0.5rem; font-size: 1.3rem;">
              <span>💳</span> <span>🔒</span> <span>⚡</span> <span>📦</span>
            </div>
          </div>
        </div>

        <!-- Info Column -->
        <div class="detail-info">
          <span class="detail-category">${p.category}</span>
          <h1 class="detail-title" style="font-size: 1.95rem;">${p.title}</h1>

          <div class="card-rating" style="margin-bottom: 0.85rem;">
            <span class="stars">${stars}</span>
            <span class="rating-count" style="font-size: 0.88rem; font-weight: 600;">
              ${p.rating} / 5.0 (${p.reviewCount || 120} customer reviews)
            </span>
          </div>

          <div class="detail-stock-badge ${stockBadgeClass}">
            <span>●</span>
            <span>${stockText}</span>
          </div>

          <div class="detail-price-box">
            <span class="detail-price">$${p.price.toFixed(2)}</span>
            ${p.originalPrice ? `<span class="original-price" style="font-size: 1.25rem;">$${p.originalPrice.toFixed(2)}</span>` : ''}
            ${p.discountPercentage ? `<span class="discount-pill" style="font-size: 0.85rem; padding: 0.25rem 0.65rem;">Save ${p.discountPercentage}%</span>` : ''}
          </div>

          <p class="detail-description">${p.description}</p>

          ${p.features && p.features.length ? `
            <div class="detail-features">
              <h4 class="detail-features-title">Key Highlights:</h4>
              <ul class="detail-feature-list">
                ${p.features.map(f => `<li class="detail-feature-item">${f}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Quantity & Purchase Actions -->
          <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;">
              <div class="detail-qty-picker">
                <button type="button" onclick="productPage.decrementQty()">-</button>
                <input type="text" id="productQtyInput" value="1" readonly>
                <button type="button" onclick="productPage.incrementQty(${p.stock})">+</button>
              </div>

              <button type="button" class="btn btn-primary btn-lg" style="flex: 1;" onclick="productPage.addToCart()" ${p.stock <= 0 ? 'disabled' : ''}>
                <span>🛒</span>
                <span>Add to Cart</span>
              </button>

              <button type="button" class="btn btn-secondary btn-lg" style="background-color: #0f172a; color: #fff;" onclick="productPage.buyNow()" ${p.stock <= 0 ? 'disabled' : ''}>
                ⚡ Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Specifications Section -->
      <div class="reviews-card">
        <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--dark); margin-bottom: 1rem;">Technical Specifications</h3>
        <table class="specs-table">
          <tbody>
            ${specRows}
          </tbody>
        </table>
      </div>

      <!-- Customer Reviews Breakdown -->
      <div class="reviews-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
          <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--dark);">Verified Customer Reviews</h3>
          <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">Overall Rating: ${p.rating} out of 5</span>
        </div>

        <div class="review-item">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
            <div>
              <strong style="color: var(--dark);">Marcus Vance</strong>
              <span style="color: var(--success); font-size: 0.75rem; margin-left: 0.5rem; font-weight: 700;">✓ Verified Buyer</span>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-subtle);">3 days ago</span>
          </div>
          <div style="color: var(--accent); margin-bottom: 0.4rem;">★★★★★</div>
          <p style="font-size: 0.92rem; color: var(--text-main); line-height: 1.5;">
            Exceptional build quality and finish. Arrived in just two days in protective packaging. Performs even better than described!
          </p>
        </div>

        <div class="review-item">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
            <div>
              <strong style="color: var(--dark);">Elena Rostova</strong>
              <span style="color: var(--success); font-size: 0.75rem; margin-left: 0.5rem; font-weight: 700;">✓ Verified Buyer</span>
            </div>
            <span style="font-size: 0.8rem; color: var(--text-subtle);">1 week ago</span>
          </div>
          <div style="color: var(--accent); margin-bottom: 0.4rem;">★★★★★</div>
          <p style="font-size: 0.92rem; color: var(--text-main); line-height: 1.5;">
            Worth every penny. The attention to detail and materials used are top notch. Highly recommended.
          </p>
        </div>
      </div>
    `;
  }

  switchImage(url, thumbEl) {
    const mainImg = document.getElementById('mainDetailImg');
    if (mainImg) mainImg.src = url;

    const allThumbs = this.container.querySelectorAll('.thumb-img');
    allThumbs.forEach(t => t.classList.remove('active'));
    if (thumbEl) thumbEl.classList.add('active');
  }

  incrementQty(maxStock = 99) {
    const input = document.getElementById('productQtyInput');
    if (input) {
      let val = parseInt(input.value, 10) || 1;
      if (val < maxStock) {
        input.value = val + 1;
        this.quantity = val + 1;
      } else {
        showToast(`Stock limit reached (${maxStock})`, 'info');
      }
    }
  }

  decrementQty() {
    const input = document.getElementById('productQtyInput');
    if (input) {
      let val = parseInt(input.value, 10) || 1;
      if (val > 1) {
        input.value = val - 1;
        this.quantity = val - 1;
      }
    }
  }

  addToCart() {
    if (!this.product) return;
    if (window.cartManager) {
      window.cartManager.addItem(this.product, this.quantity);
      window.cartManager.openDrawer();
    }
  }

  buyNow() {
    if (!this.product) return;
    if (window.cartManager) {
      window.cartManager.addItem(this.product, this.quantity);
      window.location.href = 'checkout.html';
    }
  }

  async loadRelatedProducts() {
    if (!this.relatedGrid || !this.productId) return;

    try {
      const response = await api.getRelatedProducts(this.productId);
      if (response && response.success && response.data.length > 0) {
        this.relatedGrid.innerHTML = response.data.map(product => {
          const stars = '★'.repeat(Math.floor(product.rating)) + '☆'.repeat(5 - Math.floor(product.rating));
          return `
            <article class="product-card" data-id="${product.id}">
              <div class="card-media">
                <a href="product.html?id=${product.id}">
                  <img class="card-img" src="${product.image}" alt="${product.title}" onerror="this.onerror=null;this.src='images/placeholder.svg';">
                </a>
              </div>
              <div class="card-body">
                <span class="card-category">${product.category}</span>
                <h3 class="card-title">
                  <a href="product.html?id=${product.id}">${product.title}</a>
                </h3>
                <div class="card-rating">
                  <span class="stars">${stars}</span>
                  <span class="rating-count">(${product.rating})</span>
                </div>
                <div class="card-price-row">
                  <span class="price">$${product.price.toFixed(2)}</span>
                </div>
                <div class="card-actions">
                  <a href="product.html?id=${product.id}" class="btn btn-primary btn-block" style="padding: 0.55rem; font-size: 0.85rem;">
                    View Product
                  </a>
                </div>
              </div>
            </article>
          `;
        }).join('');
      } else {
        this.relatedGrid.parentElement.style.display = 'none';
      }
    } catch (err) {
      console.warn('Could not load related products:', err);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.productPage = new ProductPage();
});
