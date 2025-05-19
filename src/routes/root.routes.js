import { Router } from "express";
import { 
    index_view, shop_view
} from "../controllers/root.controller.js";

const router = Router();

// Home Route
router.get('/', index_view);
router.get('/shop', shop_view);


export default router;