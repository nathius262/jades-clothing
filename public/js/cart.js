const CART_API_BASE = '/cart/api';

export class Cart {
  /**
   * Get current cart items from server
   * @returns {Promise<Array<{product: string, quantity: number}>>}
   */
  static async getCart() {
    try {
      const response = await fetch(`${CART_API_BASE}/`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data; // Direct array response
      } else if (data.cart && Array.isArray(data.cart)) {
        return data.cart; // Wrapped in cart property
      } else if (data.items && Array.isArray(data.items)) {
        return data.items; // Alternative property name
      }
      
      console.warn('Unexpected cart format:', data);
      return [];
    } catch (error) {
      console.error('Cart fetch error:', error);
      return [];
    }
  }

  /**
   * Get total number of items in cart (across all products)
   * @returns {Promise<number>}
   */
  static async getCartCount() {
    try {
      const cart = await this.getCart();
      
      // Double-check we have an array
      if (!Array.isArray(cart)) {
        console.warn('Cart is not an array:', cart);
        return 0;
      }
      
      return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    } catch (error) {
      console.error('Get cart count error:', error);
      return 0;
    }
  }

  /**
   * Add or update a product in the cart via API
   * @param {string} productId 
   * @param {number} quantity 
   */
  static async addToCart(productId, quantity = 1) {
    try {
      const response = await fetch(`${CART_API_BASE}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity })
      });
      
      if (!response.ok) throw new Error('Failed to add to cart');
      
      const result = await response.json();
      this._updateCartBadge(result.cartCount || result.cart.length);
      return result;
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  }

  /**
   * Set exact quantity for a product via API
   * @param {string} productId 
   * @param {number} quantity 
   */
  static async setQuantity(productId, quantity) {
    try {
      const response = await fetch(`${CART_API_BASE}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity })
      });
      
      if (!response.ok) throw new Error('Failed to update quantity');
      
      const result = await response.json();
      this._updateCartBadge(result.cartCount || result.cart.length);
      return result;
    } catch (error) {
      console.error('Update quantity error:', error);
      throw error;
    }
  }

  /**
   * Decrease the quantity of a product in the cart
   * @param {string} productId 
   */
  static async decrementQuantity(productId) {
    try {
      const cart = await this.getCart();
      const item = cart.find(item => item.product === productId);
      
      if (!item) return;
      
      const newQuantity = item.quantity - 1;
      return await this.setQuantity(productId, newQuantity);
    } catch (error) {
      console.error('Decrement quantity error:', error);
      throw error;
    }
  }

  /**
   * Remove product from cart via API
   * @param {string} productId 
   */
  static async removeFromCart(productId) {
    try {
      const response = await fetch(`${CART_API_BASE}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId })
      });
      
      if (!response.ok) throw new Error('Failed to remove from cart');
      
      const result = await response.json();
      this._updateCartBadge(result.cartCount || result.cart.length);
      return result;
    } catch (error) {
      console.error('Remove from cart error:', error);
      throw error;
    }
  }

  /**
   * Update cart badge count in UI
   * @param {number} [count] - Optional count to avoid extra API call
   */
  static async _updateCartBadge(count) {
    try {
      const badgeElements = document.querySelectorAll('.cart-badge');
      const cartCount = count !== undefined ? count : await this.getCartCount();

      badgeElements.forEach(badge => {
        badge.textContent = cartCount;
        badge.style.display = cartCount > 0 ? 'block' : 'none';
      });
    } catch (error) {
      console.error('Update cart badge error:', error);
    }
  }

  /**
   * Initialize cart functionality
   */
  static init() {
    document.addEventListener('DOMContentLoaded', () => {
      this._updateCartBadge();

      // Handle clicks on .add-to-cart buttons
      document.body.addEventListener('click', async (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart');
        if (addToCartBtn) {
          e.preventDefault();

          try {
            const productId = addToCartBtn.dataset?.productId;
            if (!productId) return;

            const quantityInput = document.querySelector('#quantity');
            const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

            await this.addToCart(productId, quantity);

            // Visual feedback
            const icon = addToCartBtn.querySelector('i');
            if (icon) {
              icon.classList.remove('bi-cart-plus');
              icon.classList.add('bi-check');
              setTimeout(() => {
                icon.classList.remove('bi-check');
                icon.classList.add('bi-cart-plus');
              }, 1000);
            }
          } catch (err) {
            console.error('Add to cart failed:', err);
          }
        }
      });

      // Handle quantity increment/decrement buttons
      document.body.addEventListener('click', async (e) => {
        const decrementBtn = e.target.closest('.decrement-btn');
        const incrementBtn = e.target.closest('.increment-btn');

        if (!decrementBtn && !incrementBtn) return;

        try {
          const wrapper = e.target.closest('.quantity-controls');
          if (!wrapper) return;

          const productId = wrapper.dataset?.productId;
          if (!productId) return;

          const input = wrapper.querySelector('.quantity-input');
          if (!input) return;

          let quantity = parseInt(input.value) || 1;

          if (incrementBtn) {
            quantity += 1;
          } else if (decrementBtn && quantity > 1) {
            quantity -= 1;
          } else if (decrementBtn && quantity <= 1) {
            await this.removeFromCart(productId);
            wrapper.closest('.cart-item')?.remove(); // Optional DOM cleanup
            quantity = 1; // Keep input consistent
          }

          input.value = quantity;
          await this.setQuantity(productId, quantity);
        } catch (err) {
          console.error('Quantity adjustment failed:', err);
        }
      });

      // Optional: handle direct input change
      document.body.addEventListener('change', async (e) => {
        const input = e.target.closest('.quantity-input');
        if (input) {
          try {
            const wrapper = input.closest('.quantity-controls');
            const productId = wrapper?.dataset?.productId;
            if (!productId) return;

            let quantity = parseInt(input.value) || 1;
            if (quantity < 1) quantity = 1;

            input.value = quantity;
            await this.setQuantity(productId, quantity);
          } catch (err) {
            console.error('Manual quantity input failed:', err);
          }
        }
      });
    });
  }
}