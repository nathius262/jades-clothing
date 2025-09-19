const CART_COOKIE_NAME = 'jades_cart';
const CART_EXPIRY_DAYS = 3;

export class CartService {
  // ==== CORE METHODS ==== //
  
  /**
   * Get current cart from session
   */
  static getCart(req) {
    return req.session.cart || [];
  }

  /**
   * Add/update item in cart (product + sizeId combo)
   */
  static addItem(req, res, productId, sizeId, quantity, price) {
    if (!req.session.cart) req.session.cart = [];

    const existingItem = req.session.cart.find(
      item => item.product === productId && item.sizeId === sizeId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      req.session.cart.push({ product: productId, sizeId, quantity, price });
    }

    this._syncCartToCookie(req, res);
  }

  /**
   * Remove item from cart
   */
  static removeItem(req, res, productId, sizeId) {
    if (!req.session.cart) return;

    req.session.cart = req.session.cart.filter(
      item => !(item.product === productId && item.sizeId === sizeId)
    );

    this._syncCartToCookie(req, res);
  }

  /**
   * Update item quantity
   */
  static updateQuantity(req, res, productId, sizeId, newQuantity) {
    if (!req.session.cart) return false;

    const item = req.session.cart.find(
      item => item.product === productId && item.sizeId === sizeId
    );
    if (!item) return false;

    item.quantity = newQuantity;
    this._syncCartToCookie(req, res);
    return true;
  }

  // ==== HELPER METHODS ==== //

  /**
   * Sync session cart to HTTP cookie
   */
  static _syncCartToCookie(req, res) {
    res.cookie(CART_COOKIE_NAME, JSON.stringify(req.session.cart), {
      maxAge: CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'Lax'
    });
  }

  /**
   * Initialize cart from cookie if needed
   */
  static initCartFromCookie(req) {
    if (!req.session.cart && req.cookies[CART_COOKIE_NAME]) {
      try {
        req.session.cart = JSON.parse(req.cookies[CART_COOKIE_NAME]);
      } catch (e) {
        req.session.cart = [];
      }
    }
  }
}
