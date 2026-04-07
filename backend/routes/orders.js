const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrdersByStatus,
  getOrder,
  updateOrderStatus,
  trackOrder,
  deleteOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/', createOrder);
router.get('/track/:orderNumber', trackOrder);

// Protected routes
router.get('/', protect, getOrders);
router.get('/kanban', protect, getOrdersByStatus);
router.get('/:id', protect, getOrder);
router.patch('/:id/status', protect, updateOrderStatus);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;
