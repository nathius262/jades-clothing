import nodemailer from "nodemailer";
import * as orderService from "../../services/Order.service.js";

export const stripe_webhook_handler_view = async (req, res) => {
    // 0. Immediate response to prevent retries
    res.status(200).json({ received: true });

    const sig = req.headers['stripe-signature'];
    
    try {
        // 1. Validate content type
        if (req.headers['content-type'] !== 'application/json') {
            throw new Error('Invalid content type');
        }

        // 2. Verify webhook
        const event = stripe.webhooks.constructEvent(
            req.body,  // ← Fixed: Use req.body instead of req.rawBody
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // 3. Process payment success
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;

            // Get cart from metadata (not cookies)
            const cartItems = paymentIntent.metadata.cart_items 
                ? JSON.parse(paymentIntent.metadata.cart_items)
                : [];

            if (cartItems.length === 0) {
                throw new Error('No cart items in metadata');
            }

            // Prepare order data
            const paymentData = {
                id: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                customer: {
                    email: paymentIntent.receipt_email,
                    first_name: paymentIntent.metadata?.customer_name?.split(' ')[0],
                    last_name: paymentIntent.metadata?.customer_name?.split(' ')[1],
                    phone: paymentIntent.metadata?.customer_phone
                },
                metadata: paymentIntent.metadata,
                channel: 'stripe',
                paid_at: new Date(paymentIntent.created * 1000).toISOString()
            };

            // Create order
            const result = await orderService.createOrder(paymentData, cartItems);
            
            if (!result.success) {
                throw new Error(`Order creation failed: ${result.error}`);
            }

            // Send email
            await sendTrackingEmail(
                paymentData.customer.email,
                result.tracking_id,
                `${req.protocol}://${req.get('host')}`
            );
        }

    } catch (error) {
        console.error('❗ Webhook Error:', error.message);
        // Errors are logged but don't return HTTP errors to prevent Stripe retries
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

