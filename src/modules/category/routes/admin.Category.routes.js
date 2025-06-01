import express from 'express';
import * as controller from '../controllers/admin.Category.controller.js';
import useModuleViews from '../../../middlewares/moduleViews.js';

const router = express.Router();

router.use(useModuleViews('category'));

// Admin view routes
router.route('/')
  .get(controller.findAll)
  .post(controller.create);

router.get('/create', controller.renderCreate);

router.route('/:id')
  .get(controller.findById)
  .put(controller.update)
  .delete(controller.destroy);

export default router;
