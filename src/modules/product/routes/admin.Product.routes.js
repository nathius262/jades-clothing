import express from 'express';
import * as controller from '../controllers/admin.Product.controller.js';
import upload from '../../../config/multerConfig.js';
import setSection from "../../../middlewares/uploadLocation.js";
import useModuleViews from '../../../middlewares/moduleViews.js';
import { withPagination } from '../../../middlewares/paginations.js';


const router = express.Router();

router.use(useModuleViews('product'));

// Admin view routes
router.route('/')
  .get(withPagination(10), controller.findAll)
  .post(upload.array('images', 5), controller.create);

router.get('/create', controller.renderCreate);

router.route('/:id')
  .get(controller.findById)
  .put(upload.array('images', 5), controller.update)
  .delete(controller.destroy);

router.post('/upload/:productId', upload.array('images', 5), controller.uploadImages);
router.delete('/delete-image/:id', controller.deleteImage)


export default router;
