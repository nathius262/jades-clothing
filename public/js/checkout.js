// /public/js/cart.js

export class CartManager {
  // Update item quantity
  static async updateItem(productId, quantity) {
    try {
      const response = await fetch('/cart/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      });

      if (!response.ok) throw new Error('Failed to update cart');
      window.location.reload(); // Refresh to get updated server values
    } catch (error) {
      console.error('Cart update error:', error);
      throw error;
    }
  }

  // Remove item from cart
  static async removeItem(productId) {
    try {
      const response = await fetch('/cart/api/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) throw new Error('Failed to remove item');
      window.location.reload(); // Refresh to get updated server values
    } catch (error) {
      console.error('Cart removal error:', error);
      throw error;
    }
  }

  // Refresh UI state (only manages button states)
  static refreshUI() {
    const hasItems = document.querySelectorAll('.cart-item').length > 0;
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (checkoutBtn) {
      checkoutBtn.disabled = !hasItems;
      console.log('Checkout button state:', hasItems ? 'Enabled' : 'Disabled');
    }
  }

  // Initialize cart event listeners
  static init() {
    // Quantity controls
    document.querySelectorAll('.quantity-controls').forEach(control => {
      const productId = control.dataset.productId;
      const input = control.querySelector('.quantity-input');
      
      control.querySelector('.decrement-btn').addEventListener('click', () => {
        let newQty = parseInt(input.value) - 1;
        if (newQty < 1) newQty = 1;
        this.updateItem(productId, newQty);
      });

      control.querySelector('.increment-btn').addEventListener('click', () => {
        const newQty = parseInt(input.value) + 1;
        this.updateItem(productId, newQty);
      });

      input.addEventListener('change', () => {
        let newQty = parseInt(input.value);
        if (isNaN(newQty)) newQty = 1;
        this.updateItem(productId, newQty);
      });
    });

    // Remove buttons
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        this.removeItem(btn.dataset.productId);
      });
    });

    // Initial UI state
    this.refreshUI();
  }
}

// Auto-initialize if on a cart page
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.cart-item')) {
    CartManager.init();
  }
});