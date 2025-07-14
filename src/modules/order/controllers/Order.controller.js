import * as service from '../services/Order.service.js';
import * as productService from '../../product/services/Product.service.js';
import * as orderService from '../../order/services/Order.service.js';
import axios from 'axios';
import nodemailer from 'nodemailer';
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
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
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


export const stripe_webhook_handler_view = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
        // 1. Verify the webhook signature
        const event = stripe.webhooks.constructEvent(
            req.rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // 2. Handle payment_intent.succeeded event
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;

            // Parse cart data from metadata or cookies
            const cartCookies = req.cookies?.jades_cart;
            if (!cartCookies) {
                throw new Error('Cart is empty or missing');
            }

            let cartItems;
            try {
                cartItems = JSON.parse(cartCookies);
            } catch (error) {
                throw new Error('Invalid cart data format');
            }

            // Format payment data to match your existing createOrder service
            const paymentData = {
                id: paymentIntent.id,
                amount: paymentIntent.amount / 100, // Convert to currency unit
                currency: paymentIntent.currency,
                customer: {
                    email: paymentIntent.receipt_email || paymentIntent.metadata?.customer_email,
                    first_name: paymentIntent.metadata?.customer_name?.split(' ')[0],
                    last_name: paymentIntent.metadata?.customer_name?.split(' ')[1],
                    phone: paymentIntent.metadata?.customer_phone
                },
                metadata: paymentIntent.metadata,
                channel: 'stripe',
                gateway_response: 'Payment successful',
                paid_at: new Date(paymentIntent.created * 1000).toISOString()
            };

            // 3. Create Order (using your existing service)
            const result = await orderService.createOrder(paymentData, cartItems);

            if (!result.success) {
                throw new Error(result.error.message);
            }

            // 4. Clear cart cookies
            res.clearCookie('jades_cart');

            // 5. Send tracking email
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            await sendTrackingEmail(
                paymentData.customer.email, 
                result.tracking_id, 
                baseUrl
            );

            return res.status(200).json(result);
        }

        // Handle other event types if needed
        return res.status(200).json({ received: true, });

    } catch (error) {
        console.error('Webhook processing error:', error.message);
        return res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
};


async function sendTrackingEmail(user_email, tracking_id, baseUrl) {
    try {
        // Configure Nodemailer transport for Zoho Mail
        const transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465, // Use 587 for TLS, or 465 for SSL
            secure: true, // Set true for SSL, false for TLS
            auth: {
                user: process.env.ZOHO_EMAIL,
                pass: process.env.ZOHO_PASSWORD,
            },
            
        });

        // Generate tracking link dynamically
        const trackingLink = `${baseUrl}/order/track-order?tracking_id=${tracking_id}`;

        // Email content
        const mailOptions = {
            from: `"Jades Clothing" ${process.env.ZOHO_EMAIL}`, // Sender's email
            to: user_email, // Recipient's email
            subject: 'Your Order Tracking Information',
            html: `
                <h1>Thank you for your order!</h1>
                <p>Your order has been successfully processed. You can track your order using the information below:</p>
                <p><strong>Tracking ID:</strong> ${tracking_id}</p>
                <p>Track your order here: <a href="${trackingLink}">${trackingLink}</a></p>
                <p>If you have any questions, feel free to contact our support team.</p>
            `,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Tracking email sent successfully:', info.messageId);
    } catch (error) {
        console.error('Error sending tracking email:', error.message);
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
