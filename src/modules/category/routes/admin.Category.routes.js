import express from 'express';
import * as controller from '../controllers/admin.Category.controller.js';
import useModuleViews from '../../../middlewares/moduleViews.js';
import upload from '../../../config/multerConfig.js';
import setSection from "../../../middlewares/uploadLocation.js";
import { withPagination } from '../../../middlewares/paginations.js';


const router = express.Router();

router.use(useModuleViews('category'));

// Admin view routes
router.route('/')
  .get(controller.findAll)
  .post(setSection('product_category'), upload.fields([
        {name: 'image_url', maxCount:1}
    ]), controller.create);

router.get('/create', controller.renderCreate);

router.route('/:id')
  .get(controller.findById)
  .put(setSection('product_category'), upload.fields([
        {name: 'image_url', maxCount:1}
    ]), controller.update)
  .delete(controller.destroy);

export default router;
