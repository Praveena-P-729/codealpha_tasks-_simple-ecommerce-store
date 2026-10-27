/**
 * Simple E-Commerce Store - Order Tracking Controller
 */

class TrackOrderPage {
  constructor() {
    this.form = document.getElementById('trackOrderForm');
    this.input = document.getElementById('trackOrderIdInput');
    this.resultArea = document.getElementById('trackResultArea');
    this.errorArea = document.getElementById('trackErrorArea');
    this.errorMessage = document.getElementById('trackErrorMessage');
    this.submitBtn = document.getElementById('trackSubmitBtn');

    this.bindEvents();
    this.initFromUrl();
  }

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = this.input ? this.input.value.trim() : '';
        if (id) {
          this.trackOrder(id);
        }
      });
    }
  }

  initFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      if (this.input) this.input.value = id;
      this.trackOrder(id);
    }
  }

  async trackOrder(orderId) {
    if (!orderId) return;

    if (this.submitBtn) {
      this.submitBtn.disabled = true;
      this.submitBtn.textContent = 'Searching...';
    }

    if (this.resultArea) this.resultArea.style.display = 'none';
    if (this.errorArea) this.errorArea.style.display = 'none';

    try {
      const response = await api.getOrder(orderId);
      if (!response || !response.success || !response.data) {
        throw new Error(response.message || `Order #${orderId} was not found.`);
      }

      this.displayOrder(response.data);
    } catch (err) {
      console.error('Track order error:', err);
      if (this.errorArea && this.errorMessage) {
        this.errorMessage.textContent = `⚠️ ${err.message}`;
        this.errorArea.style.display = 'block';
      }
    } finally {
      if (this.submitBtn) {
        this.submitBtn.disabled = false;
        this.submitBtn.textContent = 'Track';
      }
    }
  }

  displayOrder(order) {
    if (!this.resultArea) return;

    // Header ID & status
    document.getElementById('trkDisplayId').textContent = order.id;
    const statusBadge = document.getElementById('trkStatusBadge');
    statusBadge.textContent = order.status;

    // Status badge style
    if (order.status.toLowerCase() === 'delivered') {
      statusBadge.style.background = 'var(--success-light)';
      statusBadge.style.color = 'var(--success)';
    } else if (order.status.toLowerCase() === 'shipped') {
      statusBadge.style.background = 'var(--primary-light)';
      statusBadge.style.color = 'var(--primary)';
    } else {
      statusBadge.style.background = 'var(--accent-light)';
      statusBadge.style.color = '#b45309';
    }

    // Timeline updates
    const placedDate = new Date(order.createdAt).toLocaleDateString();
    document.getElementById('trkPlacedDate').textContent = placedDate;
    document.getElementById('trkCarrierName').textContent = order.tracking?.carrier || 'Carrier';
    document.getElementById('trkEstDelivery').textContent = order.tracking?.estimatedDelivery || 'Estimated';

    const stepPlaced = document.getElementById('stepPlaced');
    const stepProcessing = document.getElementById('stepProcessing');
    const stepShipped = document.getElementById('stepShipped');
    const stepDelivered = document.getElementById('stepDelivered');

    [stepPlaced, stepProcessing, stepShipped, stepDelivered].forEach(s => {
      s.classList.remove('completed', 'active');
    });

    stepPlaced.classList.add('completed');

    if (order.status.toLowerCase() === 'processing') {
      stepProcessing.classList.add('active');
    } else if (order.status.toLowerCase() === 'shipped') {
      stepProcessing.classList.add('completed');
      stepShipped.classList.add('active');
    } else if (order.status.toLowerCase() === 'delivered') {
      stepProcessing.classList.add('completed');
      stepShipped.classList.add('completed');
      stepDelivered.classList.add('completed');
    }

    // Shipping info
    document.getElementById('trkTrackingNumber').textContent = order.tracking?.trackingNumber || 'Pending';
    document.getElementById('trkCarrier').textContent = order.tracking?.carrier || 'Standard Ground';
    const c = order.customer;
    document.getElementById('trkDestination').textContent = `${c.fullName}, ${c.address}, ${c.city}, ${c.state} ${c.zip}`;

    // Items list
    const itemsContainer = document.getElementById('trkItemsList');
    itemsContainer.innerHTML = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${item.image}" alt="${item.title}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;" onerror="this.onerror=null;this.src='images/placeholder.svg';">
          <div>
            <div style="font-weight: 600; font-size: 0.88rem; color: var(--dark);">${item.title}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">Qty: ${item.quantity}</div>
          </div>
        </div>
        <div style="font-weight: 700; font-size: 0.9rem;">
          $${(item.price * item.quantity).toFixed(2)}
        </div>
      </div>
    `).join('');

    document.getElementById('trkTotalAmount').textContent = `$${order.pricing.total.toFixed(2)}`;

    this.resultArea.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.trackOrderPage = new TrackOrderPage();
});
