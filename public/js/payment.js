// /public/js/payment.js
import { messageAlert } from './utils.js';

export class PaymentHandler {
  static stripe;
  static elements; // Store the Elements group

  static init() {
    // Delivery address toggle
    document.getElementById('deliveryOption')?.addEventListener('change', this.toggleAddressField);

    // Currency conversion (if still needed)
    document.getElementById('currency')?.addEventListener('change', this.handleCurrencyConversion);

    // Final checkout button
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
      new bootstrap.Modal(document.getElementById('paymentModal')).show();
      this.initializeStripe(); // Initialize when modal opens
    });

    // Stripe payment
    document.getElementById('payNow')?.addEventListener('click', this.processPayment.bind(this));
  }

  static toggleAddressField() {
    const addressField = document.getElementById('addressField');
    addressField.style.display = this.checked ? 'block' : 'none';
  }

  static async handleCurrencyConversion() {
    // Force USD for Stripe
    const currency = 'USD';
    const totalElement = document.querySelector('[data-total-price]');
    const amount = parseFloat(totalElement.dataset.totalPrice);

    try {
      const response = await fetch(`/checkout/api/convert-currency?toCurrency=${currency}&amount=${amount}`);
      const data = await response.json();

      if (data.success) {
        totalElement.textContent = `$${data.rate.conversion_result.toFixed(2)}`;
        totalElement.dataset.totalPrice = data.rate.conversion_result;
      }
    } catch (error) {
      messageAlert(
        'Currency Error',
        `Failed to convert: ${error.message}`,
        '',
        'text-error',
        'btn-error'
      );
    }
  }
  
  static async initializeStripe() {
    try {
      // Initialize Stripe
      this.stripe = Stripe('pk_live_51RhbUnEdzRV0dHrGnraw8RQdOR1MlrQFyT7rsBFief7H77m25oiYcjGjlI4JXhZJOJwcIYqHZca7RjVssGcCkvlc004Vl7eBTT');
      
      // Create Payment Intent
      const response = await fetch('/order/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(document.querySelector('[data-total-price]').dataset.totalPrice) * 100,
          currency: 'usd'
        })
      });
      
      const { clientSecret } = await response.json();
      this.clientSecret = clientSecret;
      
      // Initialize Elements group
      this.elements = this.stripe.elements({ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#000000',
            borderRadius: '0px'
          }
        }
      });
      
      // Create and mount Payment Element
      const paymentElement = this.elements.create('payment');
      paymentElement.mount('#payment-element');
      
      // Handle validation errors
      paymentElement.on('change', (event) => {
        const displayError = document.getElementById('payment-errors');
        displayError.textContent = event.error?.message || '';
        displayError.style.display = event.error ? 'block' : 'none';
      });
      
    } catch (error) {
      console.error('Stripe initialization error:', error);
      this.showError('Payment system unavailable');
    }
  }

  static async processPayment() {
    const payButton = document.getElementById('payNow');
    payButton.disabled = true;
    payButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

    try {
      // Validate form first
      const form = document.getElementById('paymentForm');
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        throw new Error('Please fill all required fields');
      }

      // Update Payment Intent with customer details
      await fetch('/order/update-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSecret: this.clientSecret,
          customer_details: this.getCustomerDetails()
        })
      });

      // Confirm payment with Elements group
      const { error } = await this.stripe.confirmPayment({
        elements: this.elements, // Pass the Elements group
        confirmParams: {
          return_url: window.location.origin + '/order/complete',
          receipt_email: document.getElementById('email').value
        },
        redirect: 'if_required'
      });

      if (error) throw error;
      
      this.handlePaymentSuccess();
      
    } catch (error) {
      this.handlePaymentError(error);
    } finally {
      payButton.disabled = false;
      payButton.innerHTML = 'Pay Now';
    }
  }

    static getCustomerDetails() {
    return {
      first_name: document.getElementById('firstName').value,
      last_name: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      shipping: this.getShippingAddress()
    };
  }

  static getShippingAddress() {
    if (!document.getElementById('deliveryOption').checked) return {};

    return {
      line1: document.getElementById('address').value,
      country: $('#country_id1 option:selected').data('address_name'),
      state: $('#state_id1 option:selected').data('address_name'),
      city: $('#city_id1 option:selected').data('address_name'),
      postal_code: document.getElementById('zipCode')?.value || ''
    };
  }

  static handlePaymentSuccess(paymentIntent) {
    // Close the payment modal
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();

    // Show success message
    messageAlert(
      'Payment Successful',
      'Order confirmed! Check your email for details.',
      '/order/complete',
      'text-success',
      'btn-success'
    );
  }

  static handlePaymentError(error) {
    console.log(error.message)

    messageAlert(
      'Payment Error',
      error.message || 'Payment failed. Please try again.',
      false,
      'text-error',
      'btn-error'
    );
  }
}

// Auto-initialize if payment modal exists
if (document.getElementById('paymentModal')) {
  PaymentHandler.init();
}