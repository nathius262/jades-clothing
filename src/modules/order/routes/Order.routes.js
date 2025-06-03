import express from 'express';
import * as controller from '../controllers/Order.controller.js';

const router = express.Router();

// Public view routes
router.get('/', controller.findAll);
router.get('/:id', controller.findById);

export default router;
