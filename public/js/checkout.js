document.addEventListener('DOMContentLoaded', function() {
  // Initialize cart functionality
  initCart();
});

function initCart() {
  // Enable quantity controls
  setupQuantityControls();
  
  // Enable remove item buttons
  setupRemoveItemButtons();
  
  // Update checkout button state based on cart items
  updateCheckoutButton();
  
  // Calculate initial totals
  updateOrderSummary();
}

function setupQuantityControls() {
  document.querySelectorAll('.quantity-controls').forEach(control => {
    const productId = control.dataset.productId;
    const decrementBtn = control.querySelector('.decrement-btn');
    const incrementBtn = control.querySelector('.increment-btn');
    const quantityInput = control.querySelector('.quantity-input');
    
    // Handle decrement
    decrementBtn.addEventListener('click', () => {
      let newQuantity = parseInt(quantityInput.value) - 1;
      if (newQuantity < 1) newQuantity = 1;
      updateCartItem(productId, newQuantity);
    });
    
    // Handle increment
    incrementBtn.addEventListener('click', () => {
      let newQuantity = parseInt(quantityInput.value) + 1;
      updateCartItem(productId, newQuantity);
    });
    
    // Handle direct input
    quantityInput.addEventListener('change', () => {
      let newQuantity = parseInt(quantityInput.value);
      if (isNaN(newQuantity)) {
        newQuantity = 1
      };
      if (newQuantity < 1) newQuantity = 1;
      updateCartItem(productId, newQuantity);
    });
  });
}

function setupRemoveItemButtons() {
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', function() {
      const productId = this.dataset.productId;
      removeCartItem(productId);
    });
  });
}

function updateCartItem(productId, newQuantity) {
  fetch('/cart/api/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId: productId,
      quantity: newQuantity
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Refresh the page to get updated cart data
      window.location.reload();
    } else {
      console.error('Failed to update cart item');
    }
  })
  .catch(error => {
    console.error('Error updating cart item:', error);
  });
}

function removeCartItem(productId) {
  fetch('/cart/api/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId: productId
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Refresh the page to get updated cart data
      window.location.reload();
    } else {
      console.error('Failed to remove cart item');
    }
  })
  .catch(error => {
    console.error('Error removing cart item:', error);
  });
}

function updateOrderSummary() {
  // Calculate subtotal from all items
  let subtotal = 0;
  document.querySelectorAll('.item-total').forEach(item => {
    const priceText = item.textContent.replace('₦', '').replace(',', '');
    subtotal += parseFloat(priceText);
  });
  
  // Update subtotal display
  document.getElementById('subtotal').textContent = `₦${subtotal.toLocaleString()}`;
  
  // Calculate shipping (fixed for now)
  const shipping = 2500;
  
  // Calculate total
  const total = subtotal + shipping;
  document.getElementById('total').textContent = `₦${total.toLocaleString()}`;
}

function updateCheckoutButton() {
  const checkoutBtn = document.getElementById('checkout-btn');
  const cartItems = document.querySelectorAll('.cart-item');
  
  if (cartItems.length > 0) {
    checkoutBtn.disabled = false;
  } else {
    checkoutBtn.disabled = true;
  }
}