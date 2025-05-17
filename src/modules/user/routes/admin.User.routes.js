import express from 'express';
import * as controller from '../controllers/admin.User.controller.js';

const router = express.Router();

// Admin view routes
router.route('/')
  .get(controller.findAll)
  .post(controller.create);

router.get('/create', controller.renderCreate);
router.get('/dashboard', controller.adminDashboard);

router.route('/:id')
  .get(controller.findById)
  .put(controller.update)
  .delete(controller.destroy);

export default router;
