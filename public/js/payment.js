// /public/js/payment.js
import { messageAlert } from './utils.js';

export class PaymentHandler {
  static init() {
    // Delivery address toggle
    document.getElementById('deliveryOption')?.addEventListener('change', this.toggleAddressField);

    // Currency conversion
    document.getElementById('currency')?.addEventListener('change', this.handleCurrencyConversion);

    // Final checkout button
    document.getElementById('checkout-btn')?.addEventListener('click', () => {
      new bootstrap.Modal(document.getElementById('paymentModal')).show();
    });

    // Paystack payment
    document.getElementById('payNow')?.addEventListener('click', this.processPayment.bind(this));
  }

  static toggleAddressField() {
    const addressField = document.getElementById('addressField');
    addressField.style.display = this.checked ? 'block' : 'none';
  }

  static async handleCurrencyConversion() {
    const currency = this.value;
    const totalElement = document.querySelector('[data-total-price]');
    const amount = parseFloat(totalElement.dataset.totalPrice);

    try {
      const response = await fetch(`/checkout/api/convert-currency?toCurrency=${currency}&amount=${amount}`);
      const data = await response.json();
      
      if (data.success) {
        totalElement.textContent = `${currency === 'USD' ? '$' : '₦'}${data.rate.conversion_result.toFixed(2)}`;
        // Update the data attribute as well
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

  static async processPayment() {
    // Validate form
    const form = document.getElementById('paymentForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    // Get secure total amount from data attribute
    const totalElement = document.querySelector('[data-total-price]');
    const amount = parseFloat(totalElement.dataset.totalPrice) * 100; // Convert to kobo/cent
    const currency = document.getElementById('currency').value;

    // Prepare secure payload
    const payload = {
      key: 'pk_test_314202007cd3e2a3f03b9a4bce2a0415f6435a63', // Replace with your key
      email: document.getElementById('email').value,
      amount: amount,
      currency: currency,
      metadata: {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        ...this.getShippingAddress()
      }
    };

    // Initialize payment
    const handler = PaystackPop.setup({
      ...payload,
      callback: (response) => this.handlePaymentResponse(response),
      onClose: () => this.handlePaymentClose()
    });

    handler.openIframe();
  }

  static getShippingAddress() {
    if (!document.getElementById('deliveryOption').checked) return {};

    return {
      address: document.getElementById('address').value,
      country: $('#country_id1 option:selected').data('address_name'),
      state: $('#state_id1 option:selected').data('address_name'),
      city: $('#city_id1 option:selected').data('address_name')
    };
  }

  static async handlePaymentResponse(response) {
    try {
      const verification = await fetch(`/order/api/verify-payment?reference=${response.reference}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await verification.json();

      if (data.success) {
        messageAlert(
          'Payment Successful',
          'Order confirmed! Check your email for details.',
          '/order-confirmation',
          'text-success',
          'btn-success'
        );
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      messageAlert(
        'Payment Error',
        error.message,
        '',
        'text-error',
        'btn-error'
      );
    }
  }

  static handlePaymentClose() {
    messageAlert(
      'Payment Incomplete',
      'You closed the payment window. Try again?',
      '',
      'text-warning',
      'btn-warning'
    );
  }
}

// Auto-initialize if payment modal exists
if (document.getElementById('paymentModal')) {
  PaymentHandler.init();
}