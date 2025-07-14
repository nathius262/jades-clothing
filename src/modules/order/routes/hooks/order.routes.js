import express from 'express';
import bodyParser from 'body-parser';
import * as controller from '../../controllers/hooks/Order.controller.js'

const router = express.Router();

// Stripe webhook needs raw body for signature verification
router.post(
  '/stripe-webhook',
  bodyParser.raw({ type: 'application/json' }),
  controller.stripe_webhook_handler_view
);

export default router;
