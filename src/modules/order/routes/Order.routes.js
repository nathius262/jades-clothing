import express from 'express';
import * as controller from '../controllers/Order.controller.js';
import moduleView from '../../../middlewares/moduleViews.js'

const router = express.Router();

router.use(moduleView('order'))

// Public view routes
router.get('/', controller.findAll);

router.get('/checkout', controller.checkout_view);
router.get('/api/verify-payment', controller.verify_paystack_transaction_view)
router.get('/api/track-order', controller.track_order_view)
router.get('/track-order', controller.track_order_page)

router.get('/:id', controller.findById);

export default router;
