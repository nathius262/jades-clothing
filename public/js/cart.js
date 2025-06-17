// cart.js
document.addEventListener('DOMContentLoaded', function() {
  // Initialize cart badge
  updateCartBadge();

  // Set up quantity controls and add to cart buttons
  document.querySelectorAll('.quantity-controls').forEach(control => {
    const productId = control.dataset.productId;
    const input = control.querySelector('.quantity-input');
    const incrementBtn = control.querySelector('.increment-btn');
    const decrementBtn = control.querySelector('.decrement-btn');
    const addToCartBtn = document.querySelector(`.add-to-cart[data-product-id="${productId}"]`);
    
    // Disable add to cart button initially (only enable when quantity changes)
    /*
    if (addToCartBtn) {
      addToCartBtn.disabled = true;
      input.dataset.originalValue = input.value;
    }*/

    // Quantity increment
    incrementBtn.addEventListener('click', () => {
      input.value = parseInt(input.value) + 1;
      toggleAddToCartButton(input, addToCartBtn);
    });

    // Quantity decrement
    decrementBtn.addEventListener('click', () => {
      const newValue = parseInt(input.value) - 1;
      if (newValue >= parseInt(input.min)) {
        input.value = newValue;
        toggleAddToCartButton(input, addToCartBtn);
      }
    });

    // Manual input change
    input.addEventListener('change', () => {
      if (parseInt(input.value) < parseInt(input.min)) {
        input.value = input.min;
      }
      toggleAddToCartButton(input, addToCartBtn);
    });
  });

    // Add to cart button handlers - modified version
// Add to cart button handlers - updated version
document.querySelectorAll('.add-to-cart').forEach(button => {
  button.addEventListener('click', async function() {
    const productId = this.dataset.productId;
    const price = this.dataset.productPrice;

    
    // Check if this is on a detail page with quantity controls
    const quantityControl = document.querySelector(`.quantity-controls[data-product-id="${productId}"]`);
    const isDetailPage = !!quantityControl;
    let quantity = 1;
    
    if (isDetailPage) {
      quantity = parseInt(quantityControl.querySelector('.quantity-input').value);
    }
    
    // Disable button during operation
    const originalHtml = this.innerHTML;
    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    
    try {
      // For non-detail pages, check if item exists first
      if (!isDetailPage) {
        const cartResponse = await fetch('/cart/api');
        if (!cartResponse.ok) throw new Error('Could not fetch cart');
        
        const cartData = await cartResponse.json();
        const existingItem = cartData.cart.find(item => item.product === productId);
        
        if (existingItem) {
          showToast(`This item is already in your cart (Quantity: ${existingItem.quantity})`, 'info');
          return;
        }
      }
      
      // Proceed with add/update
      const addResponse = await fetch('/cart/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity, price })
      });
      
      if (addResponse.ok) {
        updateCartBadge();
        showToast(isDetailPage ? 'Cart updated' : 'Item added to cart');
        
        // Reset quantity controls if on detail page
        if (isDetailPage) {
          const input = quantityControl.querySelector('.quantity-input');
          input.value = 1;
          input.dataset.originalValue = '1';
          this.disabled = true;
        }
      } else {
        throw new Error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error adding item to cart', 'danger');
    } finally {
      this.innerHTML = originalHtml;
      this.disabled = false;
    }
  });
});

  // Function to toggle add to cart button state
  function toggleAddToCartButton(input, button) {
    if (button) {
      button.disabled = input.value === input.dataset.originalValue;
    }
  }

  // Updated function to calculate count from cart items
async function updateCartBadge() {
  try {
    const response = await fetch('/cart/api');
    if (response.ok) {
      const data = await response.json();
      // Calculate total quantity by summing all item quantities
      const totalItems = data.cart.reduce((total, item) => total + item.quantity, 0);
      document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.textContent = totalItems || '0';
      });
    }
  } catch (error) {
    console.error('Error updating cart badge:', error);
    // Fallback to 0 if there's an error
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = '0';
    });
  }
}
  // Helper function to show toast notifications
  function showToast(message, variant = 'success') {
    // Implement your toast notification system here
    // Example using Bootstrap toasts:
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${variant} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '11';
    document.body.appendChild(container);
    return container;
  }
});