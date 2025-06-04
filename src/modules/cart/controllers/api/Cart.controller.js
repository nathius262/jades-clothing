import { CartService } from '../../services/Cart.service.js';

export const CartController = {
  // Add item to cart
  addToCart: async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      CartService.addItem(req, res, productId, quantity);
      res.json({ success: true, cart: CartService.getCart(req) });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add item to cart' });
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res) => {
    try {
      const { productId } = req.body;
      CartService.removeItem(req, res, productId);
      res.json({ success: true, cart: CartService.getCart(req) });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove item from cart' });
    }
  },

  // Update item quantity
  updateCartItem: async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const success = CartService.updateQuantity(req, res, productId, quantity);
      
      if (!success) {
        return res.status(404).json({ error: 'Item not found in cart' });
      }
      
      res.json({ success: true, cart: CartService.getCart(req) });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update cart' });
    }
  },

  // Get current cart
  getCart: async (req, res) => {
    try {
      res.json({ cart: CartService.getCart(req) });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  }
};