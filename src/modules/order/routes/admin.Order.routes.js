import express from 'express';
import * as controller from '../controllers/admin.Order.controller.js';
import moduleView from '../../../middlewares/moduleViews.js';
import {withPagination} from '../../..//middlewares/paginations.js';

const router = express.Router();


router.use(moduleView('order'));


// Admin view routes
router.route('/')
  .get(withPagination(10), controller.findAll)

router.route('/:id')
  .get(controller.findById)
  .put(controller.update)
  .delete(controller.destroy);

export default router;
