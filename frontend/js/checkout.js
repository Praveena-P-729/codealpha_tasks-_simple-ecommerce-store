/**
 * Simple E-Commerce Store - Checkout & Order Processing Controller
 */

class CheckoutPage {
  constructor() {
    this.shippingMethod = 'standard';
    this.paymentType = 'card';
    this.isSubmitting = false;

    this.initElements();
    this.bindEvents();
    this.init();
  }

  initElements() {
    this.checkoutView = document.getElementById('checkoutView');
    this.confirmationView = document.getElementById('confirmationView');
    this.itemsList = document.getElementById('checkoutItemsList');
    this.itemCountBadge = document.getElementById('summaryItemCount');
    this.subtotalEl = document.getElementById('summarySubtotal');
    this.discountRow = document.getElementById('summaryDiscountRow');
    this.discountEl = document.getElementById('summaryDiscount');
    this.shippingEl = document.getElementById('summaryShipping');
    this.taxEl = document.getElementById('summaryTax');
    this.totalEl = document.getElementById('summaryTotal');
    this.standardShippingPriceBadge = document.getElementById('standardShippingPriceBadge');
    this.couponInput = document.getElementById('checkoutCouponInput');
    this.applyCouponBtn = document.getElementById('checkoutApplyCouponBtn');
    this.placeOrderBtn = document.getElementById('placeOrderBtn');
    this.cardFieldsContainer = document.getElementById('cardFieldsContainer');

    // Card inputs for formatting
    this.cardNumberInput = document.getElementById('cardNumber');
    this.cardExpiryInput = document.getElementById('cardExpiry');
  }

