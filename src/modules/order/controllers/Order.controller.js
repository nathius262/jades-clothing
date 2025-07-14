import * as service from '../services/Order.service.js';
import * as productService from '../../product/services/Product.service.js';
import * as orderService from '../../order/services/Order.service.js';
import axios from 'axios';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();


const page_logo = process.env.PAGELOGO
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const findAll = async (req, res) => {
  try {
    const data = await service.findAll();
    res.status(200).render('./list', {
      success: true,
      pageTitle: "",
      orders: data,
    });
  } catch (err) {
    res.status(500).render('errors/500', { error: err.message });
  }
};

export const findById = async (req, res) => {
  try {
    const data = await service.findById(req.params.id);
    res.status(200).render('./single', {
      success: true,
      pageTitle: "Details",
      order: [data],
    });
  } catch (err) {
    res.status(404).render('errors/404', { error: err.message });
  }
};

export const checkout_view = async (req, res) => {
    try {
        // Get cart from cookies or initialize empty cart
        let cart = [];

        try {
            if (!req.session.cart || !req.session.jades_cart) cart = JSON.parse(req.cookies.jades_cart) || JSON.parse(req.cookies.cart)
            else if (!req.cookies.jades_cart) cart = req.session.jades_cart || req.session.cart
            else cart = [];
        } catch (error) {
            console.log(error)
            cart = [];
        }

        

        // Fetch product details for each item in cart
        const cartItems = await Promise.all(cart.map(async (item) => {
            const product = await productService.findById(item.product);
            return {
                id: item.product,
                quantity: item.quantity,
                price: product.price,
                name: product.name,
                images: product.images,
                description: product.description,
                itemTotal: item.quantity * product.price,
            };
        }));
        
        // Calculate totals
        const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cartItems.reduce((sum, item) => sum + item.itemTotal, 0);
        const shippingFee = 0;

        res.render('checkout', {
            pageTitle: "Checkout",
            cartItems,
            totalQty,
            totalPrice,
            shippingFee,
            total: totalPrice + shippingFee
        });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).render('./errors/500', { 
            message: 'Internal Server Error', 
            error: err.message 
        });
    }
};


export const payment_intent_view =  async (req, res) => {
  try {
    
    const { amount, currency } = req.body;


    //metadata to add cart to customers' intent
    const cartCookies = req.cookies?.jades_cart;
    if (!cartCookies) {
        return res.status(400).json({ success: false, error: 'Cart is empty or missing.' });
    }

    let cartItems;
    try {
        cartItems = JSON.parse(cartCookies); // Parse the cookie data
    } catch (error) {
        return res.status(400).json({ success: false, error: 'Invalid cart data format.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        cart_items: JSON.stringify(cartItems),
      },
      // Enable all payment methods you've activated in dashboard
      //payment_method_types: ['card', 'us_bank_account', 'link', 'etc...'],
      automatic_payment_methods: {
        enabled: true, // Let Stripe handle which methods to show
      },
    });
    
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    //console.log(err.message)
    res.status(500).json({ error: err.message });
  }
};


export const update_payment_intent_view = async (req, res) => {
  try {
    const { clientSecret, customer_details } = req.body;
    
    // Retrieve PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(
      clientSecret.split('_secret')[0] // Extract PI ID
    );

    // Update with customer details
    const updatedIntent = await stripe.paymentIntents.update(
      paymentIntent.id, {
        metadata: {
          customer_email: customer_details.email,
          customer_name: `${customer_details.first_name} ${customer_details.last_name}`,
          customer_phone: customer_details.phone
        },
        shipping: customer_details.shipping ? {
          name: `${customer_details.first_name} ${customer_details.last_name}`,
          phone: customer_details.phone,
          address: customer_details.shipping
        } : undefined
      }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verify_paystack_transaction_view = async (req, res) => {
    const { reference } = req.query;

    try {
        // Parse cart data from cookies
        const cartCookies = req.cookies?.jades_cart;
        if (!cartCookies) {
            return res.status(400).json({ success: false, error: 'Cart is empty or missing.' });
        }

        let cartItems;
        try {
            cartItems = JSON.parse(cartCookies); // Parse the cookie data
        } catch (error) {
            return res.status(400).json({ success: false, error: 'Invalid cart data format.' });
        }

        // Verify Payment with Paystack
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }, // Replace with your secret key
        });

        const paymentData = response.data.data;

        // Create Order
        const result = await orderService.createOrder(paymentData, cartItems);

        if (result.success) {
            // Clear cart cookies
            res.clearCookie('jades_cart');

            // Dynamically generate base URL from the request
            const baseUrl = `${req.protocol}://${req.get('host')}`;

            // Send tracking email
            await sendTrackingEmail(paymentData.customer.email, result.tracking_id, baseUrl);

            res.status(200).json(result);
        } else {
            res.status(400).json({ success: false, error: result.error.message });
        }
    } catch (error) {
        console.error('Error verifying transaction:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};


export const order_complete_view = async (req, res) =>{
  
    try {
        // Render the checkout page with the retrieved products
        return res.render('order_complete', {pageTitle: "Order Completed"});
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
}

export const track_order_view = async (req, res) => {
    const { tracking_id } = req.query;

    if (!tracking_id) {
        return res.status(400).json({ success: false, message: 'Tracking ID is required.' });
    }

    try {
      const order = await service.getOrderByTrackingId(tracking_id);
      res.status(200).json({success:true, order})
    } catch (error) {
      res.status(500).render('errors/500', { error: err.message });
      
    }
};

export const track_order_page = async (req, res) => {


    try {
        // Render the checkout page with the retrieved products
        return res.render('track_order', {pageTitle: "Track Your Order"});
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};
