import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import Stripe from 'stripe';
import * as orderService from "../../services/Order.service.js";

dotenv.config();


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripe_webhook_handler_view = async (req, res) => {
    // 0. Clone critical headers FIRST
    const headers = {
        'content-type': req.headers['content-type'] || '',
        'stripe-signature': req.headers['stripe-signature'] || ''
    };

    // 1. Validate content type IMMEDIATELY
    if (!headers['content-type'].includes('application/json')) {
        console.error('❌ Invalid content-type:', headers['content-type']);
        return res.status(400).json({ error: 'Invalid content-type' }); // Explicit response
    }

    // 2. Immediate success response (to prevent Stripe retries)
    res.status(200).json({ received: true });

    try {
        // 3. Verify webhook signature
        const event = stripe.webhooks.constructEvent(
            req.body, // Use raw body buffer
            headers['stripe-signature'],
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // 4. Process payment success
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;


            // 5. Validate cart items
            const cartItems = parseCartItems(paymentIntent.metadata);
            if (!cartItems.length) {
                throw new Error('🛒 Empty cart in metadata');
            }

            // 6. Process order
            await processSuccessfulPayment(paymentIntent, cartItems, req);
        }

    } catch (error) {
        console.error('❗ Webhook Processing Failed:', {
            error: error.message,
            stack: error.stack // Include stack trace
        });
        
        // Note: Response already sent, can't change status code
        // Consider logging to external service (Sentry, etc.)
    }
};

// Helper: Safely parse cart items
function parseCartItems(metadata) {
    try {
        return metadata.cart_items ? JSON.parse(metadata.cart_items) : [];
    } catch (err) {
        console.error('🛒 Cart JSON Parse Error:', err);
        return [];
    }
}

// Helper: Process order and send email
async function processSuccessfulPayment(paymentIntent, cartItems, req) {
    const paymentData = {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        customer: {
            email: paymentIntent.receipt_email || paymentIntent.metadata?.customer_email,
            first_name: paymentIntent.metadata?.customer_name?.split(' ')[0] || 'Guest',
            last_name: paymentIntent.metadata?.customer_name?.split(' ')[1] || '',
            phone: paymentIntent.metadata?.customer_phone || ''
        },
        metadata: paymentIntent.metadata,
        channel: 'stripe',
        paid_at: new Date(paymentIntent.created * 1000).toISOString()
    };

    const result = await orderService.createOrder(paymentData, paymentIntent, cartItems);
    
    if (!result.success) {
        throw new Error(`Order creation failed: ${result.error}`);
    }

    await sendTrackingEmail(
        paymentData.customer.email,
        result.tracking_id,
        `${req.protocol}://${req.get('host')}`
    );
}


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