  bindEvents() {
    // Card formatting
    if (this.cardNumberInput) {
      this.cardNumberInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
        e.target.value = formatted;
      });
    }

    if (this.cardExpiryInput) {
      this.cardExpiryInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (val.length >= 3) {
          e.target.value = `${val.substring(0, 2)}/${val.substring(2)}`;
        } else {
          e.target.value = val;
        }
      });
    }

    // Coupon button in checkout
    if (this.applyCouponBtn && this.couponInput) {
      this.applyCouponBtn.addEventListener('click', () => {
        const code = this.couponInput.value.trim().toUpperCase();
        if (window.cartManager) {
          window.cartManager.applyCoupon(code);
          this.renderSummary();
        }
      });
    }
  }

  init() {
    // Wait until cartManager loads items
    setTimeout(() => {
      this.checkCartStatus();
      this.renderSummary();
      this.autoFillUserData();
    }, 150);
  }

  autoFillUserData() {
    if (window.auth && window.auth.isLoggedIn()) {
      const u = window.auth.getUser();
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val && !el.value) el.value = val;
      };

      setVal('custFullName', u.name);
      setVal('custEmail', u.email);
      setVal('custPhone', u.phone);
      setVal('custAddress', u.address);
      setVal('custCity', u.city);
      setVal('custState', u.state);
      setVal('custZip', u.zip);
      if (u.country) setVal('custCountry', u.country);
      setVal('cardHolder', u.name);
    }
  }

  checkCartStatus() {
    if (!window.cartManager || window.cartManager.items.length === 0) {
      if (this.checkoutView) {
        this.checkoutView.innerHTML = `
          <div class="empty-state" style="padding: 6rem 1rem;">
            <div class="empty-state-icon">🛒</div>
            <h2 class="empty-state-title">Your Cart is Empty</h2>
            <p class="empty-state-text">You need to add items to your shopping cart before proceeding to checkout.</p>
            <a href="index.html" class="btn btn-primary btn-lg">Explore Store Catalog</a>
          </div>
        `;
      }
    }
  }

  updateShippingMethod(method) {
    this.shippingMethod = method;
    this.renderSummary();
  }

  togglePaymentType(type) {
    this.paymentType = type;
    if (this.cardFieldsContainer) {
      this.cardFieldsContainer.style.display = type === 'card' ? 'grid' : 'none';
    }
  }

  renderSummary() {
    if (!window.cartManager) return;
    const items = window.cartManager.items;
    const totals = window.cartManager.getTotals(this.shippingMethod);

    if (this.itemCountBadge) {
      this.itemCountBadge.textContent = `(${totals.itemCount} item${totals.itemCount !== 1 ? 's' : ''})`;
    }

    // Standard Shipping Badge in form
    if (this.standardShippingPriceBadge) {
      this.standardShippingPriceBadge.textContent = totals.isFreeShipping ? 'FREE' : '$5.99';
    }

    // Render items list
    if (this.itemsList) {
      this.itemsList.innerHTML = items.map(item => `
        <div class="order-summary-item">
          <img src="${item.image}" alt="${item.title}" class="summary-item-img" onerror="this.onerror=null;this.src='images/placeholder.svg';">
          <div style="flex: 1;">
            <div style="font-size: 0.88rem; font-weight: 600; color: var(--dark); line-height: 1.3;">${item.title}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Qty: <strong>${item.quantity}</strong> × $${item.price.toFixed(2)}
            </div>
          </div>
          <div style="font-weight: 700; font-size: 0.92rem; color: var(--dark);">
            $${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      `).join('');
    }

    // Numbers
    if (this.subtotalEl) this.subtotalEl.textContent = `$${totals.subtotal.toFixed(2)}`;
    if (this.shippingEl) this.shippingEl.textContent = totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`;
    if (this.taxEl) this.taxEl.textContent = `$${totals.tax.toFixed(2)}`;
    if (this.totalEl) this.totalEl.textContent = `$${totals.total.toFixed(2)}`;

    // Coupon row
    if (this.discountRow && this.discountEl) {
      if (totals.discount > 0) {
        this.discountRow.style.display = 'flex';
        this.discountEl.textContent = `-$${totals.discount.toFixed(2)}`;
      } else {
        this.discountRow.style.display = 'none';
      }
    }
  }

  async processOrder() {
    if (this.isSubmitting) return;

    if (!window.cartManager || window.cartManager.items.length === 0) {
      showToast('Cannot submit order: Cart is empty!', 'error');
      return;
    }

    // Validate Customer Inputs
    const fullName = document.getElementById('custFullName')?.value.trim();
    const email = document.getElementById('custEmail')?.value.trim();
    const phone = document.getElementById('custPhone')?.value.trim();
    const address = document.getElementById('custAddress')?.value.trim();
    const city = document.getElementById('custCity')?.value.trim();
    const state = document.getElementById('custState')?.value.trim();
    const zip = document.getElementById('custZip')?.value.trim();
    const country = document.getElementById('custCountry')?.value.trim();

    if (!fullName || !email || !phone || !address || !city || !state || !zip) {
      showToast('Please fill in all required shipping fields (*)', 'error');
      return;
    }

    // Basic email check
    if (!email.includes('@') || !email.includes('.')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Payment validation
    let cardLast4 = '4242';
    if (this.paymentType === 'card') {
      const cardNum = this.cardNumberInput?.value.replace(/\s+/g, '') || '';
      const cardExp = this.cardExpiryInput?.value.trim() || '';
      const cardCvv = document.getElementById('cardCvv')?.value.trim() || '';
      const cardHolder = document.getElementById('cardHolder')?.value.trim() || '';

      if (cardNum.length < 15 || !cardExp || !cardCvv || !cardHolder) {
        showToast('Please provide valid card details (or select Cash on Delivery)', 'error');
        return;
      }
      cardLast4 = cardNum.slice(-4);
    }

    this.isSubmitting = true;
    if (this.placeOrderBtn) {
      this.placeOrderBtn.disabled = true;
      this.placeOrderBtn.innerHTML = `<span>⏳ Verifying & Processing Order...</span>`;
    }

    try {
      const itemsPayload = window.cartManager.items.map(i => ({
        id: i.id,
        quantity: i.quantity
      }));

      // 1. Verify stock & cart items with server
      const validateRes = await api.validateCart(itemsPayload);
      if (!validateRes.isValid) {
        throw new Error(validateRes.errors.join(' '));
      }

      // 2. Submit Order Payload
      const orderPayload = {
        customer: {
          fullName,
          email,
          phone,
          address,
          city,
          state,
          zip,
          country
        },
        items: itemsPayload,
        shippingMethod: this.shippingMethod,
        paymentMethod: this.paymentType === 'card' ? 'credit_card' : 'cash_on_delivery',
        paymentDetails: {
          cardLast4: this.paymentType === 'card' ? cardLast4 : 'COD'
        },
        couponCode: window.cartManager.coupon ? window.cartManager.coupon.code : ''
      };

      const result = await api.createOrder(orderPayload);
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Order could not be completed');
      }

      const order = result.data;

      // Clear local cart
      window.cartManager.clearCart();

      // Show confirmation screen
      this.displayConfirmation(order);
      showToast('Order successfully confirmed!', 'success');

    } catch (err) {
      console.error('Checkout error:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      this.isSubmitting = false;
      if (this.placeOrderBtn) {
        this.placeOrderBtn.disabled = false;
        this.placeOrderBtn.innerHTML = `<span>🔒 Place Order Now</span>`;
      }
    }
  }

  displayConfirmation(order) {
    if (this.checkoutView) this.checkoutView.style.display = 'none';
    if (this.confirmationView) this.confirmationView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Populate order fields
    document.getElementById('confOrderId').textContent = order.id;
    document.getElementById('confOrderDate').textContent = new Date(order.createdAt).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    document.getElementById('confOrderStatus').textContent = order.status;
    document.getElementById('confOrderDelivery').textContent = order.tracking?.estimatedDelivery || 'Within 3-5 days';

    // Shipping address
    const c = order.customer;
    document.getElementById('confShippingAddress').innerHTML = `
      <strong>${c.fullName}</strong><br>
      ${c.address}<br>
      ${c.city}, ${c.state} ${c.zip}<br>
      ${c.country}<br>
      📞 ${c.phone} | ✉️ ${c.email}
    `;

    // Payment info
    const p = order.payment;
    document.getElementById('confPaymentInfo').innerHTML = `
      Method: <strong>${p.method === 'credit_card' ? 'Credit / Debit Card' : 'Cash on Delivery'}</strong><br>
      Status: <span style="color: var(--success); font-weight: 700;">${p.status}</span><br>
      ${p.cardLast4 !== 'COD' ? `Card Ending: •••• ${p.cardLast4}<br>` : ''}
      Carrier: ${order.tracking?.carrier || 'Standard Carrier'}
    `;

    // Items list
    const itemsContainer = document.getElementById('confItemsList');
    itemsContainer.innerHTML = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${item.image}" alt="${item.title}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;" onerror="this.onerror=null;this.src='images/placeholder.svg';">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${item.title}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Qty: ${item.quantity} × $${item.price.toFixed(2)}</div>
          </div>
        </div>
        <div style="font-weight: 700; font-size: 0.95rem;">
          $${(item.price * item.quantity).toFixed(2)}
        </div>
      </div>
    `).join('');

    // Pricing
    document.getElementById('confSubtotal').textContent = `$${order.pricing.subtotal.toFixed(2)}`;
    document.getElementById('confShipping').textContent = order.pricing.shipping === 0 ? 'FREE' : `$${order.pricing.shipping.toFixed(2)}`;
    document.getElementById('confTax').textContent = `$${order.pricing.tax.toFixed(2)}`;
    document.getElementById('confTotal').textContent = `$${order.pricing.total.toFixed(2)}`;

    const discountRow = document.getElementById('confDiscountRow');
    if (order.pricing.discount > 0) {
      discountRow.style.display = 'flex';
      document.getElementById('confDiscount').textContent = `-$${order.pricing.discount.toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }

    // Tracking button link
    const trackLink = document.getElementById('confTrackLink');
    if (trackLink) {
      trackLink.href = `track-order.html?id=${encodeURIComponent(order.id)}`;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.checkout = new CheckoutPage();
});
