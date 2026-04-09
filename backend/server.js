require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./config/app');

const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join admin room for notifications
  socket.on('joinAdmin', () => {
    socket.join('admin');
    console.log('Admin joined:', socket.id);
  });

  // Handle order status updates
  socket.on('updateOrderStatus', (data) => {
    io.emit('orderUpdated', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🍰 Dear Desserts API Server                     ║
║                                                   ║
║   Server running on port ${PORT}                    ║
║   Environment: ${process.env.NODE_ENV || 'development'}                   ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
