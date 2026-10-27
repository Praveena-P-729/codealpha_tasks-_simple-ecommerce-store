/**
 * Simple E-Commerce Store - Shopping Cart & Drawer Manager
 */

class CartManager {
  constructor() {
    this.storageKey = 'simple_ecommerce_cart';
    this.couponKey = 'simple_ecommerce_coupon';
    this.freeShippingThreshold = 50.00;
    this.taxRate = 0.08;
    this.items = this.loadCart();
    this.coupon = this.loadCoupon();

    this.initElements();
    this.bindEvents();
    this.render();
  }

  loadCart() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }

  loadCoupon() {
    try {
      const data = localStorage.getItem(this.couponKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveCoupon(coupon) {
    this.coupon = coupon;
    if (coupon) {
      localStorage.setItem(this.couponKey, JSON.stringify(coupon));
    } else {
      localStorage.removeItem(this.couponKey);
    }
  }

  initElements() {
    this.cartDrawer = document.getElementById('cartDrawer');
    this.cartOverlay = document.getElementById('cartOverlay');
    this.cartToggleButtons = document.querySelectorAll('.cart-toggle-btn');
    this.cartCloseBtn = document.getElementById('cartCloseBtn');
    this.cartBadgeElements = document.querySelectorAll('.cart-badge');
    this.cartItemsContainer = document.getElementById('cartItemsContainer');
    this.cartSubtotalEl = document.getElementById('cartSubtotal');
    this.cartDiscountRow = document.getElementById('cartDiscountRow');
    this.cartDiscountEl = document.getElementById('cartDiscount');
    this.cartShippingEl = document.getElementById('cartShipping');
    this.cartTaxEl = document.getElementById('cartTax');
    this.cartTotalEl = document.getElementById('cartTotal');
    this.freeShippingBar = document.getElementById('freeShippingBar');
    this.freeShippingText = document.getElementById('freeShippingText');
    this.couponInput = document.getElementById('cartCouponInput');
    this.couponBtn = document.getElementById('applyCouponBtn');
    this.checkoutBtn = document.getElementById('cartCheckoutBtn');
  }

  bindEvents() {
    // Open cart drawer
    this.cartToggleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });

    // Close cart drawer
    if (this.cartCloseBtn) {
      this.cartCloseBtn.addEventListener('click', () => this.closeDrawer());
    }

    if (this.cartOverlay) {
      this.cartOverlay.addEventListener('click', () => this.closeDrawer());
    }

    // Apply Coupon
    if (this.couponBtn) {
      this.couponBtn.addEventListener('click', () => {
        const code = this.couponInput ? this.couponInput.value.trim().toUpperCase() : '';
        this.applyCoupon(code);
      });
    }

    // Enter key in coupon input
    if (this.couponInput) {
      this.couponInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.applyCoupon(this.couponInput.value.trim().toUpperCase());
        }
      });
    }

    // Proceed to Checkout button
    if (this.checkoutBtn) {
      this.checkoutBtn.addEventListener('click', (e) => {
        if (this.items.length === 0) {
          e.preventDefault();
          showToast('Your shopping cart is empty!', 'info');
        } else {
          window.location.href = 'checkout.html';
        }
      });
    }
  }

  openDrawer() {
    if (this.cartDrawer && this.cartOverlay) {
      this.cartDrawer.classList.add('active');
      this.cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeDrawer() {
    if (this.cartDrawer && this.cartOverlay) {
      this.cartDrawer.classList.remove('active');
      this.cartOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  addItem(product, quantity = 1) {
    const existing = this.items.find(item => item.id === product.id);
    const maxStock = product.stock || 99;

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > maxStock) {
        showToast(`Cannot add more. Maximum available stock is ${maxStock}.`, 'error');
        return false;
      }
      existing.quantity = newQty;
    } else {
      if (quantity > maxStock) {
        showToast(`Cannot add ${quantity}. Only ${maxStock} items available.`, 'error');
        return false;
      }
      this.items.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: maxStock,
        quantity: quantity
      });
    }

    this.saveCart();
    this.render();
    showToast(`Added "${product.title}" to cart!`, 'success');
    return true;
  }

  updateQuantity(productId, newQty) {
    const item = this.items.find(i => i.id === productId);
    if (!item) return;

    if (newQty <= 0) {
      this.removeItem(productId);
      return;
    }

    if (item.stock && newQty > item.stock) {
      showToast(`Cannot increase. Only ${item.stock} in stock.`, 'error');
      return;
    }

    item.quantity = newQty;
    this.saveCart();
    this.render();
  }

  removeItem(productId) {
    const item = this.items.find(i => i.id === productId);
    const title = item ? item.title : 'Item';
    this.items = this.items.filter(i => i.id !== productId);
    this.saveCart();
    this.render();
    showToast(`Removed "${title}" from cart`, 'info');
  }

  clearCart() {
    this.items = [];
    this.coupon = null;
    this.saveCart();
    this.saveCoupon(null);
    this.render();
  }

  applyCoupon(code) {
    if (!code) {
      showToast('Please enter a promo code', 'error');
      return;
    }

    const validCoupons = {
      'SAVE10': { code: 'SAVE10', discountPercent: 10, label: '10% OFF' },
      'DISCOUNT20': { code: 'DISCOUNT20', discountPercent: 20, label: '20% OFF' },
      'FREESHIP': { code: 'FREESHIP', freeShipping: true, label: 'Free Shipping' }
    };

    if (validCoupons[code]) {
      this.saveCoupon(validCoupons[code]);
      this.render();
      showToast(`Coupon "${code}" applied: ${validCoupons[code].label}!`, 'success');
    } else {
      showToast('Invalid coupon code. Try SAVE10 or DISCOUNT20', 'error');
    }
  }

  removeCoupon() {
    this.saveCoupon(null);
    this.render();
    showToast('Coupon removed', 'info');
  }

  getTotals(shippingMethod = 'standard') {
    const subtotal = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    let discount = 0;
    let isFreeShipping = subtotal >= this.freeShippingThreshold;

    if (this.coupon) {
      if (this.coupon.discountPercent) {
        discount = subtotal * (this.coupon.discountPercent / 100);
      }
      if (this.coupon.freeShipping) {
        isFreeShipping = true;
      }
    }

    let shipping = 0;
    if (shippingMethod === 'express') {
      shipping = 14.99;
    } else {
      shipping = (isFreeShipping || subtotal === 0) ? 0 : 5.99;
    }

    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxableAmount * this.taxRate;
    const total = taxableAmount + shipping + tax;

    const itemCount = this.items.reduce((acc, item) => acc + item.quantity, 0);

    return {
      subtotal: +subtotal.toFixed(2),
      discount: +discount.toFixed(2),
      shipping: +shipping.toFixed(2),
      tax: +tax.toFixed(2),
      total: +total.toFixed(2),
      itemCount,
      isFreeShipping,
      remainingForFreeShipping: Math.max(0, +(this.freeShippingThreshold - subtotal).toFixed(2))
    };
  }

  render() {
    const totals = this.getTotals();

    // Update Badges
    this.cartBadgeElements.forEach(el => {
      el.textContent = totals.itemCount;
      el.style.display = totals.itemCount > 0 ? 'inline-flex' : 'none';
    });

    // Update Drawer Elements if available
    if (this.cartItemsContainer) {
      if (this.items.length === 0) {
        this.cartItemsContainer.innerHTML = `
          <div class="empty-state" style="padding: 2.5rem 0;">
            <div class="empty-state-icon">🛒</div>
            <h3 class="empty-state-title" style="font-size: 1.15rem;">Your Cart is Empty</h3>
            <p class="empty-state-text" style="font-size: 0.85rem; margin-bottom: 1rem;">Explore our catalog and find something you love!</p>
            <button class="btn btn-primary" onclick="cartManager.closeDrawer()">Start Shopping</button>
          </div>
        `;
      } else {
        this.cartItemsContainer.innerHTML = this.items.map(item => `
          <div class="cart-item" data-id="${item.id}">
            <img class="cart-item-img" src="${item.image}" alt="${item.title}" onerror="this.onerror=null;this.src='images/placeholder.svg';">
            <div class="cart-item-details">
              <a href="product.html?id=${item.id}" class="cart-item-title">${item.title}</a>
              <div class="cart-item-price">$${item.price.toFixed(2)}</div>
              <div class="cart-item-controls">
                <div class="qty-stepper">
                  <button type="button" class="qty-btn" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                  <span class="qty-val">${item.quantity}</span>
                  <button type="button" class="qty-btn" onclick="cartManager.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <button type="button" class="btn-remove-item" onclick="cartManager.removeItem(${item.id})" title="Remove">
                  🗑️ <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Update Subtotal and Summary
    if (this.cartSubtotalEl) this.cartSubtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
    if (this.cartShippingEl) this.cartShippingEl.textContent = totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`;
    if (this.cartTaxEl) this.cartTaxEl.textContent = `$${totals.tax.toFixed(2)}`;
    if (this.cartTotalEl) this.cartTotalEl.textContent = `$${totals.total.toFixed(2)}`;

    // Update Coupon UI
    if (this.cartDiscountRow && this.cartDiscountEl) {
      if (totals.discount > 0) {
        this.cartDiscountRow.style.display = 'flex';
        this.cartDiscountEl.innerHTML = `-$${totals.discount.toFixed(2)} <button onclick="cartManager.removeCoupon()" style="color:var(--danger); margin-left:4px; font-size:0.75rem;">(✕)</button>`;
      } else {
        this.cartDiscountRow.style.display = 'none';
      }
    }

    // Free Shipping Progress
    if (this.freeShippingBar && this.freeShippingText) {
      if (totals.subtotal === 0) {
        this.freeShippingBar.style.width = '0%';
        this.freeShippingText.textContent = `Add $${this.freeShippingThreshold.toFixed(2)} for FREE standard delivery!`;
      } else if (totals.isFreeShipping) {
        this.freeShippingBar.style.width = '100%';
        this.freeShippingText.innerHTML = `🎉 <strong>Congratulations!</strong> You qualify for <strong>FREE Delivery</strong>.`;
      } else {
        const percent = Math.min(100, (totals.subtotal / this.freeShippingThreshold) * 100);
        this.freeShippingBar.style.width = `${percent}%`;
        this.freeShippingText.innerHTML = `Add <strong>$${totals.remainingForFreeShipping.toFixed(2)}</strong> more to get <strong>FREE Delivery</strong>!`;
      }
    }
  }
}

// Global Toast Notification Helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${icons[type] || '✨'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Initialize Global Cart Manager
document.addEventListener('DOMContentLoaded', () => {
  window.cartManager = new CartManager();
});
