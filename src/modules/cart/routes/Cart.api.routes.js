import express from 'express';
import { CartController } from '../controllers/api/Cart.controller.js';
import useModuleViews from '../../../middlewares/moduleViews.js';
import { CartService } from '../services/Cart.service.js';


const router = express.Router();

router.use(useModuleViews('cart'));


// Initialize cart from cookie on all routes
router.use((req, res, next) => {
  CartService.initCartFromCookie(req);
  next();
});

// API Endpoints
router.post('/api/add', CartController.addToCart);
router.post('/api/remove', CartController.removeFromCart);
router.post('/api/update', CartController.updateCartItem);
router.get('/api/', CartController.getCart);

export default router;