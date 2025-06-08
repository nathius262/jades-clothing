import { Router } from "express";
import { 
    index_view, shop_view, detail_view, about_view, 
    contact_view, terms_condition_view, privacy_policy_view,
    searchProducts,
} from "../controllers/root.controller.js";

import { dashboard_view } from "../controllers/admin.controller.js";


const router = Router();

// Home Route
router.get('/', index_view);
router.get('/admin', dashboard_view)
router.get('/shop', shop_view);
router.get('/about', about_view);
router.get('/contact', contact_view);
router.get('/terms-conditions', terms_condition_view);
router.get('/privacy-policy', privacy_policy_view);
router.get('/search', searchProducts);

router.get('/product/detail', detail_view);


export default router;