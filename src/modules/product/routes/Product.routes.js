import express from 'express';
import * as controller from '../controllers/Product.controller.js';
import useModuleViews from '../../../middlewares/moduleViews.js';
import { withPagination } from '../../../middlewares/paginations.js';


const router = express.Router();

router.use(useModuleViews('product'));

// Public view routes
router.get('/', withPagination(9), controller.findAll);
router.get('/:slug', controller.findBySlug);

export default router;
