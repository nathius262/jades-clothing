import { Router } from "express";
import { 
    index_view, shop_view, detail_view, checkout_view
} from "../controllers/root.controller.js";

import { dashboard_view } from "../controllers/admin.controller.js";


const router = Router();

// Home Route
router.get('/', index_view);
router.get('/admin', dashboard_view)
router.get('/shop', shop_view);
router.get('/checkout', checkout_view);
router.get('/product/detail', detail_view);


export default router;