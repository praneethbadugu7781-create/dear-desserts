const { Order, MenuItem, Notification, Offer } = require('../models');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const { customer, items, discountCode, paymentMethod, notes } = req.body;

    // Validate items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${item.menuItem} not found`
        });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is currently unavailable`
        });
      }

      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }

    // Apply discount if code provided
    let discount = 0;
    if (discountCode) {
      const offer = await Offer.findOne({ code: discountCode.toUpperCase() });
      if (offer && offer.isValid()) {
        discount = offer.calculateDiscount(subtotal);
        offer.usedCount += 1;
        await offer.save();
      }
    }

    const total = subtotal - discount;

    // Create order
    const order = await Order.create({
      customer,
      items: orderItems,
      subtotal,
      discount,
      discountCode: discountCode ? discountCode.toUpperCase() : undefined,
      total,
      paymentMethod,
      notes,
      statusHistory: [{ status: 'new', timestamp: new Date() }]
    });

    // Create notification
    const notification = await Notification.create({
      type: 'new_order',
      title: 'New Order Received',
      message: `Order #${order.orderNumber} from ${customer.name} - ₹${total}`,
      order: order._id
    });

    // Emit socket events
    if (req.io) {
      req.io.emit('newOrder', order);
      req.io.emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const { status, date, limit = 50, page = 1 } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDate, $lte: endDate };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('items.menuItem', 'name image');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get orders by status (for Kanban)
// @route   GET /api/orders/kanban
// @access  Private
exports.getOrdersByStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const statuses = ['new', 'preparing', 'ready', 'completed'];
    const kanbanData = {};

    for (const status of statuses) {
      kanbanData[status] = await Order.find({
        status,
        createdAt: { $gte: today }
      })
        .sort({ createdAt: status === 'completed' ? -1 : 1 })
        .limit(status === 'completed' ? 20 : 100);
    }

    res.json({
      success: true,
      data: kanbanData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem', 'name image category');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user ? req.user._id : null
    });

    await order.save();

    // Emit socket event
    if (req.io) {
      req.io.emit('orderUpdated', order);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order by order number (for tracking)
// @route   GET /api/orders/track/:orderNumber
// @access  Public
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .select('orderNumber status statusHistory items total customer.name createdAt');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.deleteOne();

    // Emit socket event
    if (req.io) {
      req.io.emit('orderDeleted', req.params.id);
    }

    res.json({
      success: true,
      message: 'Order deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
