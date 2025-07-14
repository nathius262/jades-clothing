import express from 'express';
import bodyParser from 'body-parser';
import * as controller from '../controllers/Order.controller.js';
import moduleView from '../../../middlewares/moduleViews.js';

const router = express.Router();

router.use(moduleView('order'))

// Public view routes
router.get('/', controller.findAll);

router.get('/checkout', controller.checkout_view);
router.get('/api/verify-payment', controller.verify_paystack_transaction_view);
router.get('/api/track-order', controller.track_order_view);
router.get('/track-order', controller.track_order_page);
router.get('/complete', controller.order_complete_view);
router.post('/create-payment-intent', controller.payment_intent_view);
router.post('/update-payment-intent', controller.update_payment_intent_view);
// Stripe webhook needs raw body for signature verification
router.post(
  '/stripe-webhook',
  bodyParser.raw({ type: 'application/json' }),
  controller.stripe_webhook_handler_view
);


router.get('/:id', controller.findById);

export default router;
