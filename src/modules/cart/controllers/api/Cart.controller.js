import { CartService } from '../../services/Cart.service.js';

export const CartController = {
  addToCart: async (req, res) => {
    try {
      const { productId, sizeId = null, quantity = 1, price } = req.body;

      CartService.addItem(
        req,
        res,
        productId,
        sizeId,
        Number(quantity),
        Number(price)
      );

      res.json({
        success: true,
        cart: CartService.getCart(req)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add item' });
    }
  },

  updateCartItem: async (req, res) => {
    try {
      const { productId, sizeId = null, quantity } = req.body;
      console.log(req.sessionID)

      const updated = CartService.updateQuantity(
        req,
        res,
        productId,
        sizeId,
        Number(quantity)
      );

      if (!updated) {
        return res.status(404).json({ error: 'Item not found in cart' });
      }

      res.json({
        success: true,
        cart: CartService.getCart(req)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update cart' });
    }
  },

  removeFromCart: async (req, res) => {
    try {
      const { productId, sizeId = null } = req.body;

      CartService.removeItem(req, res, productId, sizeId);

      res.json({
        success: true,
        cart: CartService.getCart(req)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to remove item' });
    }
  },

  getCart: async (req, res) => {
    try {
      res.json({ cart: CartService.getCart(req) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  }
};
