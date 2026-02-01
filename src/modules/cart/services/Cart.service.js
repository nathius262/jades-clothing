const CART_COOKIE_NAME = 'jades_cart';
const CART_EXPIRY_DAYS = 3;

export class CartService {
  // ===== CORE =====

  static getCart(req) {
    return req.session.cart;
  }

  static initCartFromCookie(req) {
    if (req.session.cart) return;

    if (req.cookies[CART_COOKIE_NAME]) {
      try {
        req.session.cart = JSON.parse(req.cookies[CART_COOKIE_NAME]);
      } catch {
        req.session.cart = [];
      }
    } else {
      req.session.cart = [];
    }
  }

  static addItem(req, res, productId, sizeId, quantity, price) {
    const pid = String(productId);
    const sid = sizeId === null ? null : String(sizeId);

    const item = req.session.cart.find(
      i =>
        String(i.product) === pid &&
        (i.sizeId === null ? null : String(i.sizeId)) === sid
    );

    if (item) {
      item.quantity += Number(quantity);
    } else {
      req.session.cart.push({
        product: pid,
        sizeId: sid,
        quantity: Number(quantity),
        price: Number(price)
      });
    }

    this._sync(req, res);
  }

  static updateQuantity(req, res, productId, sizeId, quantity) {
    const pid = String(productId);
    const sid = sizeId === null ? null : String(sizeId);

    const item = req.session.cart.find(
      i =>
        String(i.product) === pid &&
        (i.sizeId === null ? null : String(i.sizeId)) === sid
    );

    if (!item) return false;

    item.quantity = Math.max(1, Number(quantity));
    this._sync(req, res);
    return true;
  }

  static removeItem(req, res, productId, sizeId) {
    const pid = String(productId);
    const sid = sizeId === null ? null : String(sizeId);

    req.session.cart = req.session.cart.filter(
      i =>
        !(
          String(i.product) === pid &&
          (i.sizeId === null ? null : String(i.sizeId)) === sid
        )
    );

    this._sync(req, res);
  }

  // ===== COOKIE SYNC =====

  static _sync(req, res) {
    if (req.session.cart.length === 0) {
      res.clearCookie(CART_COOKIE_NAME);
      return;
    }

    res.cookie(CART_COOKIE_NAME, JSON.stringify(req.session.cart), {
      maxAge: CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'Lax'
    });
  }
}
